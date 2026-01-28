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

// 定义消息类型
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
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
}

/**
 * 处理聊天请求的通用函数
 */
export async function handleChatRequest(config: OpenAICompatibleConfig) {
  try {
    let model;

    if (config.provider === "openai") {
      // 使用 OpenAI Chat API (明确指定chat以避免默认的responses API)
      if (config.baseURL && config.baseURL !== "https://api.openai.com/v1") {
        // 自定义 baseURL 的情况
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
        });
        model = customOpenAI.chat(config.model); // 明确使用chat API
      } else {
        // 默认 OpenAI - 使用环境变量或传入的 API key
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
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
        });
        model = customAnthropic(config.model);
      } else {
        // 默认 Anthropic
        const customAnthropic = createAnthropic({
          apiKey: config.apiKey,
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
        });
        model = customGoogle(config.model);
      } else {
        // 默认 Google
        const customGoogle = createGoogleGenerativeAI({
          apiKey: config.apiKey,
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
        });
        model = customXai(config.model);
      } else {
        // 默认 XAI
        const customXai = createXai({
          apiKey: config.apiKey,
        });
        model = customXai(config.model);
      }
    } else if (config.provider === "azure") {
      // 使用 Azure SDK
      const azureProvider = createAzure({
        apiKey: config.apiKey,
        resourceName: config.resourceName || "",
        apiVersion: config.apiVersion || "2024-02-01",
      });
      model = azureProvider(config.deploymentName || config.model);
    } else {
      // 使用 OpenAI 兼容 SDK
      const provider = createOpenAICompatible({
        name: config.providerName || "custom-provider",
        apiKey: config.apiKey,
        baseURL: config.baseURL,
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

    if (config.stream) {
      const result = await streamText(requestParams);
      return result.toTextStreamResponse();
    } else {
      const result = await generateText(requestParams);

      return NextResponse.json({
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
      });
    }
  } catch (error) {
    logger.error("[SDK Utils] Error:", error);
    throw error;
  }
}

/**
 * 处理响应API请求 (OpenAI Responses API)
 * 注意：OpenAI Responses API使用不同的请求格式，需要直接HTTP请求
 */
export async function handleResponsesRequest(config: OpenAICompatibleConfig) {
  try {
    if (config.provider === "openai") {
      // OpenAI Responses API 使用特殊格式，需要直接HTTP请求
      return await handleOpenAIResponsesAPI(config);
    } else {
      // 对于其他厂商，使用标准聊天API作为fallback
      return await handleChatRequest(config);
    }
  } catch (error) {
    logger.error("[SDK Utils] Responses API Error:", error);
    throw error;
  }
}

/**
 * 直接处理OpenAI Responses API的HTTP请求
 */
async function handleOpenAIResponsesAPI(config: OpenAICompatibleConfig) {
  const url = `${config.baseURL}/responses`;

  // 将messages转换为Responses API格式
  const systemMessage = config.messages.find((m) => m.role === "system");
  const userMessages = config.messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  // 构建input数组 - Responses API格式
  const input = userMessages.map((msg) => ({
    type: "message",
    role: msg.role,
    content: [
      {
        type: msg.role === "user" ? "input_text" : "output_text",
        text: msg.content,
      },
    ],
  }));

  const requestBody: any = {
    model: config.model,
    input,
    stream: config.stream,
  };

  // 添加系统指令
  if (systemMessage) {
    requestBody.instructions = systemMessage.content;
  }

  // 添加可选参数
  if (config.temperature !== undefined)
    requestBody.temperature = config.temperature;
  if (config.maxTokens !== undefined)
    requestBody.max_output_tokens = config.maxTokens;
  if (config.topP !== undefined) requestBody.top_p = config.topP;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  logger.debug("[OpenAI Responses API] Request:", { url, body: requestBody });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    logger.error("[OpenAI Responses API] Error:", errorData);
    throw new Error(
      `HTTP ${response.status}: ${errorData.error?.message || "Unknown error"}`,
    );
  }

  if (config.stream) {
    // 返回流式响应
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    // 处理非流式响应
    const data = await response.json();
    logger.debug("[OpenAI Responses API] Response:", data);

    // 转换为Chat Completions格式以保持兼容性
    const assistantMessage = data.output?.find(
      (item: any) => item.type === "message" && item.role === "assistant",
    );
    const textContent =
      assistantMessage?.content?.find((c: any) => c.type === "output_text")
        ?.text || "";

    return NextResponse.json({
      id: data.id,
      object: "chat.completion",
      created: data.created_at || Math.floor(Date.now() / 1000),
      model: data.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: textContent,
          },
          finish_reason: data.status === "completed" ? "stop" : "length",
        },
      ],
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
      },
    });
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
      // OpenAI兼容厂商通常不支持图像生成，抛出错误
      throw new Error(
        `Image generation not supported for provider: ${config.providerName}`,
      );
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
  apiKey: string;
  baseURL: string;
}) {
  try {
    // 对于模型列表，我们使用简单的fetch请求，因为AI SDK主要专注于生成任务
    const url = `${config.baseURL}/models`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.provider === "anthropic") {
      headers["x-api-key"] = config.apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else if (config.provider === "google") {
      headers["x-goog-api-key"] = config.apiKey;
    } else {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error("[SDK Utils] Models request error:", error);
    throw error;
  }
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
  return messages.map((msg) => ({
    role: msg.role as "system" | "user" | "assistant",
    content: msg.content,
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
      return await handleModelsRequest({
        provider: config.provider,
        providerName: config.providerDisplayName,
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
