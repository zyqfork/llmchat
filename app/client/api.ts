import {
  ACCESS_CODE_PREFIX,
  DEFAULT_MODELS,
  ServiceProvider,
  getProviderConfig,
  getAllProviders,
} from "../constant";
import { ChatMessageTool, useAccessStore, useChatStore } from "../store";
import {
  generateText,
  streamText,
  getLastErrorDebugCapture,
} from "./llm-adapter";
import { findPiProviderByModel } from "../utils/pi-catalog";
import { logger } from "../utils/logger";
import { ModelSize, ROLES } from "../typing";
import type { MessageRole } from "../typing";

export { ROLES };
export type { MessageRole };

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
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
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
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

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, responseRes: Response) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
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

export interface LLMClient {
  chat(options: ChatOptions): Promise<void>;
  speech(options: SpeechOptions): Promise<ArrayBuffer>;
  models(): Promise<LLMModel[]>;
}

function isNonArrayObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
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
  providerMetadata?: any,
  requestDebug?: any,
  responseDebug?: {
    status?: number;
    headers?: Record<string, string>;
    body?: any;
  },
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
  if (providerMetadata && typeof providerMetadata === "object") {
    (response as any).__providerMetadata = providerMetadata;
  }
  if (typeof responseDebug?.body !== "undefined") {
    (response as any).__responseBody = responseDebug.body;
  } else if (responseId) {
    (response as any).__responseBody = { id: responseId };
  }
  return response;
}

function normalizeUrlWithPath(url: string, body?: any): string {
  const u = url.replace(/\/+$/, "");
  if (/\/(chat\/completions|responses|messages|models)(\?|$)/i.test(u)) {
    return u;
  }
  if (body && typeof body === "object") {
    if ("input" in body && !("messages" in body)) return `${u}/responses`;
    if ("messages" in body) return `${u}/chat/completions`;
  }
  return `${u}/chat/completions`;
}

function normalizeDebugRequest(
  requestDebug: any,
  providerName?: string,
  fallbackBody?: any,
) {
  const raw = isNonArrayObject(requestDebug) ? requestDebug : {};
  const body = typeof raw.body !== "undefined" ? raw.body : fallbackBody;
  const headersFromDebug = isNonArrayObject(raw.headers) ? raw.headers : {};
  const authHeaders = getHeaders(false, { providerName });

  const mergedHeaders: Record<string, string> = {
    ...headersFromDebug,
    ...(Object.keys(headersFromDebug).length === 0 ? authHeaders : {}),
  };

  const rawUrl =
    typeof raw.url === "string" && raw.url.trim().length > 0
      ? raw.url
      : "pi-ai";
  const normalizedUrl =
    rawUrl.startsWith("http") || rawUrl.startsWith("/")
      ? normalizeUrlWithPath(rawUrl, body)
      : rawUrl;

  return {
    url: normalizedUrl,
    method: (raw.method || "POST").toUpperCase(),
    headers: mergedHeaders,
    body,
  };
}

function getDebugRequestFromResult(result: any): any {
  if (typeof result?.requestDebug === "function") {
    return result.requestDebug();
  }
  return result?.requestDebug;
}

function getDebugResponseFromResult(result: any): any {
  if (typeof result?.responseDebug === "function") {
    return result.responseDebug();
  }
  return result?.responseDebug;
}

function buildResponseFromResult(
  result: any,
  providerName: string | undefined,
  requestBody: any,
): Response {
  const providerMetadata = result?.providerMetadata;
  const responseId = getResponseApiConversationId(providerMetadata);
  const requestDebug = normalizeDebugRequest(
    getDebugRequestFromResult(result),
    providerName,
    requestBody,
  );
  const responseDebug = getDebugResponseFromResult(result);
  return buildResponseWithMetadata(
    responseId,
    providerMetadata,
    requestDebug,
    responseDebug,
  );
}

function getProviderIdFromEnabledModels(model: string): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const accessStore = useAccessStore.getState();
    const enabledModels = accessStore.enabledModels || {};
    const enabledProviders = accessStore.enabledProviders || {};
    const hasEnabledModel = (providerKey: string): boolean => {
      const list = enabledModels[providerKey];
      return Array.isArray(list) && list.includes(model);
    };

    for (const provider of accessStore.customProviders || []) {
      if (!provider.enabled) continue;
      if (hasEnabledModel(provider.id)) {
        return provider.id;
      }
    }

    for (const provider of getAllProviders()) {
      if (!enabledProviders[provider.name]) continue;
      if (hasEnabledModel(provider.name)) {
        return provider.id;
      }
    }
  } catch (error) {
    logger.warn("[API] Could not resolve provider from enabled models:", error);
  }

  return undefined;
}

function resolveProviderIdFromModel(model: string): string {
  const resolved = findPiProviderByModel(model) || ServiceProvider.OpenAI.id;
  if (resolved !== ServiceProvider.OpenAI.id) {
    return resolved;
  }
  logger.warn(
    `[API] Model ${model} was not found in pi-ai catalog or enabled model settings; defaulting to OpenAI. Set providerName explicitly for custom providers.`,
  );
  return resolved;
}

function resolveProviderId(model: string, providerName?: string) {
  if (providerName) {
    return normalizeProviderName(providerName);
  }

  if (typeof window !== "undefined") {
    try {
      const currentSession = useChatStore.getState().currentSession();
      const sessionProviderName =
        currentSession?.mask?.modelConfig?.providerName;
      if (sessionProviderName) {
        return normalizeProviderName(sessionProviderName);
      }
    } catch (error) {
      logger.warn("[API] Could not read session provider:", error);
    }
  }

  return resolveProviderIdFromEnabledOrCatalog(model);
}

function resolveProviderIdFromEnabledOrCatalog(model: string): string {
  return (
    getProviderIdFromEnabledModels(model) ?? resolveProviderIdFromModel(model)
  );
}

/**
 * 统一的客户端 API 实现
 * 替代所有单独的 platform 文件
 */
class UnifiedClientApi {
  async chat(options: ChatOptions): Promise<void> {
    const debugCapture: any = {};
    try {
      const requestOptions = {
        messages: options.messages,
        model: options.config.model,
        temperature: options.config.temperature,
        maxTokens: options.config.max_tokens,
        stream: options.config.stream,
        tools: options.tools,
        providerName: options.config.providerName,
      };
      const providerId = resolveProviderId(
        requestOptions.model,
        requestOptions.providerName,
      );

      if (options.config.stream) {
        // 处理流式响应
        logger.debug("[Unified Client API] Starting stream chat");

        const streamResult = await streamText({
          providerId,
          model: requestOptions.model,
          options: requestOptions,
          debugCapture,
        });

        if (streamResult?.fullStream) {
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
                case "reasoning-delta": {
                  if (capabilities.reasoning) {
                    const text = (part as any).delta ?? "";
                    if (text) {
                      reasoningContent += text;
                      pushUpdate(buildDisplayContent());
                    }
                  }
                  break;
                }
                case "text-delta": {
                  const delta = (part as any).text ?? "";

                  if (capabilities.reasoning) {
                    const reasoningDelta = extractReasoningContent(
                      part,
                      reasoningField,
                    );

                    if (reasoningDelta) {
                      reasoningContent += reasoningDelta;
                    }
                  }

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

            const fullContent = buildDisplayContent();

            let providerMetadata: any = undefined;
            try {
              providerMetadata = await streamResult.providerMetadata;
            } catch (metadataError) {
              logger.warn(
                "[Unified Client API] Failed to read provider metadata:",
                metadataError,
              );
            }

            const mockResponse = buildResponseFromResult(
              {
                ...streamResult,
                providerMetadata,
              },
              options.config.providerName,
              requestOptions,
            );

            options.onFinish(fullContent, mockResponse);
          } catch (streamError: any) {
            // Error is handled and displayed in the UI, no need to log to console

            // Attach debug info to the error so the UI can show it in the debug panel.
            // onResponse is NOT called by the OpenAI SDK when an HTTP error occurs
            // (it throws before the hook fires), so we fall back to the fetch-level
            // interceptor which captured the URL, status and body at a lower layer.
            const fetchCapture = getLastErrorDebugCapture();
            const responseDebug =
              debugCapture.response ||
              (fetchCapture.status
                ? {
                    status: fetchCapture.status,
                    body: fetchCapture.body,
                    headers: {},
                  }
                : undefined);
            const requestDebug = debugCapture.request
              ? {
                  ...debugCapture.request,
                  url: fetchCapture.url || debugCapture.request.url,
                }
              : undefined;

            if (requestDebug || responseDebug) {
              streamError.debug = {
                request: requestDebug,
                response: responseDebug,
              };
            }

            options.onError?.(streamError as Error);
          }
        } else {
          options.onFinish("", new Response());
        }
      } else {
        // 处理普通响应
        logger.debug("[Unified Client API] Starting non-stream chat");

        const result = await generateText({
          providerId,
          model: requestOptions.model,
          options: requestOptions,
          debugCapture,
        });
        const content = result?.text || "";
        options.onUpdate?.(content, content);
        options.onFinish(
          content,
          buildResponseFromResult(
            result,
            options.config.providerName,
            requestOptions,
          ),
        );
      }
    } catch (error: any) {
      // Error is handled and displayed in the UI, no need to log to console
      const fetchCapture = getLastErrorDebugCapture();
      const responseDebug =
        debugCapture.response ||
        (fetchCapture.status
          ? {
              status: fetchCapture.status,
              body: fetchCapture.body,
              headers: {},
            }
          : undefined);
      const requestDebug = debugCapture.request
        ? {
            ...debugCapture.request,
            url: fetchCapture.url || debugCapture.request.url,
          }
        : undefined;

      if (requestDebug || responseDebug) {
        error.debug = { request: requestDebug, response: responseDebug };
      }
      options.onError?.(error as Error);
    }
  }

  async speech(_options: SpeechOptions): Promise<ArrayBuffer> {
    // 语音合成功能，可以通过统一的代理端点实现
    throw new Error("Speech synthesis not implemented in unified API yet");
  }

  async models(): Promise<LLMModel[]> {
    return DEFAULT_MODELS as LLMModel[];
  }
}

export type ClientApi = {
  llm: LLMClient;
};

function getBearerToken(apiKey: string, noBearer: boolean = false): string {
  return apiKey?.length > 0
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
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

  const modelConfig =
    overrideModelConfig || chatStore.currentSession().mask.modelConfig;
  const providerName = normalizeProviderName(
    modelConfig.providerName as string,
  );
  const providerConfig = getProviderConfig(providerName);
  const isEnabledAccessControl = accessStore.enabledAccessControl();
  const authHeader = providerConfig?.authHeaderName || "Authorization";
  const customProvider = providerName.startsWith("custom_")
    ? accessStore.customProviders.find((p) => p.id === providerName)
    : null;
  const apiKey = customProvider
    ? customProvider.apiKey
    : accessStore.getProviderApiKey(providerName);

  // 判断是否需要特殊的认证处理（非标准 Authorization 头）
  const needsSpecialAuth = !!(
    providerConfig?.authHeaderName &&
    providerConfig.authHeaderName !== "Authorization"
  );

  const bearerToken = getBearerToken(apiKey, needsSpecialAuth);

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && accessStore.accessCode?.length > 0) {
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

  return headers;
}

export function getClientApi(_provider: string): ClientApi {
  // 现在所有厂商都使用统一的 API，不需要区分不同的厂商
  return { llm: new UnifiedClientApi() };
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
    return provider;
  }

  const providers = getAllProviders();
  if (providers.some((p) => p.id === provider)) {
    return provider;
  }

  const normalizedProvider = providers.find(
    (p) => p.id.toLowerCase() === provider.toLowerCase(),
  )?.id;

  if (normalizedProvider) {
    return normalizedProvider;
  }

  // 默认返回第一个可用的提供商
  return providers[0]?.id || ServiceProvider.OpenAI.id;
}

// 自定义服务商现在直接使用内置的API，不再需要CustomProviderApi
