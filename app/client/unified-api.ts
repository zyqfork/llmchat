import { streamTextWithSDK, generateTextWithSDK } from "./sdk-manager";
import { getAllProviders } from "../constant";
import { logger } from "../utils/logger";

type ProviderLike = Pick<
  ReturnType<typeof getAllProviders>[number],
  "id" | "name" | "sdkType" | "storeKeys"
>;

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
  providerOptions?: Record<string, any>;
  useResponseApiContext?: boolean;
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
  providerMetadata?: any;
}

// 根据模型名称获取provider ID - 改进版本
function getProviderIdFromModel(model: string): string {
  // 首先尝试从启用的服务商中查找拥有该模型的服务商
  if (typeof window !== "undefined") {
    try {
      const { useAccessStore } = require("../store/access");
      const accessStore = useAccessStore.getState();

      // 检查自定义服务商
      const enabledCustomProviders = accessStore.customProviders.filter(
        (p: any) => p.enabled,
      );

      // 这里我们无法直接查询模型列表，但可以优先考虑自定义服务商
      // 如果有启用的自定义服务商，记录一下（但不能直接返回，因为不知道哪个有这个模型）

      logger.debug(`[Unified API] Model inference for: ${model}`, {
        enabledCustomProviders: enabledCustomProviders.length,
        note: "Consider improving model-to-provider mapping",
      });
    } catch (error) {
      logger.warn(`[Unified API] Could not check custom providers:`, error);
    }
  }

  // 基于模型名称前缀的推断逻辑
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

  // 对于无法识别的模型名称，记录警告
  logger.warn(
    `[Unified API] Unknown model pattern: ${model}, defaulting to openai. This may cause routing issues for custom providers.`,
  );

  // 默认返回openai（这可能导致问题，但保持向后兼容）
  return "openai";
}

// 转换消息格式
function convertMessages(messages: SimpleMessage[]): any[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

function extractSystemInstructions(messages: SimpleMessage[]) {
  const systemContents: string[] = [];
  const filtered: SimpleMessage[] = [];

  messages.forEach((msg) => {
    if (msg.role === "system") {
      if (typeof msg.content === "string" && msg.content.trim().length > 0) {
        systemContents.push(msg.content.trim());
      }
      return;
    }
    filtered.push(msg);
  });

  const instructions =
    systemContents.length > 0 ? systemContents.join("\n") : undefined;

  return { instructions, messages: filtered };
}

function getResponseApiContext(providerId: string, model: string) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const { useChatStore } = require("../store");
    const chatStore = useChatStore.getState();
    const session = chatStore.currentSession();

    let previousResponseId = session.responseApiConversationId;

    if (session.multiModelMode?.enabled) {
      const modelKey = `${model}@${providerId}`;
      const modelIds = session.multiModelMode.modelResponseApiConversationIds;
      if (modelIds?.[modelKey]) {
        previousResponseId = modelIds[modelKey];
      }
    }

    return previousResponseId ? { previousResponseId } : {};
  } catch (error) {
    logger.warn("[Unified API] Failed to read Response API context:", error);
    return {};
  }
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
    useResponseApiContext = true,
  } = options;

  // 优先使用传入的 providerName，如果没有则根据模型名称推断
  let providerId: string;

  // 尝试从客户端 store 获取当前会话的 providerName
  if (typeof window !== "undefined") {
    try {
      const { useChatStore } = require("../store");
      const chatStore = useChatStore.getState();
      const currentSession = chatStore.currentSession();
      const sessionProviderName =
        currentSession?.mask?.modelConfig?.providerName;

      if (sessionProviderName) {
        // 标准化 providerName
        const { normalizeProviderName } = require("./api");
        providerId = normalizeProviderName(sessionProviderName);
        logger.debug(
          `[Unified API] Using session provider: ${providerId} for model: ${model}`,
        );
      } else {
        // 如果没有会话配置，则根据模型名称推断
        providerId = getProviderIdFromModel(model);
        logger.debug(
          `[Unified API] Inferred provider: ${providerId} from model: ${model}`,
        );
      }
    } catch (error) {
      logger.warn(
        `[Unified API] Could not get session provider, falling back to model inference:`,
        error,
      );
      providerId = getProviderIdFromModel(model);
    }
  } else {
    // 服务器端环境，根据模型名称推断
    providerId = getProviderIdFromModel(model);
    logger.debug(
      `[Unified API] Server-side provider inference: ${providerId} for model: ${model}`,
    );
  }

  let provider: ProviderLike | undefined = getAllProviders().find(
    (p) => p.id === providerId,
  );
  let customProvider: any = null;

  if (
    !provider &&
    providerId.startsWith("custom_") &&
    typeof window !== "undefined"
  ) {
    try {
      const { useAccessStore } = require("../store/access");
      const accessStore = useAccessStore.getState();
      customProvider = accessStore.customProviders.find(
        (p: any) => p.id === providerId,
      );
      if (customProvider) {
        provider = {
          id: providerId,
          name: customProvider.name,
          sdkType:
            customProvider.type === "openai"
              ? "openai-compatible"
              : customProvider.type,
          storeKeys: {
            apiKey: `${providerId}ApiKey`,
            baseUrl: `${providerId}BaseUrl`,
            apiType:
              customProvider.type === "openai"
                ? `${providerId}ApiType`
                : undefined,
          },
        };
      }
    } catch (error) {
      logger.warn(
        `[Unified API] Failed to load custom provider: ${providerId}`,
        error,
      );
    }
  }

  if (!provider) {
    throw new Error(
      `Provider not found for model: ${model} (inferred provider: ${providerId})`,
    );
  }

  let useResponseApi = false;
  if (typeof window !== "undefined") {
    if (
      customProvider?.type === "openai" &&
      customProvider.config?.useResponseApi !== undefined
    ) {
      useResponseApi = customProvider.config.useResponseApi;
    } else if (provider.storeKeys?.apiType) {
      try {
        const { useAccessStore } = require("../store");
        const accessStore = useAccessStore.getState();
        useResponseApi =
          (accessStore as any)[provider.storeKeys.apiType] === "response";
      } catch (error) {
        logger.warn("[Unified API] Failed to read apiType:", error);
      }
    }
  }

  // 准备请求参数
  const requestOptions: any = {
    messages: convertMessages(messages),
    temperature,
    maxTokens,
    providerOptions: options.providerOptions,
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

  if (useResponseApi) {
    const { instructions, messages: filteredMessages } =
      extractSystemInstructions(requestOptions.messages);
    requestOptions.messages = filteredMessages;

    const context = useResponseApiContext
      ? (getResponseApiContext(providerId, model) as {
          previousResponseId?: string;
        })
      : {};
    const previousResponseId = context.previousResponseId;

    if (instructions || previousResponseId) {
      requestOptions.providerOptions = {
        ...(requestOptions.providerOptions ?? {}),
        openai: {
          ...(requestOptions.providerOptions?.openai ?? {}),
          ...(instructions
            ? { instructions, systemMessageMode: "remove" }
            : {}),
          ...(previousResponseId ? { previousResponseId } : {}),
        },
      };
    }
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
            providerMetadata: result.providerMetadata,
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
