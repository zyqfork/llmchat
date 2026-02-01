import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { createAzure } from "@ai-sdk/azure";
import { generateText, streamText } from "ai";

import { getAllProviders } from "../constant";
import { logger } from "../utils/logger";
import { fetch as tauriFetch, isTauriApp, FetchType } from "../utils/fetch";

// SDK实例缓存
const sdkInstances = new Map<string, any>();

// 获取适合的 fetch 函数
function getCustomFetch(): typeof fetch | undefined {
  if (isTauriApp()) {
    // 在 Tauri 环境中，使用自定义 fetch 函数，指定为 LLM 请求类型
    const customFetch = (
      url: string | URL | Request,
      options?: RequestInit,
    ) => {
      const urlString = typeof url === "string" ? url : url.toString();
      return tauriFetch(urlString, options, FetchType.LLM);
    };
    // 添加 preconnect 属性以匹配 fetch 类型
    (customFetch as any).preconnect = () => {};
    return customFetch as typeof fetch;
  }
  // 在其他环境中，使用默认的 fetch（不传递 fetch 参数）
  return undefined;
}

// 根据provider配置创建SDK实例
export function createSDKInstance(
  providerId: string,
  config?: {
    apiKey: string;
    baseUrl?: string;
    resourceName?: string;
    apiVersion?: string;
  },
): any {
  // 如果没有提供配置，尝试从缓存获取
  const cacheKey = config ? `${providerId}-${config.apiKey}` : providerId;

  if (sdkInstances.has(cacheKey)) {
    return sdkInstances.get(cacheKey);
  }

  // 首先检查是否是自定义服务商
  let provider: any = null;
  let isCustomProvider = false;
  let customProvider: any = null;

  if (providerId.startsWith("custom_")) {
    isCustomProvider = true;
    // 获取自定义服务商配置
    if (typeof window !== "undefined") {
      try {
        const { useAccessStore } = require("../store/access");
        const accessStore = useAccessStore.getState();

        logger.debug(
          `[SDK Manager] Looking for custom provider: ${providerId}`,
        );
        logger.debug(
          `[SDK Manager] Available custom providers:`,
          accessStore.customProviders.map((p: any) => ({
            id: p.id,
            name: p.name,
            enabled: p.enabled,
          })),
        );

        customProvider = accessStore.customProviders.find(
          (p: any) => p.id === providerId,
        );
        if (customProvider) {
          // 为自定义服务商创建虚拟 provider 配置
          provider = {
            id: providerId,
            name: customProvider.name,
            // 自定义 OpenAI 类型使用 openai-compatible SDK
            sdkType:
              customProvider.type === "openai"
                ? "openai-compatible"
                : customProvider.type,
            defaultBaseUrl: customProvider.endpoint || "",
            storeKeys: {
              // 自定义服务商支持 API 类型选择（如果是 OpenAI 类型）
              apiType:
                customProvider.type === "openai"
                  ? `${providerId}ApiType`
                  : undefined,
            },
          };
          logger.debug(`[SDK Manager] Using custom provider:`, {
            providerId,
            name: customProvider.name,
            type: customProvider.type,
            sdkType: provider.sdkType,
            hasApiType: !!provider.storeKeys.apiType,
          });
        } else {
          logger.error(
            `[SDK Manager] Custom provider not found: ${providerId}`,
          );
        }
      } catch (error) {
        logger.error(
          `[SDK Manager] Failed to get custom provider ${providerId}:`,
          error,
        );
      }
    }

    if (!customProvider) {
      throw new Error(
        `Custom provider ${providerId} not found. Available providers: ${
          typeof window !== "undefined"
            ? (() => {
                try {
                  const { useAccessStore } = require("../store/access");
                  const accessStore = useAccessStore.getState();
                  return accessStore.customProviders
                    .map((p: any) => p.id)
                    .join(", ");
                } catch {
                  return "Unable to fetch";
                }
              })()
            : "Server-side"
        }`,
      );
    }
  } else {
    // 内置服务商
    provider = getAllProviders().find((p) => p.id === providerId);
  }

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`);
  }

  // 如果没有提供配置，尝试从客户端 store 获取（仅在客户端环境）
  let apiKey = config?.apiKey;
  let baseUrl = config?.baseUrl;
  let apiType = "chat"; // 默认使用 chat API

  if (!apiKey && typeof window !== "undefined") {
    try {
      const { useAccessStore } = require("../store/access");
      const accessStore = useAccessStore.getState();

      if (isCustomProvider && customProvider) {
        // 自定义服务商直接从配置获取
        apiKey = customProvider.apiKey;
        baseUrl = customProvider.endpoint;

        // 自定义 OpenAI 类型服务商支持 API 类型选择
        if (customProvider.type === "openai" && provider.storeKeys.apiType) {
          const storeKey = provider.storeKeys.apiType;
          // 优先使用配置中的 useResponseApi 设置
          if (customProvider.config?.useResponseApi !== undefined) {
            apiType = customProvider.config.useResponseApi
              ? "response"
              : "chat";
            logger.debug(
              `[SDK Manager] Custom OpenAI provider API type from config:`,
              {
                providerId,
                useResponseApi: customProvider.config.useResponseApi,
                finalApiType: apiType,
              },
            );
          } else {
            // 回退到 store 中的设置
            apiType = (accessStore as any)[storeKey] || "chat";
            logger.debug(
              `[SDK Manager] Custom OpenAI provider API type from store:`,
              {
                providerId,
                storeKey,
                rawValue: (accessStore as any)[storeKey],
                finalApiType: apiType,
              },
            );
          }
        }
      } else {
        // 内置服务商从 store 获取配置
        const storeConfig = accessStore.getProviderConfig(providerId);
        apiKey = storeConfig.apiKey;
        baseUrl = storeConfig.baseUrl;

        // 获取用户的 API 类型设置
        if (provider.storeKeys.apiType) {
          const storeKey = provider.storeKeys.apiType;
          apiType = (accessStore as any)[storeKey] || "chat";
          logger.debug(
            `[SDK Manager] API type for ${providerId} (with config):`,
            {
              storeKey,
              rawValue: (accessStore as any)[storeKey],
              finalApiType: apiType,
            },
          );
        }
      }

      logger.debug(`[SDK Manager] Provider ${providerId} config:`, {
        hasApiKey: !!apiKey,
        baseUrl,
        apiType,
        isCustomProvider,
      });
    } catch (error) {
      logger.warn(
        `[SDK Manager] Could not get config from store for ${providerId}:`,
        error,
      );
    }
  } else if (typeof window !== "undefined") {
    // 即使提供了配置，也要获取API类型设置
    try {
      const { useAccessStore } = require("../store/access");
      const accessStore = useAccessStore.getState();

      // 获取用户的 API 类型设置
      if (provider.storeKeys.apiType) {
        const storeKey = provider.storeKeys.apiType;
        apiType = (accessStore as any)[storeKey] || "chat";
        logger.debug(`[SDK Manager] API type for ${providerId} (no config):`, {
          storeKey,
          rawValue: (accessStore as any)[storeKey],
          finalApiType: apiType,
        });
      }

      logger.debug(`[SDK Manager] Provider ${providerId} API type:`, apiType);
    } catch (error) {
      logger.warn(
        `[SDK Manager] Could not get API type from store for ${providerId}:`,
        error,
      );
    }
  }

  if (!apiKey) {
    throw new Error(`API key not provided for ${providerId}`);
  }

  // 确保使用正确的端点
  let finalBaseUrl = baseUrl || provider.defaultBaseUrl;

  // AI SDK 会自动处理端点路径，我们只需要提供基础 URL
  // 不需要在这里修改 URL，让 AI SDK 根据 API 类型自动选择正确的端点
  logger.debug(`[SDK Manager] Using baseURL for ${providerId}:`, {
    baseURL: finalBaseUrl,
    apiType,
    isCustomProvider,
    note: "AI SDK will handle endpoint selection based on .chat() vs default method",
  });

  let sdkInstance: any;
  const customFetch = getCustomFetch();

  try {
    switch (provider.sdkType) {
      case "openai":
        sdkInstance = createOpenAI({
          apiKey,
          baseURL: finalBaseUrl,
          fetch: customFetch,
        });
        break;

      case "openai-compatible":
        sdkInstance = createOpenAICompatible({
          apiKey,
          baseURL: finalBaseUrl,
          name: provider.id,
          fetch: customFetch,
        });
        break;

      case "anthropic":
        sdkInstance = createAnthropic({
          apiKey,
          baseURL: finalBaseUrl,
          fetch: customFetch,
        });
        break;

      case "google":
        sdkInstance = createGoogleGenerativeAI({
          apiKey,
          baseURL: finalBaseUrl,
          fetch: customFetch,
        });
        break;

      case "xai":
        sdkInstance = createXai({
          apiKey,
          baseURL: finalBaseUrl,
          fetch: customFetch,
        });
        break;

      case "azure":
        sdkInstance = createAzure({
          apiKey,
          resourceName: config?.resourceName,
          apiVersion: config?.apiVersion || "2024-02-01",
          fetch: customFetch,
        });
        break;

      default:
        throw new Error(`Unsupported SDK type: ${provider.sdkType}`);
    }

    // 缓存实例
    sdkInstances.set(cacheKey, sdkInstance);

    // 调试：检查 SDK 实例的可用方法
    logger.debug(`[SDK Manager] Created SDK instance for ${providerId}`, {
      sdkType: provider.sdkType,
      baseURL: finalBaseUrl,
      apiType,
      isCustomProvider,
      availableMethods: {
        hasChat: typeof sdkInstance.chat === "function",
        hasResponses: typeof sdkInstance.responses === "function",
        hasCompletion: typeof sdkInstance.completion === "function",
        isCallable: typeof sdkInstance === "function",
      },
    });

    return sdkInstance;
  } catch (error) {
    logger.error(
      `[SDK Manager] Failed to create SDK instance for ${providerId}:`,
      error,
    );
    throw error;
  }
}

// 清除SDK实例缓存
export function clearSDKCache(providerId?: string) {
  if (providerId) {
    sdkInstances.delete(providerId);
  } else {
    sdkInstances.clear();
  }
}

// 获取模型实例
export function getModel(
  providerId: string,
  modelName: string,
  config?: {
    apiKey: string;
    baseUrl?: string;
    resourceName?: string;
    apiVersion?: string;
  },
) {
  const sdkInstance = createSDKInstance(providerId, config);

  // 获取用户的 API 类型设置
  let apiType = "chat"; // 默认使用 chat API
  if (typeof window !== "undefined") {
    try {
      const { useAccessStore } = require("../store/access");
      const accessStore = useAccessStore.getState();

      // 检查是否是自定义服务商
      if (providerId.startsWith("custom_")) {
        const customProvider = accessStore.customProviders.find(
          (p: any) => p.id === providerId,
        );

        if (customProvider && customProvider.type === "openai") {
          // 自定义 OpenAI 类型服务商支持 API 类型选择
          const storeKey = `${providerId}ApiType`;
          apiType = (accessStore as any)[storeKey] || "chat";
          logger.debug(
            `[SDK Manager] Custom OpenAI provider API type for model ${modelName}:`,
            {
              providerId,
              storeKey,
              rawValue: (accessStore as any)[storeKey],
              finalApiType: apiType,
            },
          );
        }
      } else {
        // 内置服务商
        const provider = getAllProviders().find((p) => p.id === providerId);

        if (provider?.storeKeys?.apiType) {
          const storeKey = provider.storeKeys.apiType;
          apiType = (accessStore as any)[storeKey] || "chat";
          logger.debug(`[SDK Manager] API type for model ${modelName}:`, {
            providerId,
            storeKey,
            rawValue: (accessStore as any)[storeKey],
            finalApiType: apiType,
          });
        } else {
          logger.debug(
            `[SDK Manager] No apiType storeKey for provider ${providerId}, using default chat API`,
          );
        }
      }
    } catch (error) {
      logger.warn(
        `[SDK Manager] Could not get API type for model creation:`,
        error,
      );
    }
  }

  // 获取 provider 信息（内置或自定义）
  let provider: any = null;
  let isCustomProvider = false;

  if (providerId.startsWith("custom_")) {
    isCustomProvider = true;
    if (typeof window !== "undefined") {
      try {
        const { useAccessStore } = require("../store/access");
        const accessStore = useAccessStore.getState();
        const customProvider = accessStore.customProviders.find(
          (p: any) => p.id === providerId,
        );
        if (customProvider) {
          // 为自定义服务商创建虚拟 provider 配置
          provider = {
            id: providerId,
            name: customProvider.name,
            // 自定义 OpenAI 类型使用 openai-compatible SDK
            sdkType:
              customProvider.type === "openai"
                ? "openai-compatible"
                : customProvider.type,
            defaultBaseUrl: customProvider.endpoint || "",
          };
        }
      } catch (error) {
        logger.error(
          `[SDK Manager] Failed to get custom provider ${providerId}:`,
          error,
        );
      }
    }
  } else {
    provider = getAllProviders().find((p) => p.id === providerId);
  }

  // Response API 处理：对于 openai-compatible 类型（包括自定义 OpenAI 类型）
  if (apiType === "response" && provider?.sdkType === "openai-compatible") {
    let apiKey = config?.apiKey;
    let baseUrl = config?.baseUrl;

    if (!apiKey && typeof window !== "undefined") {
      try {
        const { useAccessStore } = require("../store/access");
        const accessStore = useAccessStore.getState();

        if (isCustomProvider) {
          // 自定义服务商直接从配置获取
          const customProvider = accessStore.customProviders.find(
            (p: any) => p.id === providerId,
          );
          if (customProvider) {
            apiKey = customProvider.apiKey;
            baseUrl = customProvider.endpoint;
          }
        } else {
          // 内置服务商从 store 获取配置
          const storeConfig = accessStore.getProviderConfig(providerId);
          apiKey = storeConfig.apiKey;
          baseUrl = storeConfig.baseUrl;
        }
      } catch (error) {
        logger.warn(
          `[SDK Manager] Could not get config for response API ${providerId}:`,
          error,
        );
      }
    }

    if (!apiKey) {
      throw new Error(`API key not provided for ${providerId}`);
    }

    const finalBaseUrl = baseUrl || provider?.defaultBaseUrl;
    const responseCacheKey = `${providerId}-${apiKey}-responses`;
    let responseInstance = sdkInstances.get(responseCacheKey);
    if (!responseInstance) {
      responseInstance = createOpenAI({
        apiKey,
        baseURL: finalBaseUrl,
        fetch: getCustomFetch(),
      });
      sdkInstances.set(responseCacheKey, responseInstance);
    }

    logger.debug(
      `[SDK Manager] Using OpenAI Responses model for openai-compatible provider ${providerId}`,
    );
    if (responseInstance.responses) {
      return responseInstance.responses(modelName);
    }
    return responseInstance(modelName);
  }

  // 根据 API 类型选择正确的方法
  // 参考 OpenAI SDK 文档：
  // - AI SDK 5 默认使用 Response API: openai('model')
  // - Chat API 需要明确调用: openai.chat('model')
  // - Response API 可以使用: openai('model') 或 openai.responses('model')
  if (apiType === "response") {
    // 用户启用了 Response API
    logger.debug(`[SDK Manager] Using Response API for model ${modelName}`);
    if (sdkInstance.responses) {
      // 明确使用 .responses() 方法
      return sdkInstance.responses(modelName);
    } else {
      // 使用默认方法（AI SDK 5 默认就是 Response API）
      logger.debug(
        `[SDK Manager] No .responses method, using default (Response API) for ${modelName}`,
      );
      return sdkInstance(modelName);
    }
  } else {
    // 用户使用 Chat API，必须明确使用 .chat() 方法
    logger.debug(`[SDK Manager] Using Chat API (.chat) for model ${modelName}`);
    if (sdkInstance.chat) {
      return sdkInstance.chat(modelName);
    } else {
      // 如果没有 chat 方法，记录错误并使用默认方法
      logger.error(
        `[SDK Manager] No .chat method available for ${providerId}, falling back to default (Response API)!`,
      );
      logger.error(
        `[SDK Manager] This means the request will use Response API even though user disabled it!`,
      );
      return sdkInstance(modelName);
    }
  }
}

// 通用的文本生成方法
export async function generateTextWithSDK(
  providerId: string,
  modelName: string,
  options: any,
  config?: {
    apiKey: string;
    baseUrl?: string;
    resourceName?: string;
    apiVersion?: string;
  },
) {
  const model = getModel(providerId, modelName, config);
  return await generateText({
    model,
    ...options,
  });
}

// 通用的流式文本生成方法
export function streamTextWithSDK(
  providerId: string,
  modelName: string,
  options: any,
  config?: {
    apiKey: string;
    baseUrl?: string;
    resourceName?: string;
    apiVersion?: string;
  },
) {
  const model = getModel(providerId, modelName, config);
  return streamText({
    model,
    ...options,
  });
}

// 检查provider是否支持特定功能
export function supportsFeature(providerId: string, _feature: string): boolean {
  const provider = getAllProviders().find((p) => p.id === providerId);
  if (!provider) return false;

  // 这里可以根据SDK类型和功能来判断支持情况
  // 暂时返回true，具体逻辑可以后续完善
  return true;
}

// 验证provider配置是否有效
export function validateProviderConfig(
  providerId: string,
  config?: { apiKey: string },
): boolean {
  try {
    const provider = getAllProviders().find((p) => p.id === providerId);
    if (!provider) return false;

    // 如果提供了配置，直接验证
    if (config) {
      return !!config.apiKey;
    }

    // 否则尝试从客户端 store 获取（仅在客户端环境）
    if (typeof window !== "undefined") {
      try {
        const { useAccessStore } = require("../store/access");
        const accessStore = useAccessStore.getState();
        return accessStore.isValidProvider(providerId);
      } catch (error) {
        logger.error(
          `[SDK Manager] Failed to validate provider config for ${providerId}:`,
          error,
        );
        return false;
      }
    }

    return false;
  } catch (error) {
    logger.error(
      `[SDK Manager] Failed to validate provider config for ${providerId}:`,
      error,
    );
    return false;
  }
}
