import { streamTextWithSDK, generateTextWithSDK } from "./sdk-manager";
import { getAllProviders } from "../constant";
import { logger } from "../utils/logger";

// 简化的消息接口，用于统一API
export interface SimpleMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 统一的聊天API接口
export interface UnifiedChatOptions {
  messages: SimpleMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: any[];
  systemPrompt?: string;
  // 添加配置参数，避免在服务器端使用客户端 store
  apiKey?: string;
  baseUrl?: string;
}

// 统一的聊天API响应
export interface UnifiedChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// 根据模型名称获取provider ID
function getProviderIdFromModel(model: string): string {
  // 这里需要根据模型名称推断provider
  // 可以通过模型名称的前缀或者维护一个模型到provider的映射表

  // 简单的推断逻辑，后续可以完善
  if (
    model.startsWith("gpt-") ||
    model.startsWith("o1-") ||
    model.startsWith("chatgpt-")
  ) {
    return "openai";
  } else if (model.startsWith("claude-")) {
    return "anthropic";
  } else if (model.startsWith("gemini-") || model.startsWith("learnlm-")) {
    return "google";
  } else if (model.startsWith("qwen-") || model.includes("qwen")) {
    return "alibaba";
  } else if (model.startsWith("moonshot-") || model.startsWith("kimi-")) {
    return "moonshotai";
  } else if (model.startsWith("deepseek-")) {
    return "deepseek";
  } else if (model.startsWith("grok-")) {
    return "xai";
  } else if (model.includes("siliconflow") || model.includes("/")) {
    return "siliconflow";
  } else if (model.includes("ollama")) {
    return "ollama";
  }

  // 默认返回openai
  return "openai";
}

// 转换消息格式
function convertMessages(messages: SimpleMessage[]): any[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

// 统一的聊天API
export function unifiedChat(
  options: UnifiedChatOptions,
): Promise<UnifiedChatResponse> | any {
  const {
    messages,
    model,
    temperature,
    maxTokens,
    stream = false,
    tools,
    systemPrompt,
  } = options;

  const providerId = getProviderIdFromModel(model);
  const provider = getAllProviders().find((p) => p.id === providerId);

  if (!provider) {
    throw new Error(`Provider not found for model: ${model}`);
  }

  // 准备请求参数
  const requestOptions: any = {
    messages: convertMessages(messages),
    temperature,
    maxTokens,
  };

  // 添加系统提示词
  if (systemPrompt) {
    requestOptions.messages.unshift({
      role: "system",
      content: systemPrompt,
    });
  }

  // 添加工具调用
  if (tools && tools.length > 0) {
    requestOptions.tools = tools;
  }

  try {
    if (stream) {
      logger.debug(
        `[Unified API] Starting stream chat with ${providerId}/${model}`,
      );
      return streamTextWithSDK(providerId, model, requestOptions);
    } else {
      logger.debug(`[Unified API] Starting chat with ${providerId}/${model}`);
      return generateTextWithSDK(providerId, model, requestOptions).then(
        (result) => {
          console.log("Usage object:", result.usage); // 临时调试
          return {
            content: result.text,
            usage: result.usage
              ? {
                  promptTokens: (result.usage as any).promptTokens || 0,
                  completionTokens: (result.usage as any).completionTokens || 0,
                  totalTokens: (result.usage as any).totalTokens || 0,
                }
              : undefined,
            finishReason: result.finishReason,
          };
        },
      );
    }
  } catch (error) {
    logger.error(
      `[Unified API] Chat failed for ${providerId}/${model}:`,
      error,
    );
    throw error;
  }
}

// 检查模型是否支持流式输出
export function supportsStreaming(model: string): boolean {
  const providerId = getProviderIdFromModel(model);
  const provider = getAllProviders().find((p) => p.id === providerId);
  return provider?.sdkType !== undefined; // 所有SDK都支持流式输出
}

// 检查模型是否支持工具调用
export function supportsTools(model: string): boolean {
  const providerId = getProviderIdFromModel(model);
  // 这里可以根据具体的模型和provider来判断
  // 暂时返回true，具体逻辑可以后续完善
  return true;
}

// 获取模型的上下文长度
export function getModelContextLength(model: string): number {
  // 这里可以从配置中获取模型的上下文长度
  // 暂时返回一个默认值
  return 4096;
}

// 验证模型是否可用
export function isModelAvailable(model: string): boolean {
  const providerId = getProviderIdFromModel(model);

  // 在服务器端环境中，我们无法访问客户端 store
  if (typeof window === "undefined") {
    return true; // 在服务器端假设模型可用
  }

  try {
    const { useAccessStore } = require("../store/access");
    const accessStore = useAccessStore.getState();
    return accessStore.isValidProvider(providerId);
  } catch (error) {
    logger.warn(
      `[Unified API] Could not check model availability for ${model}:`,
      error,
    );
    return true; // 如果无法检查，假设可用
  }
}
