import { ServiceProvider } from "../constant";
import { useAccessStore } from "../store/access";
import { LLMModel } from "./api";
import { getHeaders } from "./api";

// 统一的模型响应接口
export interface ModelFetchResponse {
  models: LLMModel[];
  success: boolean;
  error?: string;
}

// OpenAI格式的模型响应
interface OpenAIModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    owned_by?: string;
    created?: number;
  }>;
}

// Anthropic格式的模型响应
interface AnthropicModelResponse {
  data: Array<{
    id: string;
    display_name: string;
    created_at: string;
    type: string;
  }>;
  has_more: boolean;
  first_id?: string;
  last_id?: string;
}

// Google格式的模型响应（简化）
interface GoogleModelResponse {
  models: Array<{
    name: string;
    displayName: string;
    description?: string;
  }>;
}

/**
 * 统一的模型获取服务
 */
export class ModelFetcher {
  /**
   * 从指定服务商获取可用模型列表
   */
  static async fetchModels(
    provider: ServiceProvider | string,
  ): Promise<ModelFetchResponse> {
    try {
      const accessStore = useAccessStore.getState();

      switch (provider) {
        case ServiceProvider.OpenAI:
          return await this.fetchOpenAIModels(
            accessStore.openaiUrl,
            accessStore.openaiApiKey,
          );

        case ServiceProvider.Azure:
          return await this.fetchOpenAIModels(
            accessStore.azureUrl,
            accessStore.azureApiKey,
            true,
          );

        case ServiceProvider.Anthropic:
          return await this.fetchAnthropicModels(
            accessStore.anthropicUrl,
            accessStore.anthropicApiKey,
          );

        case ServiceProvider.Google:
          return await this.fetchGoogleModels(
            accessStore.googleUrl,
            accessStore.googleApiKey,
          );

        case ServiceProvider.DeepSeek:
          return await this.fetchDeepSeekModels(
            accessStore.deepseekUrl,
            accessStore.deepseekApiKey,
          );

        case ServiceProvider.Moonshot:
          return await this.fetchMoonshotModels(
            accessStore.moonshotUrl,
            accessStore.moonshotApiKey,
          );

        case ServiceProvider.ByteDance:
          return await this.fetchByteDanceModels(
            accessStore.bytedanceUrl,
            accessStore.bytedanceApiKey,
          );

        case ServiceProvider.Alibaba:
          return await this.fetchAlibabaModels(
            accessStore.alibabaUrl,
            accessStore.alibabaApiKey,
          );

        case ServiceProvider.XAI:
          return await this.fetchXAIModels(
            accessStore.xaiUrl,
            accessStore.xaiApiKey,
          );

        case ServiceProvider.SiliconFlow:
          return await this.fetchSiliconFlowModels(
            accessStore.siliconflowUrl,
            accessStore.siliconflowApiKey,
          );

        default:
          // 处理自定义服务商
          if (typeof provider === "string" && provider.startsWith("custom_")) {
            const customProvider = accessStore.customProviders.find(
              (p) => p.id === provider,
            );
            if (customProvider) {
              return await this.fetchCustomProviderModels(customProvider);
            }
          }

          return {
            models: [],
            success: false,
            error: `不支持的服务商: ${provider}`,
          };
      }
    } catch (error) {
      console.error(`[ModelFetcher] 获取 ${provider} 模型失败:`, error);
      return {
        models: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取OpenAI格式的模型（OpenAI、Azure、Moonshot、ByteDance等）
   */
  private static async fetchOpenAIModels(
    baseUrl: string,
    apiKey: string,
    isAzure = false,
  ): Promise<ModelFetchResponse> {
    if (!apiKey) {
      return {
        models: [],
        success: false,
        error: "API密钥未配置",
      };
    }

    const url = isAzure
      ? `${baseUrl}/openai/deployments?api-version=2023-05-15`
      : `${baseUrl}/v1/models`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as OpenAIModelResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return {
        models: [],
        success: false,
        error: "响应格式错误",
      };
    }

    const models: LLMModel[] = data.data.map((model, index) => ({
      name: model.id,
      available: true,
      sorted: 1000 + index,
      provider: {
        id: isAzure ? "azure" : "openai",
        providerName: isAzure ? "Azure" : "OpenAI",
        providerType: isAzure ? "azure" : "openai",
        sorted: isAzure ? 2 : 1,
      },
    }));

    return {
      models,
      success: true,
    };
  }

  /**
   * 获取Anthropic模型
   */
  private static async fetchAnthropicModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    if (!apiKey) {
      return {
        models: [],
        success: false,
        error: "API密钥未配置",
      };
    }

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: "GET",
      headers: {
        ...getHeaders(),
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as AnthropicModelResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return {
        models: [],
        success: false,
        error: "响应格式错误",
      };
    }

    const models: LLMModel[] = data.data.map((model, index) => ({
      name: model.id,
      available: true,
      sorted: 1000 + index,
      provider: {
        id: "anthropic",
        providerName: "Anthropic",
        providerType: "anthropic",
        sorted: 4,
      },
    }));

    return {
      models,
      success: true,
    };
  }

  /**
   * 获取Google模型（简化实现）
   */
  private static async fetchGoogleModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    if (!apiKey) {
      return {
        models: [],
        success: false,
        error: "API密钥未配置",
      };
    }

    // Google的模型列表API比较复杂，这里先返回一个简化的实现
    // 实际使用时可能需要使用Google的SDK
    return {
      models: [],
      success: false,
      error: "Google模型获取暂未实现，请使用内置模型列表",
    };
  }

  /**
   * 获取DeepSeek模型
   */
  private static async fetchDeepSeekModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    if (!apiKey) {
      return {
        models: [],
        success: false,
        error: "API密钥未配置",
      };
    }

    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        ...getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as OpenAIModelResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return {
        models: [],
        success: false,
        error: "响应格式错误",
      };
    }

    const models: LLMModel[] = data.data.map((model, index) => ({
      name: model.id,
      available: true,
      sorted: 1000 + index,
      provider: {
        id: "deepseek",
        providerName: "DeepSeek",
        providerType: "deepseek",
        sorted: 9,
      },
    }));

    return {
      models,
      success: true,
    };
  }

  /**
   * 获取Moonshot模型（兼容OpenAI格式）
   */
  private static async fetchMoonshotModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    return await this.fetchOpenAICompatibleModels(baseUrl, apiKey, {
      id: "moonshot",
      providerName: "Moonshot",
      providerType: "moonshot",
      sorted: 7,
    });
  }

  /**
   * 获取ByteDance模型（兼容OpenAI格式）
   */
  private static async fetchByteDanceModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    return await this.fetchOpenAICompatibleModels(baseUrl, apiKey, {
      id: "bytedance",
      providerName: "ByteDance",
      providerType: "bytedance",
      sorted: 5,
    });
  }

  /**
   * 获取Alibaba模型（兼容OpenAI格式）
   */
  private static async fetchAlibabaModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    return await this.fetchOpenAICompatibleModels(baseUrl, apiKey, {
      id: "alibaba",
      providerName: "Alibaba",
      providerType: "alibaba",
      sorted: 6,
    });
  }

  /**
   * 获取XAI模型（兼容OpenAI格式）
   */
  private static async fetchXAIModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    return await this.fetchOpenAICompatibleModels(baseUrl, apiKey, {
      id: "xai",
      providerName: "XAI",
      providerType: "xai",
      sorted: 8,
    });
  }

  /**
   * 获取SiliconFlow模型（兼容OpenAI格式）
   */
  private static async fetchSiliconFlowModels(
    baseUrl: string,
    apiKey: string,
  ): Promise<ModelFetchResponse> {
    return await this.fetchOpenAICompatibleModels(baseUrl, apiKey, {
      id: "siliconflow",
      providerName: "SiliconFlow",
      providerType: "siliconflow",
      sorted: 10,
    });
  }

  /**
   * 通用的OpenAI兼容格式模型获取
   */
  private static async fetchOpenAICompatibleModels(
    baseUrl: string,
    apiKey: string,
    providerInfo: {
      id: string;
      providerName: string;
      providerType: string;
      sorted: number;
    },
  ): Promise<ModelFetchResponse> {
    if (!apiKey) {
      return {
        models: [],
        success: false,
        error: "API密钥未配置",
      };
    }

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: "GET",
      headers: {
        ...getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as OpenAIModelResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return {
        models: [],
        success: false,
        error: "响应格式错误",
      };
    }

    const models: LLMModel[] = data.data.map((model, index) => ({
      name: model.id,
      available: true,
      sorted: 1000 + index,
      provider: providerInfo,
    }));

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
    switch (customProvider.type) {
      case "openai":
        return await this.fetchOpenAICompatibleModels(
          customProvider.baseUrl,
          customProvider.apiKey,
          {
            id: customProvider.id,
            providerName: customProvider.name,
            providerType: "openai",
            sorted: 100,
          },
        );

      case "anthropic":
        return await this.fetchAnthropicModels(
          customProvider.baseUrl,
          customProvider.apiKey,
        );

      case "google":
        return await this.fetchGoogleModels(
          customProvider.baseUrl,
          customProvider.apiKey,
        );

      default:
        return {
          models: [],
          success: false,
          error: `不支持的自定义服务商类型: ${customProvider.type}`,
        };
    }
  }
}
