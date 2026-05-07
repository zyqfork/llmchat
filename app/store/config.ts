import { LLMModel } from "../client/api";
import { DalleQuality, DalleStyle, ModelSize } from "../typing";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TTS_ENGINE,
  DEFAULT_TTS_ENGINES,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_MODELS,
  DEFAULT_TTS_VOICE,
  DEFAULT_TTS_VOICES,
  StoreKey,
  ServiceProvider,
  ColorScheme,
} from "../constant";
import { createPersistStore } from "../utils/store";
import type { Voice } from "rt-client";
import type { QwenVoice } from "../lib/qwen-realtime-client";
import { getModelCompressThreshold } from "../config/model-config";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];
export type TTSModelType = (typeof DEFAULT_TTS_MODELS)[number];
export type TTSVoiceType = (typeof DEFAULT_TTS_VOICES)[number];
export type TTSEngineType = (typeof DEFAULT_TTS_ENGINES)[number];

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

export type ColorSchemeType = `${ColorScheme}`;

const config = getClientConfig();

export const DEFAULT_CONFIG = {
  lastUpdate: Date.now(), // timestamp, to merge state

  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  systemAvatar: "2699-fe0f", // system 角色默认头像（齿轮）
  assistantAvatar: "1f916", // assistant 角色默认头像（机器人）
  fontSize: 14,
  fontFamily: "",
  theme: Theme.Auto as Theme,
  colorScheme: ColorScheme.Default as ColorSchemeType,
  tightBorder: !!config?.isApp,
  sendPreviewBubble: true,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsed: false, // 控制侧边栏是否完全隐藏

  enableArtifacts: true, // show artifacts config

  enableCodeFold: true, // code fold config

  disablePromptHint: false,

  useModelIconAsAvatar: true, // use model icon as AI avatar instead of emoji

  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],

  modelConfig: {
    model: "" as ModelType,
    providerName: "" as string,
    temperature: 0.7,
    top_p: 1,
    max_tokens: 8192,
    presence_penalty: 0,
    frequency_penalty: 0,
    sendMemory: true,
    historyMessageCount: 4,
    compressMessageLengthThreshold: 8192, // 默认8K tokens
    compressThresholdRatio: 0.9, // 上下文窗口压缩比例，默认90%
    autoTitleMinUserTokens: 20,
    autoTitleMinUserMessages: 1,
    autoTitleRefreshInterval: 4,
    summaryMinUserMessages: 1,
    compressModel: "",
    compressProviderName: "",
    topicModel: "",
    topicProviderName: "",
    optimizeModel: "",
    optimizeProviderName: "",
    optimizeModelPrompt: "", // 内容优化模型的系统提示词，空字符串表示使用默认提示词
    topicPrompt: "", // 标题生成提示词，空字符串表示使用默认提示词
    summarizePrompt: "", // 兼容旧字段：上下文压缩附加要求提示词
    compactionSystemPrompt: "", // 上下文压缩 System Prompt，空字符串表示使用默认模板
    compactionInitialPrompt: "", // 上下文压缩首次模板，空字符串表示使用默认模板
    compactionUpdatePrompt: "", // 上下文压缩增量模板，空字符串表示使用默认模板
    enableInjectSystemPrompts: true,
    template: config?.template ?? DEFAULT_INPUT_TEMPLATE,
    size: "1024x1024" as ModelSize,
    quality: "standard" as DalleQuality,
    style: "vivid" as DalleStyle,
    thinkingBudget: -1, // 思考深度：-1=动态思考（默认），0=关闭思考，>0=指定token数量
  },

  ttsConfig: {
    enable: false,
    autoplay: false,
    engine: DEFAULT_TTS_ENGINE,
    model: DEFAULT_TTS_MODEL,
    voice: DEFAULT_TTS_VOICE,
    speed: 1.0,
  },

  realtimeConfig: {
    enable: false,
    provider: "OpenAI" as string,
    model: "gpt-4o-realtime-preview-2024-10-01",
    apiKey: "",
    azure: {
      endpoint: "",
      deployment: "",
    },
    qwen: {
      model: "qwen3-asr-flash-realtime",
      voice: "Cherry" as QwenVoice,
      region: "beijing" as "beijing" | "singapore",
      /** 通义实时语音识别语言（如 zh、en） */
      asrLanguage: "zh",
    },
    temperature: 0.9,
    voice: "alloy" as Voice,
  },
};

export type ChatConfig = typeof DEFAULT_CONFIG;

export type ModelConfig = ChatConfig["modelConfig"];
export type TTSConfig = ChatConfig["ttsConfig"];
export type RealtimeConfig = ChatConfig["realtimeConfig"];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const TTSConfigValidator = {
  engine(x: string) {
    return x as TTSEngineType;
  },
  model(x: string) {
    return x as TTSModelType;
  },
  voice(x: string) {
    return x as TTSVoiceType;
  },
  speed(x: number) {
    return limitNumber(x, 0.25, 4.0, 1.0);
  },
};

export const ModalConfigValidator = {
  model(x: string) {
    return x as ModelType;
  },
  max_tokens(x: number) {
    return limitNumber(x, 0, 512000, 1024);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  frequency_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 2, 1);
  },
  top_p(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
  autoTitleMinUserTokens(x: number) {
    return limitNumber(
      x,
      1,
      10000,
      DEFAULT_CONFIG.modelConfig.autoTitleMinUserTokens,
    );
  },
  autoTitleMinUserMessages(x: number) {
    return limitNumber(
      x,
      1,
      50,
      DEFAULT_CONFIG.modelConfig.autoTitleMinUserMessages,
    );
  },
  autoTitleRefreshInterval(x: number) {
    return limitNumber(
      x,
      1,
      100,
      DEFAULT_CONFIG.modelConfig.autoTitleRefreshInterval,
    );
  },
  summaryMinUserMessages(x: number) {
    return limitNumber(
      x,
      1,
      50,
      DEFAULT_CONFIG.modelConfig.summaryMinUserMessages,
    );
  },
  compressThresholdRatio(x: number) {
    return limitNumber(
      x,
      0.1,
      0.9,
      DEFAULT_CONFIG.modelConfig.compressThresholdRatio,
    );
  },
};

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG },
  (set, get) => ({
    reset() {
      set(() => ({ ...DEFAULT_CONFIG }));
    },

    mergeModels(newModels: LLMModel[]) {
      if (!newModels || newModels.length === 0) {
        return;
      }

      const oldModels = get().models;
      const modelMap: Record<string, LLMModel> = {};

      for (const model of oldModels) {
        model.available = false;
        modelMap[`${model.name}@${model?.provider?.id}`] = model;
      }

      for (const model of newModels) {
        model.available = true;
        modelMap[`${model.name}@${model?.provider?.id}`] = model;
      }

      set(() => ({
        models: Object.values(modelMap),
      }));
    },

    allModels() {},
  }),
  {
    name: StoreKey.Config,
    version: 4.9,

    // 模型全集会随 API 拉取频繁变化，体积大且可重新获取，不持久化到本地
    partialize(state) {
      const { models: _models, ...persisted } = state as any;
      return persisted;
    },

    merge(persistedState, currentState) {
      const state = persistedState as ChatConfig | undefined;

      if (!state) {
        return { ...currentState };
      }

      const models = currentState.models.slice();
      if (Array.isArray((state as any).models)) {
        (state as any).models.forEach((pModel: LLMModel) => {
          const idx = models.findIndex(
            (v) => v.name === pModel.name && v.provider === pModel.provider,
          );
          if (idx !== -1) models[idx] = pModel;
          else models.push(pModel);
        });
      }

      const mergedState = { ...currentState, ...state, models };

      return mergedState;
    },

    migrate(persistedState, version) {
      const state = persistedState as ChatConfig;

      if (version < 3.4) {
        state.modelConfig.sendMemory = true;
        state.modelConfig.historyMessageCount = 4;
        state.modelConfig.compressMessageLengthThreshold = 8000;
        state.modelConfig.frequency_penalty = 0;
        state.modelConfig.top_p = 1;
        state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
      }

      if (version < 3.5) {
        state.customModels = "claude,claude-100k";
      }

      if (version < 3.6) {
        state.modelConfig.enableInjectSystemPrompts = true;
      }

      if (version < 3.7) {
        state.enableAutoGenerateTitle = true;
      }

      if (version < 3.8) {
        state.lastUpdate = Date.now();
      }

      if (version < 3.9) {
        state.modelConfig.template =
          state.modelConfig.template !== DEFAULT_INPUT_TEMPLATE
            ? state.modelConfig.template
            : (config?.template ?? DEFAULT_INPUT_TEMPLATE);
      }

      if (version < 4.1) {
        state.modelConfig.compressModel =
          DEFAULT_CONFIG.modelConfig.compressModel;
        state.modelConfig.compressProviderName =
          DEFAULT_CONFIG.modelConfig.compressProviderName;
      }

      if (version < 4.2) {
        state.useModelIconAsAvatar = DEFAULT_CONFIG.useModelIconAsAvatar;
      }

      if (version < 4.3) {
        // 根据当前模型更新压缩阈值
        state.modelConfig.compressMessageLengthThreshold =
          getModelCompressThreshold(
            state.modelConfig.model,
            state.modelConfig.compressThresholdRatio ??
              DEFAULT_CONFIG.modelConfig.compressThresholdRatio,
          );
      }

      if (version < 4.4) {
        state.modelConfig.autoTitleMinUserTokens =
          DEFAULT_CONFIG.modelConfig.autoTitleMinUserTokens;
        state.modelConfig.autoTitleMinUserMessages =
          DEFAULT_CONFIG.modelConfig.autoTitleMinUserMessages;
        state.modelConfig.autoTitleRefreshInterval =
          DEFAULT_CONFIG.modelConfig.autoTitleRefreshInterval;
        state.modelConfig.summaryMinUserMessages =
          DEFAULT_CONFIG.modelConfig.summaryMinUserMessages;
      }

      if (version < 4.5) {
        // 历史版本会把 models 全量持久化，清理以减小 app-config 体积
        delete (state as any).models;
      }

      if (version < 4.6) {
        state.modelConfig.topicModel = "";
        state.modelConfig.topicProviderName = "";
      }

      if (version < 4.7) {
        state.modelConfig.top_p = 1;
        state.modelConfig.max_tokens = 8192;
        state.modelConfig.compressMessageLengthThreshold = Math.max(
          8192,
          state.modelConfig.compressMessageLengthThreshold || 0,
        );
      }

      if (version < 4.8) {
        state.modelConfig.compressThresholdRatio =
          DEFAULT_CONFIG.modelConfig.compressThresholdRatio;
        state.modelConfig.compressMessageLengthThreshold =
          state.modelConfig.compressMessageLengthThreshold || 8192;
      }
      if (version < 4.9) {
        state.modelConfig.compactionSystemPrompt = "";
        state.modelConfig.compactionInitialPrompt = "";
        state.modelConfig.compactionUpdatePrompt = "";
      }

      return state as any;
    },
  },
);
