/**
 * 通义 Qwen-Omni-Realtime 全模态实时对话（DashScope WebSocket）
 * 文档: https://help.aliyun.com/zh/model-studio/qwen-real-time-speech-chat
 */

import { logger } from "@/app/utils/logger";

export const QWEN_OMNI_REALTIME_MODELS = [
  "qwen3.5-omni-plus-realtime",
  "qwen3.5-omni-flash-realtime",
  "qwen3-omni-flash-realtime",
] as const;

export function isQwenOmniRealtimeModel(model: string): boolean {
  return model.includes("omni") && model.includes("realtime");
}

export interface QwenOmniRealtimeConfig {
  model: string;
  apiKey: string;
  voice: string;
  region?: "beijing" | "singapore";
  /** 输出模态，默认文本+语音 */
  modalities?: ("text" | "audio")[];
  /** 与 ASR 一致：手动模式传 false，由客户端 commit */
  useServerVad?: boolean;
  instructions?: string;
  /** 用户语音转写主语言（与百炼 SDK transcription_params.language 一致） */
  transcriptionLanguage?: string;
  /** VAD 阈值；官方示例多为 0.5，嘈杂环境可调高（如 0.65–0.75） */
  vadThreshold?: number;
  /** 判停静音时长（毫秒），官方示例多为 800；加长可减少旁人插话误切段 */
  vadSilenceDurationMs?: number;
  vadPrefixPaddingMs?: number;
}

export interface QwenOmniRealtimeCallbacks {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onSessionCreated?: (sessionId: string) => void;
  onSessionUpdated?: () => void;
  /** 用户语音正在识别（流式） */
  onPartialUserTranscript?: (text: string) => void;
  /** 用户语音转写完成 */
  onUserTranscriptCompleted?: (transcript: string) => void;
  /** 助手文本流（音频模态下多为 audio_transcript） */
  onAssistantTranscriptDelta?: (delta: string) => void;
  onAssistantTranscriptDone?: (fullText: string) => void;
  /** PCM int16 流（24kHz） */
  onAssistantAudioDelta?: (pcm: Uint8Array) => void;
  onAssistantAudioDone?: () => void;
  onResponseCreated?: () => void;
  onResponseDone?: () => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onError?: (error: Error) => void;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function decodeBase64ToUint8(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

export class QwenOmniRealtimeClient {
  private ws: WebSocket | null = null;
  private config: QwenOmniRealtimeConfig;
  private callbacks: QwenOmniRealtimeCallbacks;
  private sessionId: string | null = null;
  private isConnected = false;
  private eventId = 0;
  private sessionConfiguredPromise: Promise<void> | null = null;
  private resolveSessionConfigured: (() => void) | null = null;

  constructor(
    config: QwenOmniRealtimeConfig,
    callbacks: QwenOmniRealtimeCallbacks = {},
  ) {
    this.config = {
      region: "beijing",
      modalities: ["text", "audio"],
      useServerVad: true,
      ...config,
    };
    this.callbacks = callbacks;
  }

  private getWebSocketUrl(): string {
    const baseUrl =
      this.config.region === "singapore"
        ? "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime"
        : "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";
    return `${baseUrl}?model=${encodeURIComponent(this.config.model)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${this.eventId++}`;
  }

  waitForSessionConfigured(): Promise<void> {
    return this.sessionConfiguredPromise ?? Promise.resolve();
  }

  private notifySessionConfigured() {
    if (!this.resolveSessionConfigured) return;
    const done = this.resolveSessionConfigured;
    this.resolveSessionConfigured = null;
    done();
  }

  async connect(): Promise<void> {
    this.sessionConfiguredPromise = new Promise<void>((resolve) => {
      this.resolveSessionConfigured = resolve;
    });

    return new Promise((resolve, reject) => {
      try {
        const url = this.getWebSocketUrl();
        this.ws = new WebSocket(url, [
          "realtime",
          `api-key.${this.config.apiKey}`,
        ]);

        this.ws.onopen = () => {
          logger.debug("[QwenOmni] WebSocket connected");
          this.isConnected = true;
          this.callbacks.onOpen?.();
          this.sendSessionUpdate();
          resolve();
        };

        this.ws.onclose = (event) => {
          logger.debug(
            "[QwenOmni] WebSocket closed:",
            event.code,
            event.reason,
          );
          this.isConnected = false;
          this.callbacks.onClose?.(event.code, event.reason);
        };

        this.ws.onerror = (event) => {
          logger.error("[QwenOmni] WebSocket error:", event);
          this.callbacks.onError?.(new Error("WebSocket connection error"));
          reject(new Error("WebSocket connection error"));
        };

        this.ws.onmessage = (event) => {
          if (typeof event.data === "string") {
            this.handleMessage(event.data);
          } else {
            logger.debug("[QwenOmni] Non-text frame ignored");
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data) as Record<string, unknown>;
      const type = message.type as string;

      switch (type) {
        case "session.created":
          this.sessionId =
            (message.session as { id?: string } | undefined)?.id ?? null;
          logger.debug("[QwenOmni] Session created:", this.sessionId);
          this.callbacks.onSessionCreated?.(this.sessionId || "");
          // 就绪以 session.updated 为准：表示服务端已对 session.update 校验并生效后再送音频更稳
          break;

        case "session.updated":
          logger.debug("[QwenOmni] Session updated");
          this.notifySessionConfigured();
          this.callbacks.onSessionUpdated?.();
          break;

        case "input_audio_buffer.speech_started":
          this.callbacks.onSpeechStarted?.();
          break;

        case "input_audio_buffer.speech_stopped":
          this.callbacks.onSpeechStopped?.();
          break;

        case "conversation.item.input_audio_transcription.text": {
          const text = `${message.text ?? ""}${message.stash ?? ""}`.trim();
          if (text) this.callbacks.onPartialUserTranscript?.(text);
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const transcript = String(message.transcript ?? "").trim();
          if (transcript) {
            this.callbacks.onUserTranscriptCompleted?.(transcript);
          }
          break;
        }

        case "response.created":
          this.callbacks.onResponseCreated?.();
          break;

        case "response.text.delta": {
          const delta = String(message.delta ?? "");
          if (delta) this.callbacks.onAssistantTranscriptDelta?.(delta);
          break;
        }

        case "response.text.done": {
          const full = String(
            (message as { text?: string }).text ?? message.transcript ?? "",
          );
          if (full) this.callbacks.onAssistantTranscriptDone?.(full);
          break;
        }

        case "response.audio_transcript.delta": {
          const delta = String(message.delta ?? "");
          if (delta) this.callbacks.onAssistantTranscriptDelta?.(delta);
          break;
        }

        case "response.audio_transcript.done": {
          const full = String(message.transcript ?? "").trim();
          if (full) this.callbacks.onAssistantTranscriptDone?.(full);
          break;
        }

        case "response.audio.delta": {
          const b64 = String(message.delta ?? "");
          if (!b64) break;
          const pcm = decodeBase64ToUint8(b64);
          if (pcm?.byteLength) this.callbacks.onAssistantAudioDelta?.(pcm);
          break;
        }

        case "response.audio.done":
          this.callbacks.onAssistantAudioDone?.();
          break;

        case "response.done":
          this.callbacks.onResponseDone?.();
          break;

        case "session.finished":
          logger.debug("[QwenOmni] Session finished");
          break;

        case "error":
          logger.error("[QwenOmni] Error:", message.error);
          this.callbacks.onError?.(
            new Error(
              String(
                (message.error as { message?: string })?.message ??
                  "Unknown Omni error",
              ),
            ),
          );
          break;

        default:
          logger.debug("[QwenOmni] Event:", type);
      }
    } catch (e) {
      logger.error("[QwenOmni] Parse error:", e);
    }
  }

  private sendEvent(event: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.error("[QwenOmni] WebSocket not connected");
      return;
    }
    event.event_id = this.generateEventId();
    this.ws.send(JSON.stringify(event));
  }

  private vadType(): "semantic_vad" | "server_vad" {
    const m = this.config.model.toLowerCase();
    if (m.includes("3.5") || m.includes("qwen3.5")) {
      return "semantic_vad";
    }
    return "server_vad";
  }

  private sendSessionUpdate() {
    const vadKind = this.vadType();
    const defaultThreshold =
      vadKind === "semantic_vad" ? 0.5 : Math.max(0.35, 0.2);
    const turn_detection =
      this.config.useServerVad !== false
        ? {
            type: vadKind,
            threshold: this.config.vadThreshold ?? defaultThreshold,
            prefix_padding_ms: this.config.vadPrefixPaddingMs ?? 450,
            silence_duration_ms: this.config.vadSilenceDurationMs ?? 800,
          }
        : null;

    const modalities = this.config.modalities ?? ["text", "audio"];

    // 与 dashscope-sdk OmniRealtimeConversation.update_session 对齐：
    // input/output_audio_format 使用 pcm16，而非字面量 "pcm"
    this.sendEvent({
      type: "session.update",
      session: {
        modalities,
        voice: this.config.voice,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        sample_rate: 16000,
        input_audio_transcription: {
          language: this.config.transcriptionLanguage ?? "zh",
        },
        instructions:
          this.config.instructions?.trim() ||
          "你是一个友善、简洁的中文语音助手，请用自然口语回答问题。",
        turn_detection,
      },
    });
  }

  appendPcmChunk(chunk: Uint8Array) {
    if (!chunk.byteLength) return;
    const audio = uint8ToBase64(chunk);
    this.sendEvent({
      type: "input_audio_buffer.append",
      audio,
    });
  }

  commitAudioBuffer() {
    this.sendEvent({
      type: "input_audio_buffer.commit",
    });
  }

  finishSession() {
    this.sendEvent({
      type: "session.finish",
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }

  isReady(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}
