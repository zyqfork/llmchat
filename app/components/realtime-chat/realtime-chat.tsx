import VoiceIcon from "@/app/icons/voice.svg";
import VoiceOffIcon from "@/app/icons/voice-off.svg";
import PowerIcon from "@/app/icons/power.svg";

import styles from "./realtime-chat.module.scss";
import clsx from "clsx";

import { useState, useRef, useEffect, useCallback } from "react";

import { useChatStore, createMessage, useAppConfig } from "@/app/store";
import Locale from "@/app/locales";

import { IconButton } from "@/app/components/button";

import {
  Modality,
  RTClient,
  RTInputAudioItem,
  RTResponse,
  TurnDetection,
} from "rt-client";
import { AudioHandler } from "@/app/lib/audio";
import { uploadImage } from "@/app/utils/chat";
import { VoicePrint } from "@/app/components/voice-print";
import { ServiceProvider } from "@/app/constant";
import { QwenOmniRealtimeClient } from "@/app/lib/qwen-omni-realtime-client";
import { logger } from "@/app/utils/logger";
import { installDesktopWebSocketOverride } from "@/app/utils/desktop-websocket";

function nextVoiceTurnId() {
  return `vt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** 用户气泡插在末尾时，仍要把助手 transcript 接到「最后一个流式助手」上，而非只看 last */
function findLastStreamingAssistantIndex(turns: OmniVoiceTurn[]): number {
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t?.role === "assistant" && t.isStreaming) return i;
  }
  return -1;
}

type OmniVoiceTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

interface RealtimeChatProps {
  onClose?: () => void;
  onStartVoice?: () => void;
  onPausedVoice?: () => void;
}

export function RealtimeChat({
  onClose,
  onStartVoice,
  onPausedVoice,
}: RealtimeChatProps) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const [status, setStatus] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [modality, setModality] = useState("audio");
  const [useVAD, setUseVAD] = useState(true);
  const [frequencies, setFrequencies] = useState<Uint8Array | undefined>();
  const [voiceTurns, setVoiceTurns] = useState<OmniVoiceTurn[]>([]);

  const clientRef = useRef<RTClient | null>(null);
  const qwenOmniClientRef = useRef<QwenOmniRealtimeClient | null>(null);
  const omniPlaybackHandlerRef = useRef<AudioHandler | null>(null);
  const omniPlaybackPrimedRef = useRef(false);
  const audioHandlerRef = useRef<AudioHandler | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const temperature = config.realtimeConfig.temperature;
  const apiKey = config.realtimeConfig.apiKey;
  const model = config.realtimeConfig.model;
  const provider = config.realtimeConfig.provider;
  const azure = provider === ServiceProvider.Azure.id;
  const isQwen = provider === ServiceProvider.Alibaba.id;
  const azureEndpoint = config.realtimeConfig.azure.endpoint;
  const azureDeployment = config.realtimeConfig.azure.deployment;
  const voice = config.realtimeConfig.voice;

  // 通义千问 Realtime：设置页仅保留 Omni（语音进 + 语音出 + 可读文本）
  const qwenModel =
    config.realtimeConfig.qwen?.model || "qwen3.5-omni-plus-realtime";
  const qwenVoice = config.realtimeConfig.qwen?.voice || "Cherry";
  const qwenRegion = config.realtimeConfig.qwen?.region || "beijing";
  const qwenRegionLabel =
    qwenRegion === "singapore"
      ? Locale.Settings.Realtime.Qwen.Region.Singapore
      : Locale.Settings.Realtime.Qwen.Region.Beijing;
  const isQwenOmni = isQwen;

  useEffect(() => {
    if (!isQwenOmni) return;
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isQwenOmni, voiceTurns]);

  const disconnectQwenOmni = async () => {
    if (!qwenOmniClientRef.current) return;
    try {
      if (qwenOmniClientRef.current.isReady()) {
        qwenOmniClientRef.current.finishSession();
      }
      qwenOmniClientRef.current.close();
      qwenOmniClientRef.current = null;
      omniPlaybackPrimedRef.current = false;
      setVoiceTurns([]);
      setIsConnected(false);
    } catch (error) {
      logger.error("Qwen Omni disconnect failed:", error);
    }
  };

  const handleConnectQwenOmni = async () => {
    if (isConnecting) return;
    if (!isConnected) {
      try {
        setIsConnecting(true);
        setStatus("Connecting to Qwen Omni...");
        qwenOmniClientRef.current = new QwenOmniRealtimeClient(
          {
            model: qwenModel,
            apiKey,
            voice: qwenVoice,
            region: qwenRegion as "beijing" | "singapore",
            useServerVad: useVAD,
            modalities: ["text", "audio"],
            transcriptionLanguage:
              config.realtimeConfig.qwen?.asrLanguage ?? "zh",
            vadThreshold: 0.5,
            vadSilenceDurationMs: 800,
            vadPrefixPaddingMs: 450,
          },
          {
            onOpen: () => {
              logger.debug("[QwenOmni] Connected");
            },
            onClose: (code, reason) => {
              logger.debug("[QwenOmni] Disconnected:", code, reason);
              setIsConnected(false);
              setVoiceTurns([]);
              setStatus("Disconnected");
            },
            onPartialUserTranscript: (text) => {
              setVoiceTurns((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "user" && last.isStreaming) {
                  next[next.length - 1] = { ...last, content: text };
                  return next;
                }
                next.push({
                  id: nextVoiceTurnId(),
                  role: "user",
                  content: text,
                  isStreaming: true,
                });
                return next;
              });
              setStatus("");
            },
            onUserTranscriptCompleted: (transcript) => {
              setVoiceTurns((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "user" && last.isStreaming) {
                  next[next.length - 1] = {
                    ...last,
                    content: transcript,
                    isStreaming: false,
                  };
                  return next;
                }
                next.push({
                  id: nextVoiceTurnId(),
                  role: "user",
                  content: transcript,
                  isStreaming: false,
                });
                return next;
              });
              setStatus("");
            },
            onResponseCreated: () => {
              omniPlaybackPrimedRef.current = false;
              setVoiceTurns((prev) => {
                const next = [...prev];
                const stale = findLastStreamingAssistantIndex(next);
                if (stale >= 0) {
                  next[stale] = { ...next[stale]!, isStreaming: false };
                }
                next.push({
                  id: nextVoiceTurnId(),
                  role: "assistant",
                  content: "",
                  isStreaming: true,
                });
                return next;
              });
            },
            onAssistantTranscriptDelta: (delta) => {
              setVoiceTurns((prev) => {
                const next = [...prev];
                const idx = findLastStreamingAssistantIndex(next);
                if (idx >= 0) {
                  const cur = next[idx]!;
                  next[idx] = { ...cur, content: cur.content + delta };
                  return next;
                }
                next.push({
                  id: nextVoiceTurnId(),
                  role: "assistant",
                  content: delta,
                  isStreaming: true,
                });
                return next;
              });
            },
            onAssistantTranscriptDone: (full) => {
              const trimmed = full.trim();
              setVoiceTurns((prev) => {
                const next = [...prev];
                const idx = findLastStreamingAssistantIndex(next);
                if (idx >= 0) {
                  const cur = next[idx]!;
                  next[idx] = {
                    ...cur,
                    content: trimmed || cur.content,
                    isStreaming: false,
                  };
                }
                return next;
              });
            },
            onAssistantAudioDelta: (pcm) => {
              if (!omniPlaybackPrimedRef.current) {
                omniPlaybackPrimedRef.current = true;
                omniPlaybackHandlerRef.current?.startStreamingPlayback();
              }
              omniPlaybackHandlerRef.current?.playChunk(pcm);
            },
            // 勿在 response.done 时 stop：服务端结束早于本地排程播放完会截断语音。
            onResponseDone: () => {
              omniPlaybackPrimedRef.current = false;
            },
            onError: (error) => {
              logger.error("[QwenOmni] Error:", error);
              setStatus(`Error: ${error.message}`);
            },
          },
        );

        await qwenOmniClientRef.current.connect();
        await Promise.race([
          qwenOmniClientRef.current.waitForSessionConfigured(),
          new Promise<void>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "等待服务端确认会话超时（未收到 session 确认，请检查网络与 API Key）",
                  ),
                ),
              10000,
            ),
          ),
        ]);
        setIsConnected(true);
        setStatus("");
      } catch (error) {
        logger.error("Qwen Omni connection failed:", error);
        const msg =
          error instanceof Error ? error.message : "Connection failed";
        setStatus(msg);
      } finally {
        setIsConnecting(false);
      }
    } else {
      await disconnectQwenOmni();
    }
  };

  const handleConnect = async () => {
    if (isQwenOmni) {
      return handleConnectQwenOmni();
    }

    if (isConnecting) return;
    if (!isConnected) {
      try {
        setIsConnecting(true);
        clientRef.current = azure
          ? new RTClient(
              new URL(azureEndpoint),
              { key: apiKey },
              { deployment: azureDeployment },
            )
          : new RTClient({ key: apiKey }, { model });
        const modalities: Modality[] =
          modality === "audio" ? ["text", "audio"] : ["text"];
        const turnDetection: TurnDetection = useVAD
          ? { type: "server_vad" }
          : null;
        await clientRef.current.configure({
          instructions: "",
          voice,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: turnDetection,
          tools: [],
          temperature,
          modalities,
        });
        startResponseListener();

        setIsConnected(true);
      } catch (error) {
        logger.error("Connection failed:", error);
        setStatus("Connection failed");
      } finally {
        setIsConnecting(false);
      }
    } else {
      await disconnect();
    }
  };

  const disconnect = async () => {
    await disconnectQwenOmni();

    if (clientRef.current) {
      try {
        await clientRef.current.close();
        clientRef.current = null;
        setIsConnected(false);
      } catch (error) {
        logger.error("Disconnect failed:", error);
      }
    }
  };

  const handleInputAudio = useCallback(
    async (item: RTInputAudioItem) => {
      await item.waitForCompletion();
      if (item.transcription) {
        const userMessage = createMessage({
          role: "user",
          content: item.transcription,
        });
        chatStore.updateTargetSession(session, (session) => {
          session.messages = session.messages.concat([userMessage]);
        });
        // save input audio_url, and update session
        const { audioStartMillis, audioEndMillis } = item;
        // upload audio get audio_url
        const blob = audioHandlerRef.current?.saveRecordFile(
          audioStartMillis,
          audioEndMillis,
        );
        uploadImage(blob!).then((audio_url) => {
          userMessage.audio_url = audio_url;
          chatStore.updateTargetSession(session, (session) => {
            session.messages = session.messages.concat();
          });
        });
      }
      // stop streaming play after get input audio.
      audioHandlerRef.current?.stopStreamingPlayback();
    },
    [chatStore, session],
  );

  const handleResponse = useCallback(
    async (response: RTResponse) => {
      for await (const item of response) {
        if (item.type === "message" && item.role === "assistant") {
          const botMessage = createMessage({
            role: item.role,
            content: "",
          });
          // add bot message first
          chatStore.updateTargetSession(session, (session) => {
            session.messages = session.messages.concat([botMessage]);
          });
          let hasAudio = false;
          for await (const content of item) {
            if (content.type === "text") {
              for await (const text of content.textChunks()) {
                botMessage.content += text;
              }
            } else if (content.type === "audio") {
              const textTask = async () => {
                for await (const text of content.transcriptChunks()) {
                  botMessage.content += text;
                }
              };
              const audioTask = async () => {
                audioHandlerRef.current?.startStreamingPlayback();
                for await (const audio of content.audioChunks()) {
                  hasAudio = true;
                  audioHandlerRef.current?.playChunk(audio);
                }
              };
              await Promise.all([textTask(), audioTask()]);
            }
            // update message.content
            chatStore.updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          }
          if (hasAudio) {
            // upload audio get audio_url
            const blob = audioHandlerRef.current?.savePlayFile();
            uploadImage(blob!).then((audio_url) => {
              botMessage.audio_url = audio_url;
              // update text and audio_url
              chatStore.updateTargetSession(session, (session) => {
                session.messages = session.messages.concat();
              });
            });
          }
        }
      }
    },
    [chatStore, session],
  );

  const startResponseListener = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      for await (const serverEvent of clientRef.current.events()) {
        if (serverEvent.type === "response") {
          await handleResponse(serverEvent);
        } else if (serverEvent.type === "input_audio") {
          await handleInputAudio(serverEvent);
        }
      }
    } catch (error) {
      if (clientRef.current) {
        logger.error("Response iteration error:", error);
      }
    }
  }, [handleInputAudio, handleResponse]);

  const toggleRecording = useCallback(async () => {
    if (isQwenOmni) {
      const wsClient = qwenOmniClientRef.current;
      if (!isRecording && wsClient?.isReady()) {
        try {
          if (!audioHandlerRef.current) {
            audioHandlerRef.current = new AudioHandler({
              recordingSampleRate: 16000,
              preferVoiceIsolation: true,
            });
            await audioHandlerRef.current.initialize();
          }
          await audioHandlerRef.current.startRecording((chunk) => {
            qwenOmniClientRef.current?.appendPcmChunk(chunk);
          });
          setIsRecording(true);
          onStartVoice?.();
        } catch (error) {
          logger.error("Failed to start Qwen Omni recording:", error);
        }
      } else if (isRecording && audioHandlerRef.current) {
        try {
          audioHandlerRef.current.stopRecording();
          if (!useVAD) {
            qwenOmniClientRef.current?.commitAudioBuffer();
          }
          setIsRecording(false);
          onPausedVoice?.();
        } catch (error) {
          logger.error("Failed to stop Qwen Omni recording:", error);
        }
      }
      return;
    }

    if (!isRecording && clientRef.current) {
      try {
        if (!audioHandlerRef.current) {
          audioHandlerRef.current = new AudioHandler();
          await audioHandlerRef.current.initialize();
        }
        await audioHandlerRef.current.startRecording(async (chunk) => {
          await clientRef.current?.sendAudio(chunk);
        });
        setIsRecording(true);
      } catch (error) {
        logger.error("Failed to start recording:", error);
      }
    } else if (audioHandlerRef.current) {
      try {
        audioHandlerRef.current.stopRecording();
        if (!useVAD) {
          const inputAudio = await clientRef.current?.commitAudio();
          await handleInputAudio(inputAudio!);
          await clientRef.current?.generateResponse();
        }
        setIsRecording(false);
      } catch (error) {
        logger.error("Failed to stop recording:", error);
      }
    }
  }, [
    isRecording,
    useVAD,
    handleInputAudio,
    isQwenOmni,
    onStartVoice,
    onPausedVoice,
  ]);

  useEffect(() => {
    installDesktopWebSocketOverride();
    // 防止重复初始化
    if (initRef.current) return;
    initRef.current = true;

    const initAudioHandler = async () => {
      if (!isQwen) {
        const handler = new AudioHandler();
        await handler.initialize();
        audioHandlerRef.current = handler;
        await handleConnect();
      } else if (isQwenOmni) {
        // 与 WebSocket 建连并行，缩短打开面板后首轮语音前的串行等待
        await Promise.all([
          (async () => {
            const handler = new AudioHandler({
              recordingSampleRate: 16000,
              preferVoiceIsolation: true,
            });
            await handler.initialize();
            audioHandlerRef.current = handler;
            const playHandler = new AudioHandler({
              recordingSampleRate: 24000,
            });
            await playHandler.initialize();
            omniPlaybackHandlerRef.current = playHandler;
          })(),
          handleConnect(),
        ]);
      } else {
        await handleConnect();
      }
      if (!isQwen || isQwenOmni) {
        await toggleRecording();
      }
    };

    initAudioHandler().catch((error) => {
      setStatus(error);
      logger.error(error);
    });

    return () => {
      if (isRecording) {
        toggleRecording();
      }
      audioHandlerRef.current?.close().catch(logger.error);
      omniPlaybackHandlerRef.current?.close().catch(logger.error);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    if (isConnected && isRecording) {
      const animationFrame = () => {
        if (audioHandlerRef.current) {
          const freqData = audioHandlerRef.current.getByteFrequencyData();
          setFrequencies(freqData);
        }
        animationFrameId = requestAnimationFrame(animationFrame);
      };

      animationFrameId = requestAnimationFrame(animationFrame);
    } else {
      setFrequencies(undefined);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isConnected, isRecording]);

  // update session params
  useEffect(() => {
    if (!isQwen) {
      clientRef.current?.configure({ voice });
    }
  }, [voice, isQwen]);
  useEffect(() => {
    if (!isQwen) {
      clientRef.current?.configure({ temperature });
    }
  }, [temperature, isQwen]);

  const handleClose = async () => {
    onClose?.();
    if (isRecording) {
      await toggleRecording();
    }
    disconnect().catch(logger.error);
  };

  return (
    <div className={styles["realtime-chat"]}>
      {isQwenOmni && (
        <div className={styles["transcript-panel"]}>
          <div className={styles["voice-log-meta"]}>
            <span className={styles["voice-log-chip"]}>
              {Locale.Settings.Realtime.LiveTranscript.ModelBadge}: {qwenModel}
            </span>
            <span className={styles["voice-log-chip"]}>
              {Locale.Settings.Realtime.LiveTranscript.RegionBadge}:{" "}
              {qwenRegionLabel}
            </span>
          </div>
          <p className={styles["transcript-hint"]}>
            {Locale.Settings.Realtime.LiveTranscript.Hint}{" "}
            {Locale.Settings.Realtime.LiveTranscript.SessionIsolationHint}
          </p>
          <div className={styles["voice-log-scroll"]} aria-live="polite">
            {voiceTurns.length === 0 ? (
              <div className={styles["voice-log-empty"]}>
                {isRecording
                  ? Locale.Settings.Realtime.LiveTranscript.You + " …"
                  : "\u2014"}
              </div>
            ) : (
              voiceTurns.map((turn) => (
                <div
                  key={turn.id}
                  className={clsx(
                    styles["voice-turn"],
                    turn.role === "user"
                      ? styles["voice-turn-user"]
                      : styles["voice-turn-assistant"],
                    turn.isStreaming && styles["voice-turn-streaming"],
                  )}
                >
                  <div className={styles["voice-turn-role"]}>
                    {turn.role === "user"
                      ? Locale.Settings.Realtime.LiveTranscript.You
                      : Locale.Settings.Realtime.LiveTranscript.Assistant}
                    {turn.isStreaming ? " …" : ""}
                  </div>
                  <div className={styles["voice-turn-text"]}>
                    {turn.content || (turn.isStreaming ? "\u22ef" : "\u2014")}
                  </div>
                </div>
              ))
            )}
            <div
              ref={transcriptEndRef}
              className={styles["transcript-anchor"]}
            />
          </div>
        </div>
      )}
      <div
        className={clsx(styles["circle-mic"], {
          [styles["pulse"]]: isRecording,
        })}
      >
        <VoicePrint frequencies={frequencies} isActive={isRecording} />
      </div>

      <div className={styles["bottom-icons"]}>
        <div>
          <IconButton
            icon={isRecording ? <VoiceIcon /> : <VoiceOffIcon />}
            onClick={toggleRecording}
            disabled={!isConnected}
            shadow
            bordered
          />
        </div>
        <div className={styles["icon-center"]}>{status}</div>
        <div>
          <IconButton
            icon={<PowerIcon />}
            onClick={handleClose}
            shadow
            bordered
          />
        </div>
      </div>
    </div>
  );
}
