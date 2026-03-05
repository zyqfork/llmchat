import { openai, createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { xai, createXai } from "@ai-sdk/xai";
import { createAzure } from "@ai-sdk/azure";
import {
  streamText,
  generateText,
  generateImage,
  experimental_generateSpeech as generateSpeech,
} from "ai";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/app/utils/logger";
import { auth } from "./auth";
import { prettyObject } from "@/app/utils/format";
import { getProviderConfig, getAllProviders } from "@/app/constant";

// 定义消息类型
export interface Message {
  role: "system" | "user" | "assistant";
  content: any;
}

export interface SDKConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface OpenAICompatibleConfig extends SDKConfig {
  provider:
    | "openai"
    | "openai-compatible"
    | "anthropic"
    | "google"
    | "xai"
    | "azure";
  providerName?: string;
  // Azure特有配置
  resourceName?: string;
  deploymentName?: string;
  apiVersion?: string;
  // 厂商特定选项
  providerOptions?: Record<string, any>;
}

/**
 * 处理聊天请求的通用函数
 */
export async function handleChatRequest(config: OpenAICompatibleConfig) {
  try {
    // 清除之前的捕获信息
    clearCapturedRequestInfo();

    // 创建自定义 fetch 函数
    const debugFetch = createDebugFetch();

    let model;

    if (config.provider === "openai") {
      // 使用 OpenAI Chat API (明确指定chat以避免默认的responses API)
      if (config.baseURL && config.baseURL !== "https://api.openai.com/v1") {
        // 自定义 baseURL 的情况
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
          fetch: debugFetch as any,
        });
        model = customOpenAI.chat(config.model); // 明确使用chat API
      } else {
        // 默认 OpenAI - 使用环境变量或传入的 API key
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
          fetch: debugFetch as any,
        });
        model = customOpenAI.chat(config.model); // 明确使用chat API
      }
    } else if (config.provider === "anthropic") {
      // 使用 Anthropic SDK
      if (config.baseURL && config.baseURL !== "https://api.anthropic.com") {
        // 自定义 baseURL 的情况
        const customAnthropic = createAnthropic({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
          fetch: debugFetch as any,
        });
        model = customAnthropic(config.model);
      } else {
        // 默认 Anthropic
        const customAnthropic = createAnthropic({
          apiKey: config.apiKey,
          fetch: debugFetch as any,
        });
        model = customAnthropic(config.model);
      }
    } else if (config.provider === "google") {
      // 使用 Google SDK
      if (
        config.baseURL &&
        config.baseURL !== "https://generativelanguage.googleapis.com/v1beta"
      ) {
        // 自定义 baseURL 的情况
        const customGoogle = createGoogleGenerativeAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
          fetch: debugFetch as any,
        });
        model = customGoogle(config.model);
      } else {
        // 默认 Google
        const customGoogle = createGoogleGenerativeAI({
          apiKey: config.apiKey,
          fetch: debugFetch as any,
        });
        model = customGoogle(config.model);
      }
    } else if (config.provider === "xai") {
      // 使用 XAI SDK
      if (config.baseURL && config.baseURL !== "https://api.x.ai/v1") {
        // 自定义 baseURL 的情况
        const customXai = createXai({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
          fetch: debugFetch as any,
        });
        model = customXai(config.model);
      } else {
        // 默认 XAI
        const customXai = createXai({
          apiKey: config.apiKey,
          fetch: debugFetch as any,
        });
        model = customXai(config.model);
      }
    } else if (config.provider === "azure") {
      // 使用 Azure SDK
      const azureProvider = createAzure({
        apiKey: config.apiKey,
        resourceName: config.resourceName || "",
        apiVersion: config.apiVersion || "2024-02-01",
        fetch: debugFetch as any,
      });
      model = azureProvider(config.deploymentName || config.model);
    } else {
      // 使用 OpenAI 兼容 SDK
      const provider = createOpenAICompatible({
        name: config.providerName || "custom-provider",
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        includeUsage: true, // 在流式响应中包含使用信息
        fetch: debugFetch as any,
      });
      model = provider(config.model);
    }

    const requestParams: any = {
      model,
      messages: config.messages,
    };

    // 只添加有值的参数
    if (config.temperature !== undefined)
      requestParams.temperature = config.temperature;
    if (config.maxTokens !== undefined)
      requestParams.maxTokens = config.maxTokens;
    if (config.topP !== undefined) requestParams.topP = config.topP;
    if (config.frequencyPenalty !== undefined)
      requestParams.frequencyPenalty = config.frequencyPenalty;
    if (config.presencePenalty !== undefined)
      requestParams.presencePenalty = config.presencePenalty;

    let response;
    let responseData;

    if (config.stream) {
      const result = await streamText(requestParams);
      response = result.toTextStreamResponse();
    } else {
      const result = await generateText(requestParams);
      responseData = {
        choices: [
          {
            message: {
              role: "assistant",
              content: result.text,
            },
            finish_reason: result.finishReason,
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: result.usage?.inputTokens || 0,
          completion_tokens: result.usage?.outputTokens || 0,
          total_tokens: result.usage?.totalTokens || 0,
        },
      };
      response = NextResponse.json(responseData);
    }

    // 获取捕获的请求信息
    const capturedRequest = getCapturedRequestInfo();
    if (capturedRequest) {
      (response as any).__requestDebug = capturedRequest;
      logger.debug(
        "[SDK Utils] Attached captured request info from debug fetch",
      );
    }

    if (responseData) {
      (response as any).__responseBody = responseData;
    }

    return response;
  } catch (error) {
    logger.error("[SDK Utils] Error:", error);
    throw error;
  }
}

// 辅助函数：为 Chat API 构建调试请求信息
// 捕获的请求信息
let capturedRequestInfo: any = null;

// 创建一个包装的 fetch 函数来捕获请求
function createDebugFetch(originalFetch: typeof fetch = global.fetch) {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    try {
      // 捕获请求信息
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;
      const method =
        init?.method || (input instanceof Request ? input.method : "GET");
      const headers =
        init?.headers ||
        (input instanceof Request
          ? Object.fromEntries(input.headers.entries())
          : {});

      // 读取请求体
      let body;
      if (init?.body) {
        if (typeof init.body === "string") {
          try {
            body = JSON.parse(init.body);
          } catch {
            body = init.body;
          }
        } else {
          body = init.body;
        }
      } else if (input instanceof Request) {
        try {
          const clonedRequest = input.clone();
          const bodyText = await clonedRequest.text();
          if (bodyText) {
            try {
              body = JSON.parse(bodyText);
            } catch {
              body = bodyText;
            }
          }
        } catch (e) {
          logger.debug("[Debug Fetch] Could not read request body:", e);
        }
      }

      capturedRequestInfo = {
        url,
        method,
        headers:
          headers instanceof Headers
            ? Object.fromEntries(headers.entries())
            : headers,
        body,
      };

      logger.debug("[Debug Fetch] Captured request:", capturedRequestInfo);
    } catch (error) {
      logger.error("[Debug Fetch] Error capturing request:", error);
    }

    // 调用原始 fetch
    return originalFetch(input, init);
  };
}

function getCapturedRequestInfo() {
  return capturedRequestInfo;
}

function clearCapturedRequestInfo() {
  capturedRequestInfo = null;
}

export async function handleResponsesRequest(config: OpenAICompatibleConfig) {
  try {
    // Response API 通过 AI SDK 处理，确保走 /responses 端点
    logger.debug(
      `[SDK Utils] Using AI SDK for Response API: ${config.provider}/${config.model}`,
    );
    logger.debug(
      `[SDK Utils] Response API called - this should only happen when explicitly enabled by user`,
    );

    // 清除之前的捕获信息
    clearCapturedRequestInfo();

    // 创建自定义 fetch 函数
    const debugFetch = createDebugFetch();

    let model;

    if (config.provider === "openai") {
      const customOpenAI = createOpenAI({
        apiKey: config.apiKey,
        ...(config.baseURL && config.baseURL !== "https://api.openai.com/v1"
          ? { baseURL: config.baseURL }
          : {}),
        fetch: debugFetch as any,
      });
      model = customOpenAI.responses
        ? customOpenAI.responses(config.model)
        : customOpenAI(config.model);
    } else if (config.provider === "openai-compatible") {
      // OpenAI 兼容厂商使用 OpenAI SDK 以启用 Responses API
      const customOpenAI = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        fetch: debugFetch as any,
      });
      model = customOpenAI.responses
        ? customOpenAI.responses(config.model)
        : customOpenAI(config.model);
    } else if (config.provider === "azure") {
      const azureProvider = createAzure({
        apiKey: config.apiKey,
        resourceName: config.resourceName || "",
        apiVersion: config.apiVersion || "2024-02-01",
        fetch: debugFetch as any,
      });
      const deployment = config.deploymentName || config.model;
      model = azureProvider.responses
        ? azureProvider.responses(deployment)
        : azureProvider(deployment);
    } else {
      logger.warn(
        `[SDK Utils] Responses API not supported for provider ${config.provider}, falling back to chat API`,
      );
      return await handleChatRequest(config);
    }

    const requestParams: any = {
      model,
      messages: config.messages,
    };

    if (config.temperature !== undefined)
      requestParams.temperature = config.temperature;
    if (config.maxTokens !== undefined)
      requestParams.maxTokens = config.maxTokens;
    if (config.topP !== undefined) requestParams.topP = config.topP;
    if (config.frequencyPenalty !== undefined)
      requestParams.frequencyPenalty = config.frequencyPenalty;
    if (config.presencePenalty !== undefined)
      requestParams.presencePenalty = config.presencePenalty;

    logger.debug(
      "[SDK Utils] About to call streamText/generateText with params:",
      {
        model: config.model,
        provider: config.provider,
        messagesCount: config.messages.length,
      },
    );

    let response;
    let responseData;

    if (config.stream) {
      const result = await streamText(requestParams);
      response = result.toTextStreamResponse();

      logger.debug(
        "[SDK Utils] streamText completed, checking captured request",
      );
    } else {
      const result = await generateText(requestParams);
      responseData = {
        choices: [
          {
            message: {
              role: "assistant",
              content: result.text,
            },
            finish_reason: result.finishReason,
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: result.usage?.inputTokens || 0,
          completion_tokens: result.usage?.outputTokens || 0,
          total_tokens: result.usage?.totalTokens || 0,
        },
      };
      response = NextResponse.json(responseData);

      logger.debug(
        "[SDK Utils] generateText completed, checking captured request",
      );
    }

    // 获取捕获的请求信息
    const capturedRequest = getCapturedRequestInfo();
    if (capturedRequest) {
      (response as any).__requestDebug = capturedRequest;
      logger.debug(
        "[SDK Utils] Attached captured request info from debug fetch",
      );
    }

    if (responseData) {
      (response as any).__responseBody = responseData;
    }

    return response;
  } catch (error) {
    logger.error("[SDK Utils] Response API Error:", error);
    throw error;
  }
}

/**
 * 处理图像生成请求
 */
export async function handleImageRequest(config: {
  provider: "openai" | "openai-compatible" | "azure";
  providerName?: string;
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
  size?: string;
  quality?: string;
  n?: number;
  style?: string;
  // Azure特有配置
  resourceName?: string;
  deploymentName?: string;
  apiVersion?: string;
}) {
  try {
    let model;

    if (config.provider === "openai") {
      if (config.baseURL && config.baseURL !== "https://api.openai.com/v1") {
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
        });
        model = customOpenAI.image(config.model); // 明确使用image API
      } else {
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
        });
        model = customOpenAI.image(config.model); // 明确使用image API
      }
    } else if (config.provider === "azure") {
      const azureProvider = createAzure({
        apiKey: config.apiKey,
        resourceName: config.resourceName || "",
        apiVersion: config.apiVersion || "2024-02-01",
      });
      model = azureProvider.image(config.deploymentName || config.model); // 明确使用image API
    } else {
      // OpenAI兼容厂商 - 支持图像生成
      const provider = createOpenAICompatible({
        name: config.providerName || "custom-provider",
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      model = provider.imageModel(config.model); // 使用imageModel方法
    }

    const requestParams: any = {
      model,
      prompt: config.prompt,
    };

    // 添加可选参数
    if (config.size) requestParams.size = config.size;
    if (config.quality) requestParams.quality = config.quality;
    if (config.n) requestParams.n = config.n;
    if (config.style) requestParams.style = config.style;

    const result = await generateImage(requestParams);

    // 转换为OpenAI格式的响应
    return NextResponse.json({
      created: Math.floor(Date.now() / 1000),
      data: result.images.map((image, index) => ({
        url: image.base64 ? `data:image/png;base64,${image.base64}` : undefined,
        b64_json: image.base64,
        // 注意：AI SDK的图像对象可能没有revisedPrompt属性
      })),
    });
  } catch (error) {
    logger.error("[SDK Utils] Image generation error:", error);
    throw error;
  }
}

/**
 * 处理语音生成请求
 */
export async function handleSpeechRequest(config: {
  provider: "openai" | "openai-compatible" | "azure";
  providerName?: string;
  apiKey: string;
  baseURL: string;
  model: string;
  input: string;
  voice?: string;
  response_format?: string;
  speed?: number;
  // Azure特有配置
  resourceName?: string;
  deploymentName?: string;
  apiVersion?: string;
}) {
  try {
    let model;

    if (config.provider === "openai") {
      if (config.baseURL && config.baseURL !== "https://api.openai.com/v1") {
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
        });
        model = customOpenAI.speech(config.model); // 明确使用speech API
      } else {
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
        });
        model = customOpenAI.speech(config.model); // 明确使用speech API
      }
    } else if (config.provider === "azure") {
      const azureProvider = createAzure({
        apiKey: config.apiKey,
        resourceName: config.resourceName || "",
        apiVersion: config.apiVersion || "2024-02-01",
      });
      model = azureProvider.speech(config.deploymentName || config.model); // 明确使用speech API
    } else {
      // OpenAI兼容厂商通常不支持语音生成，抛出错误
      throw new Error(
        `Speech generation not supported for provider: ${config.providerName}`,
      );
    }

    const requestParams: any = {
      model,
      text: config.input,
    };

    // 添加可选参数
    if (config.voice) requestParams.voice = config.voice;
    if (config.speed) requestParams.speed = config.speed;

    const result = await generateSpeech(requestParams);

    // 返回音频数据 - 使用 ArrayBuffer
    const audioBuffer = new ArrayBuffer(result.audio.uint8Array.length);
    const audioView = new Uint8Array(audioBuffer);
    audioView.set(result.audio.uint8Array);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": result.audio.mediaType || "audio/mpeg",
        "Content-Length": result.audio.uint8Array.length.toString(),
      },
    });
  } catch (error) {
    logger.error("[SDK Utils] Speech generation error:", error);
    throw error;
  }
}
export async function handleModelsRequest(config: {
  provider:
    | "openai"
    | "openai-compatible"
    | "anthropic"
    | "google"
    | "xai"
    | "azure";
  providerName?: string;
  providerId?: string; // 新增：提供商ID，用于获取详细配置
  apiKey: string;
  baseURL: string;
}) {
  try {
    // 获取提供商配置以确定正确的端点和认证方式
    const providerConfig = config.providerId
      ? getProviderConfig(config.providerId)
      : null;

    // 构建模型列表请求URL
    let url: string;
    if (providerConfig?.endpoints?.models) {
      // 使用配置中的 models 端点
      const modelsEndpoint = providerConfig.endpoints.models;

      // 处理特殊的端点格式（如 Google 的模板格式）
      if (modelsEndpoint.includes("{model}")) {
        // 对于 Google 这种需要模板的，直接使用基础端点
        url = `${config.baseURL}/${modelsEndpoint.split("/")[0]}`;
      } else {
        url = `${config.baseURL}/${modelsEndpoint}`;
      }
    } else {
      // 默认使用 /models 端点
      url = `${config.baseURL}/models`;
    }

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 根据提供商类型设置认证头
    switch (config.provider) {
      case "anthropic":
        headers["x-api-key"] = config.apiKey;
        headers["anthropic-version"] = "2023-06-01";
        break;

      case "google":
        headers["x-goog-api-key"] = config.apiKey;
        break;

      case "azure":
        headers["api-key"] = config.apiKey;
        // Azure 可能需要特殊的 URL 格式
        if (providerConfig?.azure?.apiVersion) {
          url += `?api-version=${providerConfig.azure.apiVersion}`;
        }
        break;

      case "openai":
      case "openai-compatible":
      case "xai":
      default:
        // 大多数提供商使用 Bearer token
        if (config.apiKey && config.apiKey.trim() !== "") {
          headers["Authorization"] = `Bearer ${config.apiKey}`;
        }
        break;
    }

    // 添加提供商特定的头信息
    if (providerConfig?.authHeaderName && config.apiKey) {
      headers[providerConfig.authHeaderName] = config.apiKey;
    }

    logger.debug(`[SDK Utils] Fetching models from: ${url}`, {
      provider: config.provider,
      providerName: config.providerName,
      providerId: config.providerId,
    });

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[SDK Utils] Models request failed:`, {
        status: response.status,
        statusText: response.statusText,
        url,
        provider: config.provider,
        error: errorText,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const data = await response.json();

    // 标准化响应格式
    const standardizedData = standardizeModelsResponse(
      data,
      config.provider,
      config.providerId,
    );

    logger.debug(
      `[SDK Utils] Successfully fetched ${
        standardizedData.data?.length || 0
      } models from ${config.providerName || config.provider}`,
    );

    return NextResponse.json(standardizedData);
  } catch (error) {
    logger.error(
      `[SDK Utils] Models request error for ${
        config.providerName || config.provider
      }:`,
      error,
    );
    throw error;
  }
}

/**
 * 标准化不同提供商的模型列表响应格式
 */
function standardizeModelsResponse(
  data: any,
  provider: string,
  providerId?: string,
): any {
  // 如果已经是标准的 OpenAI 格式，直接返回
  if (data.object === "list" && Array.isArray(data.data)) {
    return data;
  }

  // 处理不同提供商的响应格式
  switch (provider) {
    case "google":
      // Google 返回 { models: [...] } 格式
      if (data.models && Array.isArray(data.models)) {
        return {
          object: "list",
          data: data.models.map((model: any) => ({
            id:
              model.name?.replace("models/", "") ||
              model.baseModelId ||
              model.id,
            object: "model",
            created: Date.now(),
            owned_by: "google",
            displayName: model.displayName,
            description: model.description,
          })),
        };
      }
      break;

    case "anthropic":
      // Anthropic 可能返回不同的格式
      if (data.data && Array.isArray(data.data)) {
        return {
          object: "list",
          data: data.data.map((model: any) => ({
            id: model.id,
            object: "model",
            created: model.created_at
              ? new Date(model.created_at).getTime()
              : Date.now(),
            owned_by: "anthropic",
            displayName: model.display_name,
          })),
        };
      }
      break;

    case "azure":
      // Azure 可能有特殊的响应格式
      if (data.data && Array.isArray(data.data)) {
        return {
          object: "list",
          data: data.data.map((model: any) => ({
            id: model.id,
            object: "model",
            created: model.created || Date.now(),
            owned_by: "azure",
          })),
        };
      }
      break;

    default:
      // 对于其他提供商，尝试智能转换
      if (Array.isArray(data)) {
        // 如果直接是数组
        return {
          object: "list",
          data: data.map((model: any) => ({
            id: typeof model === "string" ? model : model.id || model.name,
            object: "model",
            created: model.created || Date.now(),
            owned_by: providerId || provider,
          })),
        };
      }
      break;
  }

  // 如果无法识别格式，返回原始数据但包装成标准格式
  return {
    object: "list",
    data: Array.isArray(data) ? data : data.data || [],
    original: data, // 保留原始数据以便调试
  };
}

/**
 * 从请求中解析聊天参数
 */
export async function parseChatRequest(req: NextRequest) {
  const body = await req.json();

  return {
    model: body.model,
    messages: body.messages,
    stream: body.stream ?? false,
    temperature: body.temperature,
    max_tokens: body.max_tokens,
    top_p: body.top_p,
    frequency_penalty: body.frequency_penalty,
    presence_penalty: body.presence_penalty,
    stop: body.stop,
  };
}

/**
 * 转换消息格式为 AI SDK 格式
 */
export function convertMessages(messages: any[]): Message[] {
  function normalizeContent(content: any): any {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return content;

    const parts = content
      .map((part) => {
        if (!part || typeof part !== "object") return undefined;

        if (part.type === "text" && typeof part.text === "string") {
          return { type: "text", text: part.text };
        }

        // OpenAI chat/completions multimodal format -> AI SDK ModelMessage format
        if (part.type === "image_url") {
          const imageUrl = part.image_url?.url;
          if (typeof imageUrl === "string" && imageUrl.length > 0) {
            return { type: "image", image: imageUrl };
          }
        }

        if (part.type === "image" && part.image) {
          return part;
        }

        if (part.type === "file" && part.data) {
          return part;
        }

        return undefined;
      })
      .filter(Boolean);

    return parts.length > 0 ? parts : "";
  }

  return messages.map((msg) => ({
    role: msg.role as "system" | "user" | "assistant",
    content: normalizeContent(msg.content),
  }));
}

/**
 * 检查是否应该使用 SDK 处理请求
 * 支持聊天完成、响应端点、图像生成和语音生成
 */
export function shouldUseSDK(
  path: string,
  chatPaths: string[],
  responsePaths: string[] = [],
  imagePaths: string[] = [],
  speechPaths: string[] = [],
): boolean {
  return (
    chatPaths.some(
      (chatPath) => path === chatPath || path.endsWith(chatPath),
    ) ||
    responsePaths.some(
      (responsePath) => path === responsePath || path.endsWith(responsePath),
    ) ||
    imagePaths.some(
      (imagePath) => path === imagePath || path.endsWith(imagePath),
    ) ||
    speechPaths.some(
      (speechPath) => path === speechPath || path.endsWith(speechPath),
    )
  );
}

/**
 * 通用的API处理函数，简化各厂商的实现
 */
export async function handleProviderRequest(
  req: NextRequest,
  params: { path: string[] },
  config: {
    providerName: string;
    modelProvider: string;
    allowedPaths: Set<string>;
    chatPaths: string[];
    responsePaths?: string[];
    imagePaths?: string[];
    speechPaths?: string[];
    apiPath: string;
    defaultBaseURL: string;
    envApiKeyName: string;
    envBaseURLName?: string;
    provider:
      | "openai"
      | "openai-compatible"
      | "anthropic"
      | "google"
      | "xai"
      | "azure";
    providerDisplayName?: string;
    authHeaderName?: string;
    modelListPath?: string;
    // Azure特有配置
    resourceName?: string;
    deploymentName?: string;
    apiVersion?: string;
  },
) {
  logger.debug(`[${config.providerName} Route] params`, params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 检查是否有endpoint参数，如果有则使用代理模式
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    logger.debug(
      `[${config.providerName} Route] Using proxy mode with endpoint:`,
      endpoint,
    );
    const { handle: proxyHandler } = await import("./proxy");
    return proxyHandler(req, { params });
  }

  const subpath = params.path.join("/");

  if (!config.allowedPaths.has(subpath)) {
    logger.warn(`[${config.providerName} Route] forbidden path`, subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }

  const authResult = auth(req, config.modelProvider as any);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const path = `${req.nextUrl.pathname}`.replaceAll(config.apiPath, "");

    // 获取配置
    const apiKey = authResult.useServerConfig
      ? process.env[config.envApiKeyName] || ""
      : req.headers
          .get(config.authHeaderName || "Authorization")
          ?.replace("Bearer ", "") ||
        req.headers.get("x-api-key") ||
        "";

    if (!apiKey) {
      throw new Error("Missing API key");
    }

    const baseURL =
      authResult.useServerConfig && config.envBaseURLName
        ? process.env[config.envBaseURLName] || config.defaultBaseURL
        : config.defaultBaseURL;

    const normalizedBaseURL = baseURL.startsWith("http")
      ? baseURL
      : `https://${baseURL}`;

    // 处理模型列表请求
    if (config.modelListPath && path === config.modelListPath) {
      logger.debug(`[${config.providerName}] Using SDK for models list`);

      // 尝试从 providerName 推断 providerId
      let providerId: string | undefined;
      try {
        const { getAllProviders } = await import("@/app/constant");
        const allProviders = getAllProviders();
        const matchedProvider = allProviders.find(
          (p) =>
            p.name === config.providerName ||
            p.modelProvider === config.modelProvider,
        );
        providerId = matchedProvider?.id;
      } catch (error) {
        logger.warn(
          `[${config.providerName}] Could not determine providerId:`,
          error,
        );
      }

      return await handleModelsRequest({
        provider: config.provider,
        providerName: config.providerDisplayName,
        providerId,
        apiKey,
        baseURL: normalizedBaseURL,
      });
    }

    // 处理聊天请求
    if (
      shouldUseSDK(
        path,
        config.chatPaths,
        config.responsePaths,
        config.imagePaths,
        config.speechPaths,
      )
    ) {
      // 检查是否是响应API
      if (
        config.responsePaths &&
        config.responsePaths.some(
          (responsePath) =>
            path === responsePath || path.endsWith(responsePath),
        )
      ) {
        // 只有在用户明确启用 Response API 时才使用
        const providerId =
          config.providerName?.toLowerCase() || config.provider;
        const provider = getAllProviders().find((p) => p.id === providerId);

        if (provider?.storeKeys?.apiType) {
          // 检查用户是否启用了 Response API
          const { useAccessStore } = await import("@/app/store");
          const accessStore = useAccessStore.getState();
          const apiType = (accessStore as any)[provider.storeKeys.apiType];

          if (apiType !== "response") {
            logger.warn(
              `[${config.providerName}] Response API endpoint called but apiType is not 'response', falling back to Chat API`,
            );
            // 强制使用 Chat API 而不是 Response API
            const chatParams = await parseChatRequest(req);

            return await handleChatRequest({
              provider: config.provider,
              providerName: config.providerDisplayName,
              apiKey,
              baseURL: normalizedBaseURL,
              model: chatParams.model,
              messages: convertMessages(chatParams.messages),
              stream: chatParams.stream,
              temperature: chatParams.temperature,
              maxTokens: chatParams.max_tokens,
              topP: chatParams.top_p,
              frequencyPenalty: chatParams.frequency_penalty,
              presencePenalty: chatParams.presence_penalty,
              stop: chatParams.stop,
              // Azure特有配置
              resourceName: config.resourceName,
              deploymentName: config.deploymentName,
              apiVersion: config.apiVersion,
            });
          }
        }

        logger.debug(`[${config.providerName}] Using SDK for responses API`);

        const chatParams = await parseChatRequest(req);

        return await handleResponsesRequest({
          provider: config.provider,
          providerName: config.providerDisplayName,
          apiKey,
          baseURL: normalizedBaseURL,
          model: chatParams.model,
          messages: convertMessages(chatParams.messages),
          stream: chatParams.stream,
          temperature: chatParams.temperature,
          maxTokens: chatParams.max_tokens,
          topP: chatParams.top_p,
          frequencyPenalty: chatParams.frequency_penalty,
          presencePenalty: chatParams.presence_penalty,
          stop: chatParams.stop,
          // Azure特有配置
          resourceName: config.resourceName,
          deploymentName: config.deploymentName,
          apiVersion: config.apiVersion,
        });
      }

      // 检查是否是图像生成
      if (
        config.imagePaths &&
        config.imagePaths.some(
          (imagePath) => path === imagePath || path.endsWith(imagePath),
        )
      ) {
        logger.debug(`[${config.providerName}] Using SDK for image generation`);

        const body = await req.json();

        return await handleImageRequest({
          provider: config.provider as "openai" | "openai-compatible" | "azure",
          providerName: config.providerDisplayName,
          apiKey,
          baseURL: normalizedBaseURL,
          model: body.model,
          prompt: body.prompt,
          size: body.size,
          quality: body.quality,
          n: body.n,
          style: body.style,
          // Azure特有配置
          resourceName: config.resourceName,
          deploymentName: config.deploymentName,
          apiVersion: config.apiVersion,
        });
      }

      // 检查是否是语音生成
      if (
        config.speechPaths &&
        config.speechPaths.some(
          (speechPath) => path === speechPath || path.endsWith(speechPath),
        )
      ) {
        logger.debug(
          `[${config.providerName}] Using SDK for speech generation`,
        );

        const body = await req.json();

        return await handleSpeechRequest({
          provider: config.provider as "openai" | "openai-compatible" | "azure",
          providerName: config.providerDisplayName,
          apiKey,
          baseURL: normalizedBaseURL,
          model: body.model,
          input: body.input,
          voice: body.voice,
          response_format: body.response_format,
          speed: body.speed,
          // Azure特有配置
          resourceName: config.resourceName,
          deploymentName: config.deploymentName,
          apiVersion: config.apiVersion,
        });
      }

      // 默认处理聊天请求
      logger.debug(`[${config.providerName}] Using SDK for chat`);

      const chatParams = await parseChatRequest(req);

      return await handleChatRequest({
        provider: config.provider,
        providerName: config.providerDisplayName,
        apiKey,
        baseURL: normalizedBaseURL,
        model: chatParams.model,
        messages: convertMessages(chatParams.messages),
        stream: chatParams.stream,
        temperature: chatParams.temperature,
        maxTokens: chatParams.max_tokens,
        topP: chatParams.top_p,
        frequencyPenalty: chatParams.frequency_penalty,
        presencePenalty: chatParams.presence_penalty,
        stop: chatParams.stop,
        // Azure特有配置
        resourceName: config.resourceName,
        deploymentName: config.deploymentName,
        apiVersion: config.apiVersion,
      });
    }

    // 不支持的端点
    return NextResponse.json(
      { error: true, msg: "Endpoint not supported with SDK" },
      { status: 400 },
    );
  } catch (e) {
    logger.error(`[${config.providerName}]`, e);
    return NextResponse.json(prettyObject(e));
  }
}
