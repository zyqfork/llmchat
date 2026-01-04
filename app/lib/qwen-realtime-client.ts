/**
 * 通义千问实时语音合成客户端
 * 基于阿里云 DashScope WebSocket API
 * 文档: https://help.aliyun.com/zh/model-studio/qwen-tts-realtime
 */

export type QwenVoice =
  | "Cherry" // 芊悦 - 阳光积极、亲切自然小姐姐
  | "Serena" // 苏瑶 - 温柔小姐姐
  | "Ethan" // 晨煦 - 标准普通话，阳光、温暖
  | "Chelsie" // 千雪 - 二次元虚拟女友
  | "Momo" // 茉兔 - 撒娇搞怪
  | "Vivian" // 十三 - 拽拽的、可爱的小暴躁
  | "Moon" // 月白 - 率性帅气
  | "Maia" // 四月 - 知性与温柔
  | "Kai" // 凯 - 耳朵的一场SPA
  | "Nofish" // 不吃鱼 - 不会翘舌音的设计师
  | "Bella" // 萌宝 - 喝酒不打醉拳的小萝莉
  | "Jennifer" // 詹妮弗 - 品牌级、电影质感般美语女声
  | "Ryan" // 甜茶 - 节奏拉满，戏感炸裂
  | "Katerina" // 卡捷琳娜 - 御姐音色
  | "Aiden" // 艾登 - 精通厨艺的美语大男孩
  | "Elias" // 墨讲师 - 学科严谨性
  | "Jada" // 上海-阿珍 - 风风火火的沪上阿姐
  | "Dylan" // 北京-晓东 - 北京胡同里长大的少年
  | "Sunny" // 四川-晴儿 - 甜到你心里的川妹子
  | "Li" // 南京-老李 - 耐心的瑜伽老师
  | "Marcus" // 陕西-秦川 - 老陕的味道
  | "Roy" // 闽南-阿杰 - 诙谐直爽
  | "Peter" // 天津-李彼得 - 天津相声
  | "Eric" // 四川-程川 - 四川成都男子
  | "Rocky" // 粤语-阿强 - 幽默风趣
  | "Kiki"; // 粤语-阿清 - 甜美的港妹闺蜜

export type QwenAudioFormat = "pcm" | "wav" | "mp3" | "opus";

export type QwenSessionMode = "server_commit" | "commit";

export interface QwenRealtimeConfig {
  model: string;
  apiKey: string;
  voice: QwenVoice;
  mode: QwenSessionMode;
  sampleRate?: number;
  responseFormat?: QwenAudioFormat;
  region?: "beijing" | "singapore";
}

export interface QwenRealtimeCallbacks {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onSessionCreated?: (sessionId: string) => void;
  onAudioDelta?: (audioData: ArrayBuffer) => void;
  onAudioDone?: () => void;
  onResponseDone?: () => void;
  onError?: (error: Error) => void;
}

export class QwenRealtimeClient {
  private ws: WebSocket | null = null;
  private config: QwenRealtimeConfig;
  private callbacks: QwenRealtimeCallbacks;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private eventId: number = 0;

  constructor(
    config: QwenRealtimeConfig,
    callbacks: QwenRealtimeCallbacks = {},
  ) {
    this.config = {
      sampleRate: config.sampleRate ?? 24000,
      responseFormat: config.responseFormat ?? "pcm",
      region: config.region ?? "beijing",
      ...config,
    };
    this.callbacks = callbacks;
  }

  private getWebSocketUrl(): string {
    const baseUrl =
      this.config.region === "singapore"
        ? "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime"
        : "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";
    return `${baseUrl}?model=${this.config.model}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${this.eventId++}`;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.getWebSocketUrl();
        this.ws = new WebSocket(url, [
          "realtime",
          `api-key.${this.config.apiKey}`,
        ]);

        this.ws.onopen = () => {
          console.log("[QwenRealtime] WebSocket connected");
          this.isConnected = true;
          this.callbacks.onOpen?.();
          // 连接成功后更新会话配置
          this.updateSession();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log(
            "[QwenRealtime] WebSocket closed:",
            event.code,
            event.reason,
          );
          this.isConnected = false;
          this.callbacks.onClose?.(event.code, event.reason);
        };

        this.ws.onerror = (error) => {
          console.error("[QwenRealtime] WebSocket error:", error);
          this.callbacks.onError?.(new Error("WebSocket connection error"));
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      const type = message.type;

      switch (type) {
        case "session.created":
          this.sessionId = message.session?.id;
          console.log("[QwenRealtime] Session created:", this.sessionId);
          this.callbacks.onSessionCreated?.(this.sessionId || "");
          break;

        case "session.updated":
          console.log("[QwenRealtime] Session updated");
          break;

        case "response.audio.delta":
          if (message.delta) {
            // 解码 base64 音频数据
            const audioData = this.base64ToArrayBuffer(message.delta);
            this.callbacks.onAudioDelta?.(audioData);
          }
          break;

        case "response.audio.done":
          console.log("[QwenRealtime] Audio done");
          this.callbacks.onAudioDone?.();
          break;

        case "response.done":
          console.log("[QwenRealtime] Response done");
          this.callbacks.onResponseDone?.();
          break;

        case "session.finished":
          console.log("[QwenRealtime] Session finished");
          break;

        case "error":
          console.error("[QwenRealtime] Error:", message.error);
          this.callbacks.onError?.(
            new Error(message.error?.message || "Unknown error"),
          );
          break;

        case "input_text_buffer.committed":
          console.log("[QwenRealtime] Text buffer committed");
          break;

        default:
          console.log("[QwenRealtime] Unknown message type:", type);
      }
    } catch (error) {
      console.error("[QwenRealtime] Failed to parse message:", error);
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private sendEvent(event: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("[QwenRealtime] WebSocket not connected");
      return;
    }
    event.event_id = this.generateEventId();
    this.ws.send(JSON.stringify(event));
  }

  updateSession() {
    const sessionConfig: any = {
      mode: this.config.mode,
      voice: this.config.voice,
      response_format: this.config.responseFormat,
      sample_rate: this.config.sampleRate,
    };

    this.sendEvent({
      type: "session.update",
      session: sessionConfig,
    });
  }

  appendText(text: string) {
    this.sendEvent({
      type: "input_text_buffer.append",
      text: text,
    });
  }

  commitTextBuffer() {
    this.sendEvent({
      type: "input_text_buffer.commit",
    });
  }

  clearTextBuffer() {
    this.sendEvent({
      type: "input_text_buffer.clear",
    });
  }

  finish() {
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

  getSessionId(): string | null {
    return this.sessionId;
  }

  isReady(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// 通义千问实时语音模型列表
export const QWEN_REALTIME_MODELS = [
  "qwen3-tts-flash-realtime",
  "qwen3-tts-flash-realtime-2025-11-27",
  "qwen3-tts-vc-realtime-2025-11-27", // 声音复刻
  "qwen3-tts-vd-realtime-2025-12-16", // 声音设计
];

// 通义千问实时语音音色列表
export const QWEN_REALTIME_VOICES: {
  value: QwenVoice;
  label: string;
  description: string;
}[] = [
  { value: "Cherry", label: "芊悦", description: "阳光积极、亲切自然小姐姐" },
  { value: "Serena", label: "苏瑶", description: "温柔小姐姐" },
  { value: "Ethan", label: "晨煦", description: "标准普通话，阳光、温暖" },
  { value: "Chelsie", label: "千雪", description: "二次元虚拟女友" },
  { value: "Momo", label: "茉兔", description: "撒娇搞怪，逗你开心" },
  { value: "Vivian", label: "十三", description: "拽拽的、可爱的小暴躁" },
  { value: "Moon", label: "月白", description: "率性帅气" },
  { value: "Maia", label: "四月", description: "知性与温柔的碰撞" },
  { value: "Kai", label: "凯", description: "耳朵的一场SPA" },
  { value: "Nofish", label: "不吃鱼", description: "不会翘舌音的设计师" },
  { value: "Bella", label: "萌宝", description: "喝酒不打醉拳的小萝莉" },
  {
    value: "Jennifer",
    label: "詹妮弗",
    description: "品牌级、电影质感般美语女声",
  },
  { value: "Ryan", label: "甜茶", description: "节奏拉满，戏感炸裂" },
  {
    value: "Katerina",
    label: "卡捷琳娜",
    description: "御姐音色，韵律回味十足",
  },
  { value: "Aiden", label: "艾登", description: "精通厨艺的美语大男孩" },
  { value: "Elias", label: "墨讲师", description: "学科严谨性" },
  { value: "Jada", label: "上海-阿珍", description: "风风火火的沪上阿姐" },
  { value: "Dylan", label: "北京-晓东", description: "北京胡同里长大的少年" },
  { value: "Sunny", label: "四川-晴儿", description: "甜到你心里的川妹子" },
  { value: "Li", label: "南京-老李", description: "耐心的瑜伽老师" },
  { value: "Marcus", label: "陕西-秦川", description: "老陕的味道" },
  { value: "Roy", label: "闽南-阿杰", description: "诙谐直爽" },
  { value: "Peter", label: "天津-李彼得", description: "天津相声，专业捧哏" },
  { value: "Eric", label: "四川-程川", description: "四川成都男子" },
  { value: "Rocky", label: "粤语-阿强", description: "幽默风趣" },
  { value: "Kiki", label: "粤语-阿清", description: "甜美的港妹闺蜜" },
];
