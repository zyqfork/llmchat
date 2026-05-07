import VoiceIcon from "@/app/icons/voice.svg";
import VoiceOffIcon from "@/app/icons/voice-off.svg";
import PowerIcon from "@/app/icons/power.svg";

import styles from "./realtime-chat.module.scss";
import clsx from "clsx";

import { useState, useRef, useEffect, useCallback } from "react";

import { useChatStore, createMessage, useAppConfig } from "@/app/store";

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
import { QwenRealtimeClient } from "@/app/lib/qwen-realtime-client";
import {
  QwenAsrRealtimeClient,
  isQwenAsrRealtimeModel,
} from "@/app/lib/qwen-asr-realtime-client";
import { logger } from "@/app/utils/logger";
import { installDesktopWebSocketOverride } from "@/app/utils/desktop-websocket";

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

  const clientRef = useRef<RTClient | null>(null);
  const qwenClientRef = useRef<QwenRealtimeClient | null>(null);
  const qwenAsrClientRef = useRef<QwenAsrRealtimeClient | null>(null);
  const audioHandlerRef = useRef<AudioHandler | null>(null);
  const initRef = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // 通义千问 TTS 音频播放相关
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const temperature = config.realtimeConfig.temperature;
  const apiKey = config.realtimeConfig.apiKey;
  const model = config.realtimeConfig.model;
  const provider = config.realtimeConfig.provider;
  const azure = provider === ServiceProvider.Azure.id;
  const isQwen = provider === ServiceProvider.Alibaba.id;
  const azureEndpoint = config.realtimeConfig.azure.endpoint;
  const azureDeployment = config.realtimeConfig.azure.deployment;
  const voice = config.realtimeConfig.voice;

  // 通义千问配置
  const qwenModel =
    config.realtimeConfig.qwen?.model || "qwen3-asr-flash-realtime";
  const qwenVoice = config.realtimeConfig.qwen?.voice || "Cherry";
  const qwenRegion = config.realtimeConfig.qwen?.region || "beijing";
  const isQwenAsr = isQwen && isQwenAsrRealtimeModel(qwenModel);
  const isQwenTts = isQwen && !isQwenAsrRealtimeModel(qwenModel);

  // 播放 PCM 音频数据
  const playPcmAudio = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;

    // 将 PCM 16-bit 数据转换为 Float32
    const int16Array = new Int16Array(audioData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    // 创建音频缓冲区
    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    // 播放音频
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  }, []);

  // 处理通义千问音频队列
  const processQwenAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (audioData) {
        await playPcmAudio(audioData);
        // 等待一小段时间让音频播放
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    isPlayingRef.current = false;
  }, [playPcmAudio]);

  const disconnectQwenAsr = async () => {
    if (!qwenAsrClientRef.current) return;
    try {
      if (qwenAsrClientRef.current.isReady()) {
        qwenAsrClientRef.current.finishSession();
      }
      qwenAsrClientRef.current.close();
      qwenAsrClientRef.current = null;
      setIsConnected(false);
    } catch (error) {
      logger.error("Qwen ASR disconnect failed:", error);
    }
  };

  const handleConnectQwenAsr = async () => {
    if (isConnecting) return;
    if (!isConnected) {
      try {
        setIsConnecting(true);
        setStatus("Connecting to Qwen ASR...");
        const asrLang = config.realtimeConfig.qwen?.asrLanguage ?? "zh";
        qwenAsrClientRef.current = new QwenAsrRealtimeClient(
          {
            model: qwenModel,
            apiKey,
            region: qwenRegion as "beijing" | "singapore",
            language: asrLang,
            useServerVad: useVAD,
          },
          {
            onOpen: () => {
              logger.debug("[QwenASR] Connected");
            },
            onClose: (code, reason) => {
              logger.debug("[QwenASR] Disconnected:", code, reason);
              setIsConnected(false);
              setStatus("Disconnected");
            },
            onPartialTranscript: (text) => setStatus(text),
            onFinalTranscript: (transcript) => {
              const target = sessionRef.current;
              const userMessage = createMessage({
                role: "user",
                content: transcript,
              });
              chatStore.updateTargetSession(target, (sess) => {
                sess.messages = sess.messages.concat([userMessage]);
              });
              setStatus("");
            },
            onError: (error) => {
              logger.error("[QwenASR] Error:", error);
              setStatus(`Error: ${error.message}`);
            },
          },
        );
        await qwenAsrClientRef.current.connect();
        await Promise.race([
          qwenAsrClientRef.current.waitForSessionConfigured(),
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
        logger.error("Qwen ASR connection failed:", error);
        const msg =
          error instanceof Error ? error.message : "Connection failed";
        setStatus(msg);
      } finally {
        setIsConnecting(false);
      }
    } else {
      await disconnectQwenAsr();
    }
  };

  const handleConnectQwenTts = async () => {
    if (isConnecting) return;
    if (!isConnected) {
      try {
        setIsConnecting(true);
        setStatus("Connecting to Qwen...");

        qwenClientRef.current = new QwenRealtimeClient(
          {
            model: qwenModel,
            apiKey: apiKey,
            voice: qwenVoice as any,
            mode: "server_commit",
            region: qwenRegion as "beijing" | "singapore",
          },
          {
            onOpen: () => {
              logger.debug("[QwenRealtime] Connected");
              setStatus("Connected");
            },
            onClose: (code, reason) => {
              logger.debug("[QwenRealtime] Disconnected:", code, reason);
              setIsConnected(false);
              setStatus("Disconnected");
            },
            onSessionCreated: (sessionId) => {
              logger.debug("[QwenRealtime] Session created:", sessionId);
            },
            onAudioDelta: (audioData) => {
              audioQueueRef.current.push(audioData);
              processQwenAudioQueue();
            },
            onAudioDone: () => {
              logger.debug("[QwenRealtime] Audio done");
            },
            onResponseDone: () => {
              logger.debug("[QwenRealtime] Response done");
            },
            onError: (error) => {
              logger.error("[QwenRealtime] Error:", error);
              setStatus(`Error: ${error.message}`);
            },
          },
        );

        await qwenClientRef.current.connect();
        setIsConnected(true);
        setStatus("Connected to Qwen TTS");
      } catch (error) {
        logger.error("Qwen connection failed:", error);
        setStatus("Connection failed");
      } finally {
        setIsConnecting(false);
      }
    } else {
      await disconnectQwenTts();
    }
  };

  const disconnectQwenTts = async () => {
    if (qwenClientRef.current) {
      try {
        qwenClientRef.current.close();
        qwenClientRef.current = null;
        setIsConnected(false);
      } catch (error) {
        logger.error("Qwen disconnect failed:", error);
      }
    }
  };

  const handleConnect = async () => {
    // 兼容旧配置：Realtime Chat 里误选了通义 TTS 模型时，自动回退到 ASR 模型
    if (isQwenTts) {
      const current = config.realtimeConfig.qwen?.model ?? "";
      if (current.includes("-tts-")) {
        config.update((cfg) => {
          if (!cfg.realtimeConfig.qwen) return;
          cfg.realtimeConfig.qwen.model = "qwen3-asr-flash-realtime";
        });
        setStatus("已自动切换为通义实时ASR模型，请重试连接");
        return;
      }
    }

    if (isQwenAsr) {
      return handleConnectQwenAsr();
    }
    if (isQwenTts) {
      return handleConnectQwenTts();
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
    await disconnectQwenAsr();
    await disconnectQwenTts();

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
    if (isQwenAsr) {
      if (!isRecording && qwenAsrClientRef.current?.isReady()) {
        try {
          if (!audioHandlerRef.current) {
            audioHandlerRef.current = new AudioHandler({
              recordingSampleRate: 16000,
            });
            await audioHandlerRef.current.initialize();
          }
          await audioHandlerRef.current.startRecording((chunk) => {
            qwenAsrClientRef.current?.appendPcmChunk(chunk);
          });
          setIsRecording(true);
          onStartVoice?.();
        } catch (error) {
          logger.error("Failed to start Qwen ASR recording:", error);
        }
      } else if (isRecording && audioHandlerRef.current) {
        try {
          audioHandlerRef.current.stopRecording();
          if (!useVAD) {
            qwenAsrClientRef.current?.commitAudioBuffer();
          }
          setIsRecording(false);
          onPausedVoice?.();
        } catch (error) {
          logger.error("Failed to stop Qwen ASR recording:", error);
        }
      }
      return;
    }

    // 通义千问 TTS：演示向服务端提交文本
    if (isQwenTts) {
      if (qwenClientRef.current?.isReady()) {
        qwenClientRef.current.appendText("你好，这是一个测试消息。");
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
    isQwenAsr,
    isQwenTts,
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
      } else if (isQwenAsr) {
        const handler = new AudioHandler({ recordingSampleRate: 16000 });
        await handler.initialize();
        audioHandlerRef.current = handler;
      }
      await handleConnect();
      if (!isQwen || isQwenAsr) {
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
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    if (isConnected && isRecording && (!isQwen || isQwenAsr)) {
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
  }, [isConnected, isRecording, isQwen, isQwenAsr]);

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
      <div
        className={clsx(styles["circle-mic"], {
          [styles["pulse"]]: isRecording || (isQwenTts && isConnected),
        })}
      >
        <VoicePrint
          frequencies={frequencies}
          isActive={isRecording || (isQwenTts && isConnected)}
        />
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
