/**
 * 通义千问实时语音识别（DashScope WebSocket，与 OpenAI Realtime 风格事件对齐）
 * 文档: https://help.aliyun.com/zh/model-studio/qwen-real-time-speech-recognition
 */

import { logger } from "@/app/utils/logger";

export const QWEN_ASR_REALTIME_MODELS = [
  "qwen3-asr-flash-realtime",
  "qwen3-asr-flash-realtime-2026-02-10",
  "qwen3-asr-flash-realtime-2025-10-27",
] as const;

export function isQwenAsrRealtimeModel(model: string): boolean {
  return model.includes("-asr-") && model.includes("realtime");
}

export interface QwenAsrRealtimeConfig {
  model: string;
  apiKey: string;
  region?: "beijing" | "singapore";
  /** 识别语言，如 zh、en */
  language?: string;
  /** 与服务端 VAD 一致 */
  useServerVad?: boolean;
}

export interface QwenAsrRealtimeCallbacks {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onSessionCreated?: (sessionId: string) => void;
  onSessionUpdated?: () => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (transcript: string) => void;
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

export class QwenAsrRealtimeClient {
  private ws: WebSocket | null = null;
  private config: QwenAsrRealtimeConfig;
  private callbacks: QwenAsrRealtimeCallbacks;
  private sessionId: string | null = null;
  private isConnected = false;
  private eventId = 0;
  private sessionConfiguredPromise: Promise<void> | null = null;
  private resolveSessionConfigured: (() => void) | null = null;

  constructor(
    config: QwenAsrRealtimeConfig,
    callbacks: QwenAsrRealtimeCallbacks = {},
  ) {
    this.config = {
      region: "beijing",
      language: "zh",
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

  /** session.updated 与 session.created 只触发一次，避免服务端仅用其一应答时永久卡住 */
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
          logger.debug("[QwenASR] WebSocket connected");
          this.isConnected = true;
          this.callbacks.onOpen?.();
          this.sendSessionUpdate();
          resolve();
        };

        this.ws.onclose = (event) => {
          logger.debug("[QwenASR] WebSocket closed:", event.code, event.reason);
          this.isConnected = false;
          this.callbacks.onClose?.(event.code, event.reason);
        };

        this.ws.onerror = (event) => {
          logger.error("[QwenASR] WebSocket error:", event);
          this.callbacks.onError?.(new Error("WebSocket connection error"));
          reject(new Error("WebSocket connection error"));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      const type = message.type as string;

      switch (type) {
        case "session.created":
          this.sessionId = message.session?.id ?? null;
          logger.debug("[QwenASR] Session created:", this.sessionId);
          this.callbacks.onSessionCreated?.(this.sessionId || "");
          this.notifySessionConfigured();
          break;

        case "session.updated":
          logger.debug("[QwenASR] Session updated");
          this.notifySessionConfigured();
          this.callbacks.onSessionUpdated?.();
          break;

        case "conversation.item.input_audio_transcription.text": {
          const text = `${message.text ?? ""}${message.stash ?? ""}`.trim();
          if (text) {
            this.callbacks.onPartialTranscript?.(text);
          }
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const transcript = (message.transcript ?? "").trim();
          if (transcript) {
            this.callbacks.onFinalTranscript?.(transcript);
          }
          break;
        }

        case "input_audio_buffer.speech_started":
          this.callbacks.onSpeechStarted?.();
          break;

        case "input_audio_buffer.speech_stopped":
          this.callbacks.onSpeechStopped?.();
          break;

        case "session.finished":
          logger.debug("[QwenASR] Session finished");
          break;

        case "error":
          logger.error("[QwenASR] Error:", message.error);
          this.callbacks.onError?.(
            new Error(message.error?.message ?? "Unknown ASR error"),
          );
          break;

        default:
          logger.debug("[QwenASR] Event:", type);
      }
    } catch (e) {
      logger.error("[QwenASR] Parse error:", e);
    }
  }

  private sendEvent(event: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.error("[QwenASR] WebSocket not connected");
      return;
    }
    event.event_id = this.generateEventId();
    this.ws.send(JSON.stringify(event));
  }

  private sendSessionUpdate() {
    const vad =
      this.config.useServerVad !== false
        ? {
            type: "server_vad",
            threshold: 0.0,
            silence_duration_ms: 400,
          }
        : null;

    this.sendEvent({
      type: "session.update",
      session: {
        modalities: ["text"],
        input_audio_format: "pcm",
        sample_rate: 16000,
        input_audio_transcription: {
          language: this.config.language ?? "zh",
        },
        turn_detection: vad,
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
