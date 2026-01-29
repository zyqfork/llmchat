import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { createAzure } from "@ai-sdk/azure";
import { generateText, streamText } from "ai";

import { getAllProviders } from "../constant";
import { logger } from "../utils/logger";

// SDK实例缓存
const sdkInstances = new Map<string, any>();

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

  if (!apiKey && typeof window !== "undefined") {
    try {
      const { useAccessStore } = require("../store/access");
      const accessStore = useAccessStore.getState();
      const storeConfig = accessStore.getProviderConfig(providerId);
      apiKey = storeConfig.apiKey;
      baseUrl = storeConfig.baseUrl;
    } catch (error) {
      logger.warn(
        `[SDK Manager] Could not get config from store for ${providerId}:`,
        error,
      );
    }
  }

  if (!apiKey) {
    throw new Error(`API key not provided for ${providerId}`);
  }

  let sdkInstance: any;

  try {
    switch (provider.sdkType) {
      case "openai":
        sdkInstance = createOpenAI({
          apiKey,
          baseURL: baseUrl || (provider as any).defaultBaseUrl,
        });
        break;

      case "openai-compatible":
        sdkInstance = createOpenAICompatible({
          apiKey,
          baseURL: baseUrl || (provider as any).defaultBaseUrl,
          name: provider.id,
        });
        break;

      case "anthropic":
        sdkInstance = createAnthropic({
          apiKey,
          baseURL: baseUrl || (provider as any).defaultBaseUrl,
        });
        break;

      case "google":
        sdkInstance = createGoogleGenerativeAI({
          apiKey,
          baseURL: baseUrl || (provider as any).defaultBaseUrl,
        });
        break;

      case "xai":
        sdkInstance = createXai({
          apiKey,
          baseURL: baseUrl || (provider as any).defaultBaseUrl,
        });
        break;

      case "azure":
        sdkInstance = createAzure({
          apiKey,
          resourceName: config?.resourceName,
          apiVersion: config?.apiVersion || "2024-02-01",
        });
        break;

      default:
        throw new Error(`Unsupported SDK type: ${provider.sdkType}`);
    }

    // 缓存实例
    sdkInstances.set(cacheKey, sdkInstance);
    logger.debug(`[SDK Manager] Created SDK instance for ${providerId}`, {
      sdkType: provider.sdkType,
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
