import { resolveLLMAdapter, LLMEngine } from "./llm-adapter";
import { getAllProviders } from "../constant";
import { logger } from "../utils/logger";
import { inferProviderIdByModel } from "./provider-inference";
import { resolvePiProviderByModel } from "./pi-provider-resolver";

type ProviderLike = Pick<
  ReturnType<typeof getAllProviders>[number],
  "id" | "name" | "sdkType" | "storeKeys"
>;

// 简化的消息接口，用于统一API
export interface SimpleMessage {
  role: "system" | "user" | "assistant";
  content: any;
}

// 统一的聊天API接口
export interface UnifiedChatOptions {
  messages: SimpleMessage[];
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stream?: boolean;
  tools?: any[];
  systemPrompt?: string;
  providerOptions?: Record<string, any>;
  useResponseApiContext?: boolean;
  /** 指定使用的 provider（如标题生成、摘要等需与聊天一致时传入） */
  providerName?: string;
  // 添加配置参数，避免在服务器端使用客户端 store
  apiKey?: string;
  baseUrl?: string;
  engine?: LLMEngine;
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

/**
 * 从「已启用模型」配置中查找拥有该模型的厂商 ID。
 * 用于在未传入 providerName 时，优先使用用户实际启用该模型的厂商（如自定义 OpenAI 端点下的 DeepSeek），
 * 避免按模型名前缀误判到官方厂商（如 deepseek-* -> DeepSeek 官方）导致请求发错地址。
 */
function getProviderIdFromEnabledModels(model: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const { useAccessStore } = require("../store/access");
    const accessStore = useAccessStore.getState();
    const enabledModels = accessStore.enabledModels || {};
    const enabledProviders = accessStore.enabledProviders || {};

    // 先查自定义服务商（enabledModels 的 key 为 custom provider 的 id）
    const customProviders = accessStore.customProviders || [];
    for (const p of customProviders) {
      if (!p.enabled) continue;
      const list = enabledModels[p.id];
      if (Array.isArray(list) && list.includes(model)) {
        logger.debug(
          `[Unified API] Resolved provider from enabled models: ${p.id} for model: ${model}`,
        );
        return p.id;
      }
    }

    // 再查内置服务商（enabledModels / enabledProviders 的 key 为 provider.name，需转成 provider.id）
    const providers = getAllProviders();
    for (const provider of providers) {
      const isEnabled = enabledProviders[provider.name];
      if (!isEnabled) continue;
      const list = enabledModels[provider.name];
      if (Array.isArray(list) && list.includes(model)) {
        logger.debug(
          `[Unified API] Resolved provider from enabled models: ${provider.id} for model: ${model}`,
        );
        return provider.id;
      }
    }
  } catch (error) {
    logger.warn(
      `[Unified API] Could not resolve provider from enabled models:`,
      error,
    );
  }
  return undefined;
}

// 根据模型名称获取provider ID - 改进版本
async function getProviderIdFromModel(model: string): Promise<string> {
  const catalogResolved = await resolvePiProviderByModel(model);
  if (catalogResolved) {
    return catalogResolved;
  }
  const inferred = inferProviderIdByModel(model);
  if (inferred !== "openai") {
    return inferred;
  }
  // 对于无法识别的模型名称，记录警告
  logger.warn(
    `[Unified API] Unknown model pattern: ${model}, defaulting to openai. This may cause routing issues for custom providers.`,
  );
  return inferred;
}

// 将 content 规范为 AI SDK 的 CoreMessage 格式（image_url -> image）
function normalizeContent(content: any): any {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return content;

  const parts = content
    .map((part: any) => {
      if (!part || typeof part !== "object") return undefined;

      if (part.type === "text" && typeof part.text === "string") {
        return { type: "text", text: part.text };
      }

      // OpenAI 多模态格式 image_url -> AI SDK ImagePart (type: "image")
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

  return parts.length > 0 ? parts : content;
}

// 转换消息格式为 AI SDK ModelMessage 格式
function convertMessages(messages: SimpleMessage[]): any[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: normalizeContent(msg.content),
  }));
}

// 统一的聊天API
export function unifiedChat(
  options: UnifiedChatOptions,
): Promise<UnifiedChatResponse> | any {
  return (async () => {
    const {
      messages,
      model,
      temperature,
      topP,
      maxTokens,
      presencePenalty,
      frequencyPenalty,
      stream = false,
      tools,
      systemPrompt,
      providerName: optionsProviderName,
      engine: _optionsEngine,
    } = options;

    // 优先使用传入的 providerName（标题/摘要等与聊天同配置时一致），否则用当前会话，最后才按模型推断
    let providerId: string;
    const { normalizeProviderName } = require("./api");

    if (optionsProviderName) {
      providerId = normalizeProviderName(optionsProviderName);
      logger.debug(
        `[Unified API] Using options provider: ${providerId} for model: ${model}`,
      );
    } else if (typeof window !== "undefined") {
      try {
        const { useChatStore } = require("../store");
        const chatStore = useChatStore.getState();
        const currentSession = chatStore.currentSession();
        const sessionProviderName =
          currentSession?.mask?.modelConfig?.providerName;

        if (sessionProviderName) {
          providerId = normalizeProviderName(sessionProviderName);
          logger.debug(
            `[Unified API] Using session provider: ${providerId} for model: ${model}`,
          );
        } else {
          // 优先从「已启用模型」解析厂商，避免 deepseek 等被误判到官方厂商导致请求发错地址
          const fromEnabled = getProviderIdFromEnabledModels(model);
          providerId = fromEnabled ?? (await getProviderIdFromModel(model));
          logger.debug(
            `[Unified API] Resolved provider: ${providerId} for model: ${model}`,
            fromEnabled
              ? "(from enabled models)"
              : "(from model name inference)",
          );
        }
      } catch (error) {
        logger.warn(
          `[Unified API] Could not get session provider, falling back to enabled models / model inference:`,
          error,
        );
        const fromEnabled = getProviderIdFromEnabledModels(model);
        providerId = fromEnabled ?? (await getProviderIdFromModel(model));
      }
    } else {
      const fromEnabled = getProviderIdFromEnabledModels(model);
      providerId = fromEnabled ?? (await getProviderIdFromModel(model));
      logger.debug(
        `[Unified API] Server-side provider: ${providerId} for model: ${model}`,
      );
    }

    let provider: ProviderLike | undefined = getAllProviders().find(
      (p) => p.id === providerId,
    );
    if (
      !provider &&
      providerId.startsWith("custom_") &&
      typeof window !== "undefined"
    ) {
      try {
        const { useAccessStore } = require("../store/access");
        const accessStore = useAccessStore.getState();
        const customProvider = accessStore.customProviders.find(
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

    // 准备请求参数
    const requestOptions: any = {
      messages: convertMessages(messages),
      temperature,
      topP,
      maxTokens,
      presencePenalty,
      frequencyPenalty,
      providerOptions: options.providerOptions,
    };

    // 原生 OpenAI 推理模型需要 reasoningSummary 才能返回思考内容
    if (provider?.sdkType === "openai" && !providerId.startsWith("custom_")) {
      try {
        const { getModelCapabilities } = require("../config/model-config");
        const capabilities = getModelCapabilities(model, undefined);
        if (capabilities.reasoning) {
          requestOptions.providerOptions = {
            ...requestOptions.providerOptions,
            openai: {
              ...(requestOptions.providerOptions?.openai ?? {}),
              reasoningSummary: "auto",
            },
          };
          logger.debug(
            `[Unified API] Added reasoningSummary for OpenAI reasoning model: ${model}`,
          );
        }
      } catch (e) {
        logger.warn("[Unified API] Failed to check model capabilities:", e);
      }
    }

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
      const adapter = resolveLLMAdapter("pi-ai");
      if (stream) {
        logger.debug(
          `[Unified API] Starting stream chat with ${providerId}/${model}`,
        );
        return adapter.streamText({
          providerId,
          model,
          options: requestOptions,
        });
      } else {
        logger.debug(`[Unified API] Starting chat with ${providerId}/${model}`);
        return adapter
          .generateText({
            providerId,
            model,
            options: requestOptions,
          })
          .then((result) => {
            return {
              content: result.text,
              usage: result.usage
                ? {
                    promptTokens: (result.usage as any).promptTokens || 0,
                    completionTokens:
                      (result.usage as any).completionTokens || 0,
                    totalTokens: (result.usage as any).totalTokens || 0,
                  }
                : undefined,
              finishReason: result.finishReason,
              providerMetadata: result.providerMetadata,
            };
          });
      }
    } catch (error) {
      logger.error(
        `[Unified API] Chat failed for ${providerId}/${model}:`,
        error,
      );
      throw error;
    }
  })();
}

// 验证模型是否可用
export function isModelAvailable(model: string): boolean {
  const providerId = normalizeProviderIdByModelPrefix(model);

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

function normalizeProviderIdByModelPrefix(model: string): string {
  return inferProviderIdByModel(model);
}
