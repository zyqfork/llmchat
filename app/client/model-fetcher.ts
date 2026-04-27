import {
  ServiceProvider,
  getProviderConfig,
  getAllProviders,
} from "../constant";
import { useAccessStore, CustomProviderType } from "../store/access";
import { LLMModel } from "./api";
import { logger } from "../utils/logger";
import { fetch } from "../utils/fetch";
import {
  isCorsErrorCompat,
  shouldUseProxyForProviderCompat,
} from "../utils/pi-web-ui-compat";

// 统一的模型响应接口
export interface ModelFetchResponse {
  models: LLMModel[];
  success: boolean;
  error?: string;
}

/**
 * 统一的模型获取服务
 */
export class ModelFetcher {
  /**
   * 从指定服务商获取可用模型列表
   */
  static async fetchModels(provider: string): Promise<ModelFetchResponse> {
    try {
      const accessStore = useAccessStore.getState();

      // 首先检查是否是自定义服务商
      if (typeof provider === "string" && provider.startsWith("custom_")) {
        const customProvider = accessStore.customProviders.find(
          (p) => p.id === provider,
        );
        if (customProvider) {
          return await this.fetchCustomProviderModels(customProvider);
        } else {
          return {
            models: [],
            success: false,
            error: `自定义服务商 ${provider} 未找到`,
          };
        }
      }

      // 标准化 provider 参数：支持通过 ID 或名称查找内置服务商
      let providerId: string;
      let providerConfig = getProviderConfig(provider);

      if (!providerConfig) {
        // 如果通过 ID 找不到，尝试通过名称查找
        const allProviders = getAllProviders();
        providerConfig = allProviders.find((p) => p.name === provider);
      }

      if (!providerConfig) {
        return {
          models: [],
          success: false,
          error: `不支持的服务商: ${provider}`,
        };
      }

      providerId = providerConfig.id;

      // 检查是否启用了代理
      const useProxyKey = providerConfig.storeKeys.useProxy;
      const manualUseProxy = useProxyKey
        ? (accessStore as any)[useProxyKey]
        : false;
      const apiKey = providerConfig.storeKeys.apiKey
        ? (accessStore as any)[providerConfig.storeKeys.apiKey]
        : "";
      const autoUseProxy =
        !!apiKey && shouldUseProxyForProviderCompat(providerId, String(apiKey));
      const useProxy = manualUseProxy || autoUseProxy;

      if (useProxy) {
        // 使用代理时，通过本地 /api/models 接口
        return await this.fetchModelsViaProxy(providerId);
      } else {
        // 不使用代理时，直接请求远程 API
        return await this.fetchModelsDirectly(providerId, providerConfig);
      }
    } catch (error) {
      logger.error(`[ModelFetcher] 获取 ${provider} 模型失败:`, error);
      return {
        models: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 通过代理获取模型列表（使用本地 /api/models 接口）
   */
  private static async fetchModelsViaProxy(
    providerId: string,
  ): Promise<ModelFetchResponse> {
    try {
      const response = await fetch(`/api/models?provider=${providerId}`);

      if (!response.ok) {
        // 如果代理 API 不可用（如静态导出模式），回退到直接请求
        if (response.status === 404) {
          logger.warn(
            `[ModelFetcher] Proxy API not available, falling back to direct request for ${providerId}`,
          );
          const providerConfig = getProviderConfig(providerId);
          if (providerConfig) {
            return await this.fetchModelsDirectly(providerId, providerConfig);
          }
        }

        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const models = await response.json();

      return {
        models: Array.isArray(models) ? models : [],
        success: true,
      };
    } catch (error) {
      // 如果是网络错误或 API 不存在，尝试直接请求
      if (
        isCorsErrorCompat(error) ||
        (error instanceof TypeError && error.message.includes("fetch"))
      ) {
        logger.warn(
          `[ModelFetcher] Proxy API fetch failed, falling back to direct request for ${providerId}`,
        );
        const providerConfig = getProviderConfig(providerId);
        if (providerConfig) {
          return await this.fetchModelsDirectly(providerId, providerConfig);
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        models: [],
        success: false,
        error: `${providerId}模型列表获取失败（代理模式）。\n\n错误详情: ${errorMessage}\n\n如果问题持续存在，建议使用内置模型列表。`,
      };
    }
  }

  /**
   * 直接请求远程 API 获取模型列表
   */
  private static async fetchModelsDirectly(
    providerId: string,
    providerConfig: any,
  ): Promise<ModelFetchResponse> {
    try {
      const accessStore = useAccessStore.getState();

      // 获取 API 配置
      const apiKey = (accessStore as any)[providerConfig.storeKeys.apiKey];
      const baseUrl =
        (accessStore as any)[providerConfig.storeKeys.baseUrl] ||
        providerConfig.defaultBaseUrl;

      if (!apiKey && providerId !== "ollama") {
        throw new Error(`缺少 API Key`);
      }

      // 构建请求 URL
      const modelsEndpoint = providerConfig.endpoints.models || "models";
      const requestUrl = `${baseUrl}/${modelsEndpoint}`;

      // 构建请求头
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // 根据不同厂商设置认证头
      if (apiKey) {
        switch (providerId) {
          case "openai":
          case "deepseek":
          case "moonshotai":
          case "xai":
          case "siliconflow":
          case "zai":
          case "ollama-cloud":
            headers["Authorization"] = `Bearer ${apiKey}`;
            break;
          case "anthropic":
            headers["x-api-key"] = apiKey;
            headers["anthropic-version"] = "2023-06-01";
            break;
          case "google":
            headers["x-goog-api-key"] = apiKey;
            break;
          case "alibaba":
            headers["Authorization"] = `Bearer ${apiKey}`;
            break;
          case "azure":
            headers["api-key"] = apiKey;
            const apiVersion = (accessStore as any)[
              providerConfig.storeKeys.apiVersion!
            ];
            if (apiVersion) {
              // Azure 使用查询参数传递 API 版本
              const url = new URL(requestUrl);
              url.searchParams.set("api-version", apiVersion);
              return await this.makeDirectRequest(
                url.toString(),
                headers,
                providerId,
              );
            }
            break;
        }
      }

      return await this.makeDirectRequest(requestUrl, headers, providerId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const corsHint = isCorsErrorCompat(error)
        ? "\n\n检测到可能的跨域(CORS)错误，请尝试开启代理配置。"
        : "";
      return {
        models: [],
        success: false,
        error: `${providerId}模型列表获取失败（直连模式）。\n\n错误详情: ${errorMessage}${corsHint}\n\n如果问题持续存在，建议使用内置模型列表。`,
      };
    }
  }

  /**
   * 执行直接请求并处理响应
   */
  private static async makeDirectRequest(
    url: string,
    headers: Record<string, string>,
    providerId: string,
  ): Promise<ModelFetchResponse> {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // 标准化不同厂商的响应格式
    let models: LLMModel[] = [];

    switch (providerId) {
      case "openai":
      case "deepseek":
      case "moonshotai":
      case "xai":
      case "siliconflow":
      case "zai":
      case "ollama-cloud":
      case "ollama":
      case "alibaba":
        // OpenAI 兼容格式
        if (data.data && Array.isArray(data.data)) {
          models = data.data.map((model: any, index: number) => ({
            name: model.id,
            available: true,
            sorted: index,
            provider: {
              id: providerId,
              providerName: providerId,
              providerType: providerId,
              sorted: 0,
            },
          }));
        }
        break;

      case "anthropic":
        // Anthropic 格式
        if (data.data && Array.isArray(data.data)) {
          models = data.data.map((model: any, index: number) => ({
            name: model.id,
            available: true,
            sorted: index,
            provider: {
              id: providerId,
              providerName: providerId,
              providerType: providerId,
              sorted: 0,
            },
          }));
        }
        break;

      case "google":
        // Google 格式
        if (data.models && Array.isArray(data.models)) {
          models = data.models
            .filter(
              (model: any) => model.name && model.name.startsWith("models/"),
            )
            .map((model: any, index: number) => ({
              name: model.name.replace("models/", ""),
              available: true,
              sorted: index,
              provider: {
                id: providerId,
                providerName: providerId,
                providerType: providerId,
                sorted: 0,
              },
            }));
        }
        break;

      default:
        // 默认处理
        if (Array.isArray(data)) {
          models = data.map((model: any, index: number) => ({
            name: typeof model === "string" ? model : model.id || model.name,
            available: true,
            sorted: index,
            provider: {
              id: providerId,
              providerName: providerId,
              providerType: providerId,
              sorted: 0,
            },
          }));
        }
        break;
    }

    return {
      models,
      success: true,
    };
  }

  /**
   * 获取自定义服务商模型
   */
  private static async fetchCustomProviderModels(
    customProvider: any,
  ): Promise<ModelFetchResponse> {
    try {
      // 直接使用自定义服务商的配置请求 /models 接口
      const apiKey = customProvider.apiKey;
      const baseUrl = customProvider.endpoint;

      if (!apiKey) {
        throw new Error(`自定义服务商缺少 API Key`);
      }

      if (!baseUrl) {
        throw new Error(`自定义服务商缺少端点 URL`);
      }

      // 构建请求 URL - 使用标准的 /models 端点
      const requestUrl = `${baseUrl}/models`;

      // 构建请求头
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // 根据自定义服务商类型设置认证头
      switch (customProvider.type) {
        case "openai":
          headers["Authorization"] = `Bearer ${apiKey}`;
          break;
        case "anthropic":
          headers["x-api-key"] = apiKey;
          headers["anthropic-version"] = "2023-06-01";
          break;
        case "google":
          headers["x-goog-api-key"] = apiKey;
          break;
        default:
          // 默认使用 Bearer token
          headers["Authorization"] = `Bearer ${apiKey}`;
          break;
      }

      logger.debug(`[Model Fetcher] Fetching models from custom provider:`, {
        providerId: customProvider.id,
        type: customProvider.type,
        url: requestUrl,
      });

      // 发起请求
      const response = await fetch(requestUrl, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 解析响应数据
      const models = this.parseModelsResponse(
        data,
        customProvider.id,
        customProvider.name,
      );

      logger.debug(`[Model Fetcher] Custom provider models fetched:`, {
        providerId: customProvider.id,
        count: models.length,
      });

      return {
        models,
        success: true,
      };
    } catch (error) {
      logger.error(
        `[Model Fetcher] Failed to fetch custom provider models:`,
        error,
      );
      return {
        models: [],
        success: false,
        error: `获取自定义服务商模型失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * 解析不同类型服务商的模型响应
   */
  private static parseModelsResponse(
    data: any,
    providerId: string,
    providerName: string,
  ): LLMModel[] {
    const models: LLMModel[] = [];

    try {
      // OpenAI 格式的响应
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((model: any) => {
          if (model.id) {
            models.push({
              name: model.id,
              displayName: model.id,
              available: true,
              provider: {
                id: providerId, // 使用自定义服务商的ID
                providerName: providerName, // 使用自定义服务商的名称
                providerType: "custom",
                sorted: 999,
              },
              sorted: 999,
            });
          }
        });
      }
      // 直接数组格式的响应
      else if (Array.isArray(data)) {
        data.forEach((model: any) => {
          const modelName =
            typeof model === "string" ? model : model.id || model.name;
          if (modelName) {
            models.push({
              name: modelName,
              displayName: modelName,
              available: true,
              provider: {
                id: providerId, // 使用自定义服务商的ID
                providerName: providerName, // 使用自定义服务商的名称
                providerType: "custom",
                sorted: 999,
              },
              sorted: 999,
            });
          }
        });
      }
      // 其他格式的响应
      else if (data.models && Array.isArray(data.models)) {
        data.models.forEach((model: any) => {
          const modelName = model.id || model.name;
          if (modelName) {
            models.push({
              name: modelName,
              displayName: modelName,
              available: true,
              provider: {
                id: providerId, // 使用自定义服务商的ID
                providerName: providerName, // 使用自定义服务商的名称
                providerType: "custom",
                sorted: 999,
              },
              sorted: 999,
            });
          }
        });
      }
    } catch (error) {
      logger.warn(`[Model Fetcher] Failed to parse models response:`, error);
    }

    logger.debug(`[Model Fetcher] Parsed models:`, {
      providerId,
      providerName,
      count: models.length,
      sampleModel: models[0],
    });

    return models;
  }
}
