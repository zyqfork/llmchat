import {
  GoogleSafetySettingsThreshold,
  ServiceProvider,
  StoreKey,
  ApiPath,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  GEMINI_BASE_URL,
  BYTEDANCE_BASE_URL,
  ALIBABA_BASE_URL,
  MOONSHOT_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  SILICONFLOW_BASE_URL,
} from "../constant";
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { ensure } from "../utils/clone";
import { DEFAULT_CONFIG } from "./config";
import { getModelProvider } from "../utils/model";

// 自定义服务商类型定义
export type CustomProviderType = "openai" | "google" | "anthropic";

export interface CustomProvider {
  id: string; // 唯一标识符
  name: string; // 用户自定义的显示名称
  type: CustomProviderType; // 服务商类型，决定使用哪套API逻辑
  apiKey: string; // API密钥
  endpoint?: string; // 自定义端点
  // 根据类型的特定配置
  config?: {
    // OpenAI类型的特定配置
    azureApiVersion?: string;
    // Google类型的特定配置
    googleSafetySettings?: GoogleSafetySettingsThreshold;
    // Anthropic类型的特定配置
    anthropicVersion?: string;
  };
  enabled: boolean; // 是否启用
  created: number; // 创建时间戳
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const isApp = getClientConfig()?.buildMode === "export";

const DEFAULT_OPENAI_URL = isApp ? OPENAI_BASE_URL : ApiPath.OpenAI;

const DEFAULT_GOOGLE_URL = isApp ? GEMINI_BASE_URL : ApiPath.Google;

const DEFAULT_ANTHROPIC_URL = isApp ? ANTHROPIC_BASE_URL : ApiPath.Anthropic;

const DEFAULT_BYTEDANCE_URL = isApp ? BYTEDANCE_BASE_URL : ApiPath.ByteDance;

const DEFAULT_ALIBABA_URL = isApp ? ALIBABA_BASE_URL : ApiPath.Alibaba;

const DEFAULT_MOONSHOT_URL = isApp ? MOONSHOT_BASE_URL : ApiPath.Moonshot;

const DEFAULT_DEEPSEEK_URL = isApp ? DEEPSEEK_BASE_URL : ApiPath.DeepSeek;

const DEFAULT_XAI_URL = isApp ? XAI_BASE_URL : ApiPath.XAI;

const DEFAULT_SILICONFLOW_URL = isApp
  ? SILICONFLOW_BASE_URL
  : ApiPath.SiliconFlow;

const DEFAULT_ACCESS_STATE = {
  accessCode: "",
  useCustomConfig: true, // 默认启用自定义配置

  provider: ServiceProvider.OpenAI,

  // 启用的服务提供商
  enabledProviders: {
    [ServiceProvider.OpenAI]: false,
    [ServiceProvider.Azure]: false,
    [ServiceProvider.Google]: false,
    [ServiceProvider.Anthropic]: false,
    [ServiceProvider.ByteDance]: false,
    [ServiceProvider.Alibaba]: false,
    [ServiceProvider.Moonshot]: false,
    [ServiceProvider.XAI]: false,
    [ServiceProvider.DeepSeek]: false,
    [ServiceProvider.SiliconFlow]: false,
  } as Record<ServiceProvider, boolean>,

  // 每个服务商启用的模型列表（支持自定义服务商）
  enabledModels: {
    [ServiceProvider.OpenAI]: [] as string[],
    [ServiceProvider.Azure]: [] as string[],
    [ServiceProvider.Google]: [] as string[],
    [ServiceProvider.Anthropic]: [] as string[],
    [ServiceProvider.ByteDance]: [] as string[],
    [ServiceProvider.Alibaba]: [] as string[],
    [ServiceProvider.Moonshot]: [] as string[],
    [ServiceProvider.XAI]: [] as string[],
    [ServiceProvider.DeepSeek]: [] as string[],
    [ServiceProvider.SiliconFlow]: [] as string[],
  } as Record<ServiceProvider | string, string[]>,

  // 是否从API获取可用模型（每个服务商独立控制）
  fetchModelsFromAPI: {
    [ServiceProvider.OpenAI]: true,
    [ServiceProvider.Azure]: true,
    [ServiceProvider.Google]: true,
    [ServiceProvider.Anthropic]: true,
    [ServiceProvider.ByteDance]: true,
    [ServiceProvider.Alibaba]: true,
    [ServiceProvider.Moonshot]: true,
    [ServiceProvider.XAI]: true,
    [ServiceProvider.DeepSeek]: true,
    [ServiceProvider.SiliconFlow]: true,
  } as Record<ServiceProvider | string, boolean>,

  // 从API获取的模型列表缓存
  apiModelsCache: {} as Record<ServiceProvider | string, any[]>,

  // 模型获取状态
  modelsFetchStatus: {} as Record<
    ServiceProvider | string,
    "idle" | "loading" | "success" | "error"
  >,

  // openai
  openaiUrl: DEFAULT_OPENAI_URL,
  openaiApiKey: "",

  // azure
  azureUrl: "",
  azureApiKey: "",
  azureApiVersion: "2023-08-01-preview",

  // google ai studio
  googleUrl: DEFAULT_GOOGLE_URL,
  googleApiKey: "",
  googleApiVersion: "v1",
  googleSafetySettings: GoogleSafetySettingsThreshold.BLOCK_ONLY_HIGH,

  // anthropic
  anthropicUrl: DEFAULT_ANTHROPIC_URL,
  anthropicApiKey: "",
  anthropicApiVersion: "2023-06-01",

  // bytedance
  bytedanceUrl: DEFAULT_BYTEDANCE_URL,
  bytedanceApiKey: "",

  // alibaba
  alibabaUrl: DEFAULT_ALIBABA_URL,
  alibabaApiKey: "",

  // moonshot
  moonshotUrl: DEFAULT_MOONSHOT_URL,
  moonshotApiKey: "",

  // deepseek
  deepseekUrl: DEFAULT_DEEPSEEK_URL,
  deepseekApiKey: "",

  // xai
  xaiUrl: DEFAULT_XAI_URL,
  xaiApiKey: "",

  // siliconflow
  siliconflowUrl: DEFAULT_SILICONFLOW_URL,
  siliconflowApiKey: "",

  // 自定义服务商
  customProviders: [] as CustomProvider[],

  // server config
  needCode: true,
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",
  defaultModel: "",
  visionModels: "",

  // tts config
  edgeTTSVoiceName: "zh-CN-YunxiNeural",
};

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    enabledAccessControl() {
      this.fetch();

      return get().needCode;
    },
    getVisionModels() {
      this.fetch();
      return get().visionModels;
    },
    edgeVoiceName() {
      this.fetch();

      return get().edgeTTSVoiceName;
    },

    isValidOpenAI() {
      return ensure(get(), ["openaiApiKey"]);
    },

    isValidAzure() {
      return ensure(get(), ["azureUrl", "azureApiKey", "azureApiVersion"]);
    },

    isValidGoogle() {
      return ensure(get(), ["googleApiKey"]);
    },

    isValidAnthropic() {
      return ensure(get(), ["anthropicApiKey"]);
    },

    isValidByteDance() {
      return ensure(get(), ["bytedanceApiKey"]);
    },

    isValidAlibaba() {
      return ensure(get(), ["alibabaApiKey"]);
    },

    isValidMoonshot() {
      return ensure(get(), ["moonshotApiKey"]);
    },
    isValidDeepSeek() {
      return ensure(get(), ["deepseekApiKey"]);
    },

    isValidXAI() {
      return ensure(get(), ["xaiApiKey"]);
    },

    isValidSiliconFlow() {
      return ensure(get(), ["siliconflowApiKey"]);
    },

    // 自定义服务商管理方法
    addCustomProvider(provider: Omit<CustomProvider, "id" | "created">) {
      const newProvider: CustomProvider = {
        ...provider,
        id: `custom_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        created: Date.now(),
      };

      set((state) => ({
        customProviders: [...state.customProviders, newProvider],
      }));

      return newProvider.id;
    },

    updateCustomProvider(id: string, updates: Partial<CustomProvider>) {
      set((state) => ({
        customProviders: state.customProviders.map((provider) =>
          provider.id === id ? { ...provider, ...updates } : provider,
        ),
      }));
    },

    removeCustomProvider(id: string) {
      set((state) => ({
        customProviders: state.customProviders.filter(
          (provider) => provider.id !== id,
        ),
      }));
    },

    getCustomProvider(id: string) {
      return get().customProviders.find((provider) => provider.id === id);
    },

    isCustomProviderNameUnique(name: string, excludeId?: string) {
      const providers = get().customProviders;
      return !providers.some(
        (provider) => provider.name === name && provider.id !== excludeId,
      );
    },

    isValidCustomProvider(id: string) {
      const provider = this.getCustomProvider(id);
      return provider && provider.enabled && !!provider.apiKey;
    },

    isAuthorized() {
      this.fetch();

      // has token or has code or disabled access control
      const hasValidCustomProvider = get().customProviders.some((provider) =>
        this.isValidCustomProvider(provider.id),
      );

      return (
        this.isValidOpenAI() ||
        this.isValidAzure() ||
        this.isValidGoogle() ||
        this.isValidAnthropic() ||
        this.isValidByteDance() ||
        this.isValidAlibaba() ||
        this.isValidMoonshot() ||
        this.isValidDeepSeek() ||
        this.isValidXAI() ||
        this.isValidSiliconFlow() ||
        hasValidCustomProvider ||
        !this.enabledAccessControl() ||
        (this.enabledAccessControl() && ensure(get(), ["accessCode"]))
      );
    },

    // 设置是否从API获取模型
    setFetchModelsFromAPI(
      provider: ServiceProvider | string,
      enabled: boolean,
    ) {
      set((state) => ({
        ...state,
        fetchModelsFromAPI: {
          ...state.fetchModelsFromAPI,
          [provider]: enabled,
        },
      }));
    },

    // 设置模型获取状态
    setModelsFetchStatus(
      provider: ServiceProvider | string,
      status: "idle" | "loading" | "success" | "error",
    ) {
      set((state) => ({
        ...state,
        modelsFetchStatus: {
          ...state.modelsFetchStatus,
          [provider]: status,
        },
      }));
    },

    // 缓存从API获取的模型
    setApiModelsCache(provider: ServiceProvider | string, models: any[]) {
      set((state) => ({
        ...state,
        apiModelsCache: {
          ...state.apiModelsCache,
          [provider]: models,
        },
      }));
    },

    // 清除模型缓存
    clearApiModelsCache(provider?: ServiceProvider | string) {
      set((state) => ({
        ...state,
        apiModelsCache: provider
          ? { ...state.apiModelsCache, [provider]: [] }
          : {},
      }));
    },

    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 1;
      fetch("/api/config", {
        method: "post",
        body: null,
        headers: {
          ...getHeaders(),
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const defaultModel = res.defaultModel ?? "";
          if (defaultModel !== "") {
            const [model, providerName] = getModelProvider(defaultModel);
            DEFAULT_CONFIG.modelConfig.model = model;
            DEFAULT_CONFIG.modelConfig.providerName = providerName as any;
          }

          return res;
        })
        .then((res: DangerConfig) => {
          // 保存当前的用户自定义配置
          const currentState = get();
          const userCustomModels = currentState.customModels;

          // 只更新服务器相关的配置，保留用户的自定义模型
          set((state) => ({
            ...state,
            ...res,
            // 保留用户的自定义模型，除非服务器明确提供了非空的自定义模型
            customModels: res.customModels || userCustomModels || "",
          }));
        })
        .catch(() => {
          console.error("[Config] failed to fetch config");
        })
        .finally(() => {
          fetchState = 2;
        });
    },
  }),
  {
    name: StoreKey.Access,
    version: 3,
    migrate(persistedState, version) {
      if (version < 2) {
        const state = persistedState as {
          token: string;
          openaiApiKey: string;
          azureApiVersion: string;
          googleApiKey: string;
        };
        state.openaiApiKey = state.token;
        state.azureApiVersion = "2023-08-01-preview";
      }

      if (version < 3) {
        // 添加自定义服务商字段
        const state = persistedState as any;
        if (!state.customProviders) {
          state.customProviders = [];
        }
      }

      return persistedState as any;
    },
  },
);
