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

// Google格式的模型响应（基于官方API）
interface GoogleModelResponse {
  models: Array<{
    name: string;
    baseModelId: string;
    version: string;
    displayName: string;
    description?: string;
    supportedGenerationMethods?: string[];
    inputTokenLimit?: number;
    outputTokenLimit?: number;
  }>;
  nextPageToken?: string;
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
   * 注意：Anthropic目前没有公开的模型列表API，尝试使用OpenAI兼容格式
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

    try {
      // 尝试使用OpenAI兼容格式
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

      const data = (await response.json()) as OpenAIModelResponse;

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("响应格式错误");
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
    } catch (error) {
      // 如果API调用失败，返回说明信息
      return {
        models: [],
        success: false,
        error: `Anthropic暂未提供公开的模型列表API。错误信息: ${
          error instanceof Error ? error.message : String(error)
        }。请使用内置模型列表或手动配置模型。`,
      };
    }
  }

  /**
   * 获取Google模型
   * 使用Google Generative Language API的正确端点
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

    try {
      // 使用Google Generative Language API的正确端点
      // 如果baseUrl是自定义的，使用自定义URL，否则使用官方端点
      const apiUrl = baseUrl.includes("generativelanguage.googleapis.com")
        ? `${baseUrl}/v1beta/models?key=${apiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

      // 对于Google API，使用最简单的请求头避免CORS问题
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        // 尝试读取错误响应内容
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (e) {
          // 忽略读取错误
        }

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (errorBody) {
          errorMessage += `\n响应内容: ${errorBody}`;
        }

        // 针对常见错误提供具体建议
        if (response.status === 401) {
          errorMessage +=
            "\n\n可能的解决方案：\n" +
            "1. 检查API密钥是否正确\n" +
            "2. 确认API密钥已启用Generative Language API\n" +
            "3. 在Google AI Studio (https://aistudio.google.com) 中重新生成API密钥\n" +
            "4. 确认API密钥没有IP限制或其他访问限制";
        } else if (response.status === 403) {
          errorMessage +=
            "\n\n可能的解决方案：\n" +
            "1. 检查API密钥是否有访问Generative Language API的权限\n" +
            "2. 确认您的Google Cloud项目已启用相关API\n" +
            "3. 检查是否超出了配额限制";
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as GoogleModelResponse;

      if (!data.models || !Array.isArray(data.models)) {
        throw new Error("响应格式错误");
      }

      const models: LLMModel[] = data.models
        .filter((model) => {
          // 过滤掉不支持generateContent的模型
          return model.supportedGenerationMethods?.includes("generateContent");
        })
        .map((model, index) => ({
          name: model.baseModelId || model.name.replace("models/", ""), // 使用baseModelId或移除前缀
          displayName: model.displayName || model.name,
          available: true,
          sorted: 1000 + index,
          provider: {
            id: "google",
            providerName: "Google",
            providerType: "google",
            sorted: 3,
          },
        }));

      return {
        models,
        success: true,
      };
    } catch (error) {
      // 如果API调用失败，返回详细的说明信息
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        models: [],
        success: false,
        error: `Google模型列表获取失败。\n\n错误详情: ${errorMessage}\n\n如果问题持续存在，建议使用内置模型列表。`,
      };
    }
  }

  /**
   * 获取DeepSeek模型
   * 使用DeepSeek官方API端点
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

    try {
      // DeepSeek使用 /models 端点（不是 /v1/models）
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
        throw new Error("响应格式错误");
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
    } catch (error) {
      // 如果API调用失败，返回详细的错误信息
      return {
        models: [],
        success: false,
        error: `DeepSeek 模型列表获取失败。错误信息: ${
          error instanceof Error ? error.message : String(error)
        }。请检查API密钥和网络连接，或使用内置模型列表。`,
      };
    }
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

    try {
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
        throw new Error("响应格式错误");
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
    } catch (error) {
      // 如果API调用失败，返回详细的错误信息
      return {
        models: [],
        success: false,
        error: `${providerInfo.providerName} 模型列表获取失败。错误信息: ${
          error instanceof Error ? error.message : String(error)
        }。请检查API密钥和网络连接，或使用内置模型列表。`,
      };
    }
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
