import {
  ServiceProvider,
  getProviderConfig,
  getAllProviders,
} from "../constant";
import { useAccessStore, CustomProviderType } from "../store/access";
import { LLMModel } from "./api";
import { logger } from "../utils/logger";
import { fetch } from "../utils/fetch";

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

      // 标准化 provider 参数：支持通过 ID 或名称查找
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
      const useProxy = useProxyKey ? (accessStore as any)[useProxyKey] : false;

      // 处理自定义服务商
      if (typeof provider === "string" && provider.startsWith("custom_")) {
        const customProvider = accessStore.customProviders.find(
          (p) => p.id === provider,
        );
        if (customProvider) {
          return await this.fetchCustomProviderModels(customProvider);
        }
      }

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
      if (error instanceof TypeError && error.message.includes("fetch")) {
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
      return {
        models: [],
        success: false,
        error: `${providerId}模型列表获取失败（直连模式）。\n\n错误详情: ${errorMessage}\n\n如果问题持续存在，建议使用内置模型列表。`,
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
    // 根据自定义服务商的类型调用相应的方法
    const typeToFetcherMap: Record<
      CustomProviderType,
      () => Promise<ModelFetchResponse>
    > = {
      openai: () => this.fetchModelsDirectly("openai", ServiceProvider.OpenAI),
      anthropic: () =>
        this.fetchModelsDirectly("anthropic", ServiceProvider.Anthropic),
      google: () => this.fetchModelsDirectly("google", ServiceProvider.Google),
    };

    const fetcher = typeToFetcherMap[customProvider.type as CustomProviderType];
    if (fetcher) {
      return await fetcher();
    }

    return {
      models: [],
      success: false,
      error: `不支持的自定义服务商类型: ${customProvider.type}`,
    };
  }
}
