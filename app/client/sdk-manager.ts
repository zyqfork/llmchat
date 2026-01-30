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

  const provider = getAllProviders().find((p) => p.id === providerId);
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
      const storeConfig = accessStore.getProviderConfig(providerId);
      apiKey = storeConfig.apiKey;
      baseUrl = storeConfig.baseUrl;

      // 获取用户的 API 类型设置
      if (provider.storeKeys.apiType) {
        apiType = (accessStore as any)[provider.storeKeys.apiType] || "chat";
      }

      logger.debug(`[SDK Manager] Provider ${providerId} config:`, {
        hasApiKey: !!apiKey,
        baseUrl,
        apiType,
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
        apiType = (accessStore as any)[provider.storeKeys.apiType] || "chat";
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
  let finalBaseUrl = baseUrl || (provider as any).defaultBaseUrl;

  // 如果用户配置了外部代理，需要根据 API 类型设置正确的端点
  if (baseUrl && baseUrl !== (provider as any).defaultBaseUrl) {
    logger.debug(
      `[SDK Manager] External proxy detected for ${providerId}, API type: ${apiType}`,
    );

    // 根据用户的 API 类型设置选择正确的端点
    if (apiType === "response") {
      // 用户明确选择了 Response API，确保使用 responses 端点
      if (!finalBaseUrl.includes("/responses")) {
        if (finalBaseUrl.includes("/chat/completions")) {
          finalBaseUrl = finalBaseUrl.replace(
            "/chat/completions",
            "/responses",
          );
        } else if (finalBaseUrl.includes("/v1/chat/completions")) {
          finalBaseUrl = finalBaseUrl.replace(
            "/v1/chat/completions",
            "/v1/responses",
          );
        } else {
          // 对于以 /v1 结尾的URL，直接使用，让AI SDK自己添加端点
          // 不需要手动添加 /responses，避免重复
          logger.debug(
            `[SDK Manager] Using base URL as-is for Response API: ${finalBaseUrl}`,
          );
        }
        if (finalBaseUrl !== baseUrl) {
          logger.debug(
            `[SDK Manager] Modified baseUrl for Response API: ${finalBaseUrl}`,
          );
        }
      }
      logger.debug(
        `[SDK Manager] Using Response API with external proxy: ${finalBaseUrl}`,
      );
    } else {
      // 用户选择了 Chat API（默认），确保使用 chat/completions 端点
      if (finalBaseUrl.includes("/responses")) {
        finalBaseUrl = finalBaseUrl.replace("/responses", "/chat/completions");
        logger.debug(
          `[SDK Manager] Modified baseUrl for Chat API: ${finalBaseUrl}`,
        );
      } else if (finalBaseUrl.includes("/v1/responses")) {
        finalBaseUrl = finalBaseUrl.replace(
          "/v1/responses",
          "/v1/chat/completions",
        );
        logger.debug(
          `[SDK Manager] Modified baseUrl for Chat API: ${finalBaseUrl}`,
        );
      }
      logger.debug(
        `[SDK Manager] Using Chat API with external proxy: ${finalBaseUrl}`,
      );
    }
  }

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
    logger.debug(`[SDK Manager] Created SDK instance for ${providerId}`, {
      sdkType: provider.sdkType,
      baseURL: finalBaseUrl,
      apiType,
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
  return sdkInstance(modelName);
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
