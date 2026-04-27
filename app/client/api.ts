import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  ServiceProvider,
  getProviderConfig,
  getAllProviders,
} from "../constant";
import {
  ChatMessageTool,
  ChatMessage,
  ModelType,
  useAccessStore,
  useChatStore,
  CustomProviderType,
} from "../store";
import { unifiedChat, UnifiedChatOptions } from "./unified-api";
import { logger } from "../utils/logger";
import { ModelSize } from "../typing";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export const TTSModels = ["tts-1", "tts-1-hd"] as const;

// DALL-E 请求参数接口
export interface DalleRequestPayload {
  model: string;
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  response_format?: "url" | "b64_json";
  user?: string;
}
export type ChatModel = ModelType;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface MultimodalContentForAlibaba {
  text?: string;
  image?: string;
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  providerName?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  size?: ModelSize;
  quality?: DalleRequestPayload["quality"];
  style?: DalleRequestPayload["style"];
}

export interface SpeechOptions {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  onController?: (controller: AbortController) => void;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  tools?: any[]; // MCP tools in OpenAI function call format
  useResponseApiContext?: boolean;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, responseRes: Response) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
  sorted: number;
  isDefault?: boolean;
  contextTokens?: number; // 上下文窗口Token数
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

function getResponseApiConversationId(
  providerMetadata?: any,
): string | undefined {
  if (!providerMetadata || typeof providerMetadata !== "object") {
    return undefined;
  }

  return (
    providerMetadata.openai?.responseId ??
    providerMetadata.azure?.responseId ??
    providerMetadata?.responseId
  );
}

function buildResponseWithMetadata(
  responseId?: string,
  requestDebug?: any,
  responseDebug?: { status?: number; headers?: Record<string, string> },
): Response {
  const status = responseDebug?.status ?? 200;
  const headers = responseDebug?.headers ?? {};
  const response = new Response(null, {
    status,
    headers: new Headers(headers),
  });
  if (requestDebug) {
    (response as any).__requestDebug = requestDebug;
  }
  if (responseId) {
    (response as any).__responseBody = { id: responseId };
  }
  return response;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract speech(options: SpeechOptions): Promise<ArrayBuffer>;
  abstract models(): Promise<LLMModel[]>;
}

/**
 * 统一的客户端 API 实现
 * 替代所有单独的 platform 文件
 */
class UnifiedClientApi extends LLMApi {
  async chat(options: ChatOptions): Promise<void> {
    try {
      // 转换消息格式 - options.messages 已经是 RequestMessage[] 类型
      const messages = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestOptions: UnifiedChatOptions = {
        messages,
        model: options.config.model,
        temperature: options.config.temperature,
        topP: options.config.top_p,
        maxTokens: options.config.max_tokens,
        presencePenalty: options.config.presence_penalty,
        frequencyPenalty: options.config.frequency_penalty,
        stream: options.config.stream,
        tools: options.tools,
        useResponseApiContext: options.useResponseApiContext,
        providerName: options.config.providerName,
      };

      if (options.config.stream) {
        // 处理流式响应
        logger.debug("[Unified Client API] Starting stream chat");

        const streamResult = await unifiedChat(requestOptions);

        if (
          streamResult &&
          (streamResult.fullStream || streamResult.textStream)
        ) {
          let mainContent = ""; // 主回答内容
          let reasoningContent = ""; // 推理/思考内容

          // 构建用于 UI 显示的完整内容（推理内容用 <think> 标签包裹，与 markdown 渲染约定一致）
          // 输出过程中仅收到推理内容时使用未闭合标签，保持“正在思考中”并默认展开
          const buildDisplayContent = () =>
            reasoningContent
              ? mainContent
                ? `<think>\n${reasoningContent}\n</think>\n\n${mainContent}`
                : `<think>\n${reasoningContent}`
              : mainContent;

          const pushUpdate = (displayContent: string) => {
            if (displayContent !== undefined && displayContent !== null) {
              options.onUpdate?.(displayContent, displayContent);
            }
          };

          // 获取模型能力，检查是否支持推理
          const { getModelCapabilities, extractReasoningContent } =
            await import("../config/model-config");
          const capabilities = getModelCapabilities(
            options.config.model,
            options.config.providerName,
          );
          const reasoningField = capabilities.reasoningField;

          try {
            if (streamResult.fullStream) {
              for await (const part of streamResult.fullStream) {
                switch (part.type) {
                  case "tool-call": {
                    const toolCall = (part as any).toolCall;
                    if (toolCall?.id && toolCall?.name) {
                      options.onBeforeTool?.({
                        id: toolCall.id,
                        type: "function",
                        function: {
                          name: toolCall.name,
                          arguments: JSON.stringify(toolCall.arguments ?? {}),
                        },
                      });
                    }
                    break;
                  }
                  case "tool-result": {
                    const toolCall = (part as any).toolCall;
                    const result = (part as any).result;
                    const isError = !!(part as any).isError;
                    if (toolCall?.id && toolCall?.name) {
                      options.onAfterTool?.({
                        id: toolCall.id,
                        type: "function",
                        function: {
                          name: toolCall.name,
                          arguments: JSON.stringify(toolCall.arguments ?? {}),
                        },
                        content: typeof result === "string" ? result : "",
                        isError,
                        errorMsg: isError
                          ? typeof result === "string"
                            ? result
                            : "Tool execution failed"
                          : undefined,
                      });
                    }
                    break;
                  }
                  case "reasoning":
                  case "reasoning-delta": {
                    // AI SDK 6 对 reasoning 的支持；OpenAI 原生用 delta，完整块用 text/textDelta
                    if (capabilities.reasoning) {
                      const text =
                        (part as any).delta ??
                        (part as any).text ??
                        (part as any).textDelta ??
                        "";
                      if (text) {
                        reasoningContent += text;
                        pushUpdate(buildDisplayContent());
                      }
                    }
                    break;
                  }
                  case "text-delta": {
                    // AI SDK 6 内部格式使用 text，provider 原始格式使用 delta
                    const delta =
                      (part as any).text ?? (part as any).delta ?? "";

                    // 若 AI SDK 未原生解析 reasoning，从 rawResponse 中提取（如 OpenAI 兼容 API）
                    if (capabilities.reasoning) {
                      const reasoningDelta = extractReasoningContent(
                        part,
                        reasoningField,
                      );

                      if (reasoningDelta) {
                        reasoningContent += reasoningDelta;
                        logger.debug(
                          `[Unified Client API] Reasoning delta: ${reasoningDelta.substring(
                            0,
                            50,
                          )}...`,
                        );
                      }
                    }

                    // delta 可能是主回答内容，也可能是空（当只有 reasoning_content 时）
                    if (delta) {
                      mainContent += delta;
                    }

                    pushUpdate(buildDisplayContent());
                    break;
                  }
                  default: {
                    break;
                  }
                }
              }

              if (reasoningContent) {
                logger.debug(
                  `[Unified Client API] Total reasoning content length: ${reasoningContent.length}`,
                );
              }
            } else {
              for await (const chunk of streamResult.textStream) {
                mainContent += chunk;
                pushUpdate(buildDisplayContent());
              }
            }

            const fullContent = buildDisplayContent();

            let responseId: string | undefined;
            try {
              const providerMetadata = await streamResult.providerMetadata;
              responseId = getResponseApiConversationId(
                providerMetadata as any,
              );
            } catch (metadataError) {
              logger.warn(
                "[Unified Client API] Failed to read provider metadata:",
                metadataError,
              );
            }

            const requestDebugFromAdapter =
              typeof (streamResult as any)?.requestDebug === "function"
                ? (streamResult as any).requestDebug()
                : undefined;
            const requestDebug = requestDebugFromAdapter ?? {
              url: "pi-ai Stream",
              method: "POST",
              headers: {},
            };
            const responseDebug =
              typeof (streamResult as any)?.responseDebug === "function"
                ? (streamResult as any).responseDebug()
                : undefined;

            const mockResponse = buildResponseWithMetadata(
              responseId,
              requestDebug,
              responseDebug,
            );

            options.onFinish(fullContent, mockResponse);
          } catch (streamError) {
            logger.error(
              "[Unified Client API] Stream processing error:",
              streamError,
            );
            options.onError?.(streamError as Error);
          }
        } else {
          const content = streamResult?.content || streamResult?.text || "";
          options.onUpdate?.(content, content);
          options.onFinish(content, new Response());
        }
      } else {
        // 处理普通响应
        logger.debug("[Unified Client API] Starting non-stream chat");

        const result = await unifiedChat(requestOptions);
        const content = result?.content || result?.text || "";
        const responseId = getResponseApiConversationId(
          result?.providerMetadata,
        );

        const requestDebug = (result as any)?.requestDebug ?? {
          url: "pi-ai",
          method: "POST",
          headers: {},
        };
        const responseDebug = (result as any)?.responseDebug;

        options.onUpdate?.(content, content);
        options.onFinish(
          content,
          buildResponseWithMetadata(responseId, requestDebug, responseDebug),
        );
      }
    } catch (error) {
      logger.error("[Unified Client API] Chat failed:", error);
      options.onError?.(error as Error);
    }
  }

  async speech(_options: SpeechOptions): Promise<ArrayBuffer> {
    // 语音合成功能，可以通过统一的代理端点实现
    throw new Error("Speech synthesis not implemented in unified API yet");
  }

  async models(): Promise<LLMModel[]> {
    // 模型列表获取，可以通过统一的端点实现
    return [];
  }
}

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    // 使用统一的客户端 API，不再区分不同的厂商
    this.llm = new UnifiedClientApi();
  }

  config() {}

  prompts() {}

  masks() {}

  // ShareGPT功能已被移除，替换为打印功能
  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    // 打印功能已在UI组件中实现，此方法保留用于兼容性
    return null;
  }
}

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

export function validString(x: string): boolean {
  return x?.length > 0;
}

export function getHeaders(
  ignoreHeaders: boolean = false,
  overrideModelConfig?: any,
) {
  const accessStore = useAccessStore.getState();
  const chatStore = useChatStore.getState();
  let headers: Record<string, string> = {};
  if (!ignoreHeaders) {
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  const clientConfig = getClientConfig();

  function getConfig() {
    // Use overrideModelConfig if provided (for model testing), otherwise use session config
    const modelConfig =
      overrideModelConfig || chatStore.currentSession().mask.modelConfig;

    // 标准化providerName以确保正确匹配
    const normalizedProviderName = normalizeProviderName(
      modelConfig.providerName as string,
    );

    // 获取厂商配置
    const providerConfig = getProviderConfig(normalizedProviderName);

    // 检查是否是自定义服务商
    const isCustomProvider =
      typeof modelConfig.providerName === "string" &&
      modelConfig.providerName.startsWith("custom_");
    const customProvider = isCustomProvider
      ? accessStore.customProviders.find(
          (p) => p.id === modelConfig.providerName,
        )
      : null;
    const isEnabledAccessControl = accessStore.enabledAccessControl();

    // 动态获取API key
    const apiKey =
      isCustomProvider && customProvider
        ? customProvider.apiKey
        : accessStore.getProviderApiKey(normalizedProviderName);

    return {
      providerConfig,
      isCustomProvider,
      customProvider,
      apiKey,
      isEnabledAccessControl,
      normalizedProviderName, // 添加这个字段供其他地方使用
    };
  }

  function getAuthHeader(): string {
    const { providerConfig } = getConfig();
    return providerConfig?.authHeaderName || "Authorization";
  }

  const {
    providerConfig,
    isCustomProvider,
    customProvider,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();

  const authHeader = getAuthHeader();

  // 判断是否需要特殊的认证处理（非标准 Authorization 头）
  const needsSpecialAuth = !!(
    providerConfig?.authHeaderName &&
    providerConfig.authHeaderName !== "Authorization"
  );

  const bearerToken = getBearerToken(apiKey, needsSpecialAuth);

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    // 对于需要特殊认证头的厂商，即使使用 access code，也应该使用对应的认证头
    if (needsSpecialAuth) {
      headers[authHeader] = getBearerToken(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
        needsSpecialAuth,
      );
    } else {
      headers["Authorization"] = getBearerToken(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
      );
    }
  }

  // 为自定义服务商添加配置信息到请求头
  if (isCustomProvider && customProvider) {
    // 使用Base64编码避免非ISO-8859-1字符问题
    const configJson = JSON.stringify(customProvider);
    // 使用TextEncoder将UTF-8字符串转换为字节数组，然后转换为Base64
    const encoder = new TextEncoder();
    const bytes = encoder.encode(configJson);
    const base64 = btoa(String.fromCharCode(...bytes));
    headers["x-custom-provider-config"] = base64;
  }

  return headers;
}

export function getClientApi(provider: string): ClientApi {
  // 现在所有厂商都使用统一的 API，不需要区分不同的厂商
  return new ClientApi();
}

// 标准化provider名称，将provider.id转换为ServiceProvider枚举值
export function normalizeProviderName(provider: string): string {
  // 检查 provider 是否为空
  if (!provider || typeof provider !== "string") {
    logger.warn(
      "normalizeProviderName: provider is undefined or invalid, defaulting to OpenAI",
    );
    return ServiceProvider.OpenAI.id;
  }

  // 如果是自定义服务商，直接返回自定义服务商的ID，不要映射到内置服务商
  if (provider.startsWith("custom_")) {
    const { useAccessStore } = require("../store");
    const accessStore = useAccessStore.getState();
    const customProvider = accessStore.customProviders.find(
      (p: any) => p.id === provider,
    );

    if (customProvider) {
      // 直接返回自定义服务商的ID，让 SDK Manager 处理
      logger.debug(`[API] Normalized custom provider: ${provider}`);
      return provider; // 返回原始的自定义服务商ID
    }
  }

  // 创建动态映射表，将provider.id映射到ServiceProvider.id
  const providerIdMap: Record<string, string> = {};
  getAllProviders().forEach((provider) => {
    providerIdMap[provider.id.toLowerCase()] = provider.id;
  });

  // 如果provider已经是ServiceProvider.id，直接返回
  const allProviderIds = getAllProviders().map((p) => p.id);
  if (allProviderIds.includes(provider)) {
    return provider;
  }

  // 如果provider是provider.id格式，转换为ServiceProvider.id
  const lowerProvider = provider.toLowerCase();
  const normalizedProvider = providerIdMap[lowerProvider];

  if (normalizedProvider) {
    return normalizedProvider;
  }

  // 默认返回第一个可用的提供商
  return getAllProviders()[0]?.id || ServiceProvider.OpenAI.id;
}

// 自定义服务商现在直接使用内置的API，不再需要CustomProviderApi
