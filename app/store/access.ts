import {
  GoogleSafetySettingsThreshold,
  ServiceProvider,
  getAllProviders,
  StoreKey,
} from "../constant";
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { DEFAULT_CONFIG } from "./config";
import { getModelProvider } from "../utils/model";
import { logger } from "../utils/logger";

// 动态生成服务器端厂商配置状态
function createServerProvidersState(): Record<string, any> {
  const state: Record<string, any> = {};
  getAllProviders().forEach((provider) => {
    state[provider.id] = {
      hasApiKey: false,
      hasBaseUrl: false,
    };

    // Azure 特殊处理 - 需要 API 版本
    if (provider.id === "azure") {
      state[provider.id].hasApiVersion = false;
    }
  });
  return state;
}

// 动态生成服务器端配置缓存
function createServerConfigState(): Record<string, any> {
  const state: Record<string, any> = {};
  getAllProviders().forEach((provider) => {
    state[provider.id] = {
      apiKey: "",
      baseUrl: "",
    };

    // Azure 特殊处理 - 需要 API 版本
    if (provider.id === "azure") {
      state[provider.id].apiVersion = "";
    }
  });
  return state;
}

// 动态生成provider状态对象
function createProviderState<T>(defaultValue: T): Record<string, T> {
  const state: Record<string, T> = {};
  getAllProviders().forEach((provider) => {
    state[provider.name] = defaultValue;
  });
  return state;
}

// 动态生成provider字段的默认状态
function createProviderFieldsState(): Record<string, any> {
  const state: Record<string, any> = {};

  getAllProviders().forEach((provider) => {
    const storeKeys = provider.storeKeys;

    // 设置默认值
    state[storeKeys.apiKey] = "";

    // baseUrl 统一默认为供应商真实地址。
    // 注意：旧的 Web 模式默认值 `provider.apiPath`（如 `/api/openai`）指向的
    // 服务端代理路由已被移除，继续使用会导致所有请求 404。
    state[storeKeys.baseUrl] = provider.defaultBaseUrl;

    // 根据SDK能力添加可选字段
    if (storeKeys.apiType) {
      state[storeKeys.apiType] = "chat";
    }
    if (storeKeys.apiPath) {
      state[storeKeys.apiPath] = "";
    }
    if (storeKeys.responseStateful) {
      state[storeKeys.responseStateful] = false;
    }
    if (storeKeys.useProxy) {
      state[storeKeys.useProxy] = false;
    }
    if (storeKeys.proxyUrl) {
      state[storeKeys.proxyUrl] = "";
    }
    if (storeKeys.apiVersion) {
      // 根据provider设置默认API版本
      if (provider.id === "azure") {
        state[storeKeys.apiVersion] = "2023-08-01-preview";
      } else if (provider.id === "google") {
        state[storeKeys.apiVersion] = "v1";
      } else if (provider.id === "anthropic") {
        state[storeKeys.apiVersion] = "2023-06-01";
      } else {
        state[storeKeys.apiVersion] = "";
      }
    }
    if (storeKeys.resourceName) {
      state[storeKeys.resourceName] = "";
    }
  });

  return state;
}

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
    useResponseApi?: boolean;
    useResponseStateful?: boolean;
    apiPath?: string;
    useProxy?: boolean;
    proxyUrl?: string;
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

const DEFAULT_ACCESS_STATE = {
  accessCode: "",
  useCustomConfig: true, // 默认启用自定义配置

  provider: ServiceProvider.OpenAI.name,

  // 启用的服务提供商
  enabledProviders: {
    ...createProviderState(false),
    // 默认不启用任何服务商，由用户自行选择
  },

  // 每个服务商启用的模型列表（支持自定义服务商）
  enabledModels: createProviderState([] as string[]),

  // 是否从API获取可用模型（每个服务商独立控制）
  fetchModelsFromAPI: createProviderState(true),

  // 从API获取的模型列表缓存
  apiModelsCache: {} as Record<string, any[]>,

  // 模型获取状态
  modelsFetchStatus: {} as Record<
    string,
    "idle" | "loading" | "success" | "error"
  >,

  // 动态生成的provider字段
  ...createProviderFieldsState(),

  // Google特有字段（需要特殊处理）
  googleSafetySettings: GoogleSafetySettingsThreshold.BLOCK_ONLY_HIGH,

  // 自定义服务商
  customProviders: [] as CustomProvider[],

  // server config
  needCode: false, // 默认不需要访问码，从服务器配置获取
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",
  defaultModel: "",
  visionModels: "",

  // 是否设置了服务器端访问码
  hasServerAccessCode: false,

  // 客户端是否已通过验证
  isAuthenticated: false,

  // 是否设置了服务器端服务商配置
  hasServerProviderConfig: false,

  // 服务器端各服务商配置状态（动态生成）
  serverProviders: createServerProvidersState(),

  // 服务器端配置缓存（动态生成）
  serverConfig: createServerConfigState(),

  // tts config
  edgeTTSVoiceName: "zh-CN-YunxiNeural",
};

export type AccessControlStore = typeof DEFAULT_ACCESS_STATE & {
  enabledAccessControl: () => boolean;
  getVisionModels: () => string;
  edgeVoiceName: () => string;
  isValidOpenAI: () => boolean;
  getEffectiveOpenAIConfig: () => {
    apiKey: string;
    baseUrl: string;
    source: "frontend" | "server";
  } | null;
  hasValidOpenAIConfig: () => boolean;
  getEffectiveProviderConfig: (provider: string) => any;
  hasValidProviderConfig: (provider: string) => boolean;
  hasAnyValidProviderConfig: () => boolean;
  addCustomProvider: (
    provider: Omit<CustomProvider, "id" | "created">,
  ) => string;
  updateCustomProvider: (id: string, updates: Partial<CustomProvider>) => void;
  removeCustomProvider: (id: string) => void;
  getCustomProvider: (id: string) => CustomProvider | undefined;
  isCustomProviderNameUnique: (name: string, excludeId?: string) => boolean;
  isValidCustomProvider: (id: string) => boolean | undefined;
  verifyServerAccessCode: (accessCode: string) => Promise<boolean>;
  fetchServerConfig: (accessCode: string) => Promise<boolean>;
  isAuthorized: () => boolean;
  isAuthorizedAsync: () => Promise<boolean>;
  hasOtherValidProviders: () => boolean;
  setFetchModelsFromAPI: (provider: string, enabled: boolean) => void;
  setModelsFetchStatus: (
    provider: string,
    status: "idle" | "loading" | "success" | "error",
  ) => void;
  setApiModelsCache: (provider: string, models: any[]) => void;
  clearApiModelsCache: (provider?: string) => void;
  sanitizeEnabledModels: (
    provider: string,
    availableModels: { name: string }[],
  ) => void;
  fetch: () => void;
  updateAccessCode: (code: string) => void;
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

    // 通用的provider验证方法
    isValidProvider(providerId: string): boolean {
      const provider = getAllProviders().find((p) => p.id === providerId);
      if (!provider) return false;

      const state = get();
      const storeKeys = provider.storeKeys;

      // Ollama通常不需要API Key
      if (provider.id === "ollama") {
        return true;
      }

      // 检查API Key是否存在
      const apiKey = (state as any)[storeKeys.apiKey];
      if (!apiKey) return false;

      // 根据provider类型添加额外的必需字段检查
      if (provider.id === "azure") {
        const baseUrl = (state as any)[storeKeys.baseUrl];
        const apiVersion = (state as any)[storeKeys.apiVersion!];
        return !!(apiKey && baseUrl && apiVersion);
      }

      return true;
    },

    isValidOpenAI() {
      return this.isValidProvider("openai");
    },

    // 获取有效的 OpenAI 配置（优先级：前端配置 > 服务器配置）
    getEffectiveOpenAIConfig() {
      const state = get();

      // 如果前端有配置，优先使用前端配置
      const openaiApiKey = (state as any)[
        ServiceProvider.OpenAI.storeKeys.apiKey
      ];
      const openaiUrl = (state as any)[
        ServiceProvider.OpenAI.storeKeys.baseUrl
      ];

      if (openaiApiKey) {
        return {
          apiKey: openaiApiKey,
          baseUrl: openaiUrl || "https://api.openai.com/v1",
          source: "frontend" as const,
        };
      }

      // 如果没有前端配置，但有服务器配置，使用服务器配置
      if (state.serverConfig.openai.apiKey) {
        return {
          apiKey: state.serverConfig.openai.apiKey,
          baseUrl:
            state.serverConfig.openai.baseUrl || "https://api.openai.com/v1",
          source: "server" as const,
        };
      }

      return null;
    },

    // 检查是否有有效的 OpenAI 配置（前端或服务器）
    hasValidOpenAIConfig() {
      return !!this.getEffectiveOpenAIConfig();
    },

    // 获取有效的服务商配置（通用方法）
    getEffectiveProviderConfig(providerId: string) {
      const state = get();
      const provider = getAllProviders().find((p) => p.id === providerId);

      if (!provider) return null;

      const storeKeys = provider.storeKeys;

      // 检查前端配置
      const apiKey = (state as any)[storeKeys.apiKey];
      if (apiKey) {
        const config: any = {
          apiKey,
          baseUrl: (state as any)[storeKeys.baseUrl] || provider.defaultBaseUrl,
          source: "frontend" as const,
        };

        // 添加可选字段
        if (storeKeys.apiVersion) {
          config.apiVersion = (state as any)[storeKeys.apiVersion] || "";
        }

        return config;
      }

      // 否则使用服务器配置
      const serverConfig = (state.serverConfig as any)[providerId];
      if (serverConfig && serverConfig.apiKey) {
        return {
          ...serverConfig,
          source: "server" as const,
        };
      }

      return null;
    },

    // 检查是否有有效的服务商配置
    hasValidProviderConfig(provider: string) {
      return !!this.getEffectiveProviderConfig(provider);
    },

    // 检查是否有任何有效的服务商配置（包括服务器端配置）
    hasAnyValidProviderConfig() {
      // 动态获取所有厂商ID，避免写死
      const providers = getAllProviders().map((provider) => provider.id);
      return providers.some((provider) =>
        this.hasValidProviderConfig(provider),
      );
    },

    // 动态获取provider的API key
    getProviderApiKey(providerId: string): string {
      const provider = getAllProviders().find((p) => p.id === providerId);
      if (!provider) return "";

      const state = get();
      return (state as any)[provider.storeKeys.apiKey] || "";
    },

    // 动态获取provider的base URL
    getProviderBaseUrl(providerId: string): string {
      const provider = getAllProviders().find((p) => p.id === providerId);
      if (!provider) return "";

      const state = get();
      return (
        (state as any)[provider.storeKeys.baseUrl] || provider.defaultBaseUrl
      );
    },

    // 动态获取provider的完整配置
    getProviderConfig(providerId: string): any {
      const provider = getAllProviders().find((p) => p.id === providerId);
      if (!provider) return {};

      const state = get();
      const config: any = {};

      // 获取所有相关字段
      Object.entries(provider.storeKeys).forEach(([key, storeKey]) => {
        if (storeKey) {
          config[key] = (state as any)[storeKey];
        }
      });

      return config;
    },

    // 动态获取provider的特定字段值
    getProviderField(providerId: string, fieldName: string): any {
      const provider = getAllProviders().find((p) => p.id === providerId);
      if (!provider) return undefined;

      const storeKey = (provider.storeKeys as any)[fieldName];
      if (!storeKey) return undefined;

      const state = get();
      return (state as any)[storeKey];
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

      set((state) => {
        const newState = {
          customProviders: [...state.customProviders, newProvider],
        };

        // 如果是 OpenAI 类型的自定义服务商，初始化相关设置
        if (newProvider.type === "openai") {
          const apiTypeKey = `${newProvider.id}ApiType`;
          const responseStatefulKey = `${newProvider.id}ResponseStateful`;
          // 根据配置决定默认 API 类型
          const defaultApiType = newProvider.config?.useResponseApi
            ? "response"
            : "chat";
          (newState as any)[apiTypeKey] = defaultApiType;
          (newState as any)[responseStatefulKey] =
            newProvider.config?.useResponseStateful === true;

          logger.debug(
            `[Access Store] Initialized API type for custom OpenAI provider:`,
            {
              providerId: newProvider.id,
              apiTypeKey,
              defaultValue: defaultApiType,
              useResponseApi: newProvider.config?.useResponseApi,
            },
          );
        }

        return newState;
      });

      return newProvider.id;
    },

    updateCustomProvider(id: string, updates: Partial<CustomProvider>) {
      // 检查是否更新了影响 SDK 实例的配置（endpoint 或 apiKey）
      const needsCacheInvalidation =
        updates.endpoint !== undefined || updates.apiKey !== undefined;

      set((state) => {
        const customProviders = state.customProviders.map((provider) => {
          if (provider.id !== id) {
            return provider;
          }

          const hasConfigUpdate = Object.prototype.hasOwnProperty.call(
            updates,
            "config",
          );
          let nextConfig = provider.config;
          if (hasConfigUpdate) {
            nextConfig = updates.config
              ? { ...provider.config, ...updates.config }
              : updates.config;
          }

          return {
            ...provider,
            ...updates,
            config: nextConfig,
          };
        });

        const updatedProvider = customProviders.find(
          (provider) => provider.id === id,
        );

        const nextState: Record<string, any> = { customProviders };

        if (updatedProvider?.type === "openai") {
          const apiTypeKey = `${id}ApiType`;
          const responseStatefulKey = `${id}ResponseStateful`;
          if (updatedProvider.config?.useResponseApi !== undefined) {
            nextState[apiTypeKey] = updatedProvider.config.useResponseApi
              ? "response"
              : "chat";
          }
          if (updatedProvider.config?.useResponseStateful !== undefined) {
            nextState[responseStatefulKey] =
              updatedProvider.config.useResponseStateful === true;
          }
        }

        return nextState;
      });

      // pi-ai 路径当前不做 provider SDK 实例缓存，配置更新无需额外失效处理
      void needsCacheInvalidation;
    },

    removeCustomProvider(id: string) {
      set((state) => {
        const provider = state.customProviders.find((p) => p.id === id);
        const newState = {
          customProviders: state.customProviders.filter(
            (provider) => provider.id !== id,
          ),
        };

        // 如果是 OpenAI 类型的自定义服务商，清理 API 类型设置
        if (provider && provider.type === "openai") {
          const apiTypeKey = `${id}ApiType`;
          delete (newState as any)[apiTypeKey];
          logger.debug(
            `[Access Store] Cleaned up API type for custom OpenAI provider:`,
            {
              providerId: id,
              apiTypeKey,
            },
          );
        }

        return newState;
      });
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

    // 验证服务器端访问码
    async verifyServerAccessCode(accessCode: string): Promise<boolean> {
      try {
        const response = await fetch("/api/verify-access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessCode }),
        });

        const result = await response.json();
        if (result.valid) {
          set({ isAuthenticated: true });
        }
        return result.valid;
      } catch (error) {
        logger.error("[Access] Failed to verify access code:", error);
        return false;
      }
    },

    // 获取服务器端配置
    async fetchServerConfig(accessCode: string): Promise<boolean> {
      try {
        const response = await fetch("/api/server-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessCode }),
        });

        const result = await response.json();
        if (result.error) {
          logger.error(
            "[Access] Failed to fetch server config:",
            result.message,
          );
          return false;
        }

        // 更新服务器端配置缓存
        set((state) => ({
          ...state,
          serverConfig: result.config,
        }));

        return true;
      } catch (error) {
        logger.error("[Access] Failed to fetch server config:", error);
        return false;
      }
    },

    // 检查是否有有效的访问码（服务器端验证）
    async isValidAccessCode(): Promise<boolean> {
      const state = get();
      if (!this.enabledAccessControl()) {
        return true;
      }

      if (!state.accessCode) {
        return false;
      }

      // 验证服务器端访问码
      return await this.verifyServerAccessCode(state.accessCode);
    },

    isAuthorized() {
      this.fetch();

      // if you don't have access code, you are authorized
      if (!this.enabledAccessControl()) {
        return true;
      }

      return get().isAuthenticated;
    },

    // 检查其他服务商是否有有效配置
    hasOtherValidProviders() {
      const hasValidCustomProvider = get().customProviders.some((provider) =>
        this.isValidCustomProvider(provider.id),
      );

      // 动态检查所有厂商，避免写死
      const hasValidBuiltinProvider = getAllProviders().some((provider) =>
        this.isValidProvider(provider.id),
      );

      return hasValidBuiltinProvider || hasValidCustomProvider;
    },

    // 异步版本的授权检查，支持服务器端访问码验证
    async isAuthorizedAsync(): Promise<boolean> {
      if (this.isAuthorized()) {
        return true;
      } else if (this.enabledAccessControl()) {
        const isValid = await this.verifyServerAccessCode(get().accessCode);
        return isValid;
      }
      return true;
    },

    updateAccessCode(code: string) {
      set((state) => ({
        ...state,
        accessCode: code,
        isAuthenticated: false, // 只要code变化，就重置认证状态
      }));
    },

    // 设置是否从API获取模型
    setFetchModelsFromAPI(provider: string, enabled: boolean) {
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
      provider: string,
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
    setApiModelsCache(provider: string, models: any[]) {
      set((state) => ({
        ...state,
        apiModelsCache: {
          ...state.apiModelsCache,
          [provider]: models,
        },
      }));
    },

    // 清除模型缓存
    clearApiModelsCache(provider?: string) {
      set((state) => ({
        ...state,
        apiModelsCache: provider
          ? { ...state.apiModelsCache, [provider]: [] }
          : {},
      }));
    },

    sanitizeEnabledModels(
      provider: string,
      availableModels: { name: string }[],
    ) {
      set((state) => {
        const enabled = state.enabledModels[provider] ?? [];
        if (enabled.length === 0) {
          return state;
        }

        const availableModelNames = new Set(availableModels.map((m) => m.name));

        // 获取当前服务商的自定义模型
        const customModels = state.customModels || "";
        const customModelNames = new Set<string>();

        if (customModels) {
          customModels.split(",").forEach((modelStr) => {
            const cleanModel =
              modelStr.startsWith("+") || modelStr.startsWith("-")
                ? modelStr.slice(1)
                : modelStr;
            const [modelWithProvider] = cleanModel.split("=");
            const [modelName, modelProvider] =
              getModelProvider(modelWithProvider);

            // 只添加属于当前服务商的自定义模型
            if (
              modelProvider === provider ||
              (!modelProvider && provider === "openai")
            ) {
              customModelNames.add(modelName);
            }
          });
        }

        // 保留在可用模型列表中的模型，或者是在自定义模型列表中的模型
        const newEnabledModels = enabled.filter(
          (modelName) =>
            availableModelNames.has(modelName) ||
            customModelNames.has(modelName),
        );

        if (newEnabledModels.length === enabled.length) {
          return state;
        }

        logger.debug("[sanitizeEnabledModels] 清理启用模型:", {
          provider,
          originalEnabled: enabled,
          availableModels: Array.from(availableModelNames),
          customModels: Array.from(customModelNames),
          newEnabledModels,
        });

        return {
          ...state,
          enabledModels: {
            ...state.enabledModels,
            [provider]: newEnabledModels,
          },
        };
      });
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
          logger.error("[Config] failed to fetch config");
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
