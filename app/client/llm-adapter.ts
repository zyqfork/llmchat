import { logger } from "../utils/logger";
import { applyProxyIfNeeded } from "@earendil-works/pi-web-ui/utils/proxy-utils";
import { fetch as tauriFetch, FetchType, isTauriApp } from "../utils/fetch";
import { getAllProviders } from "../constant";
import {
  findPiModelByIdAsync,
  resolvePiProviderId,
} from "../utils/pi-ai-resolver";
import { useAccessStore } from "../store/access";
import {
  agentEventToUnifiedPart,
  createPiAgentRun,
  lastAssistantMessage,
  toAgentTools,
} from "./pi-agent-bridge";
import {
  createModels,
  createProvider,
  type Api,
  type Context,
  type ImageContent,
  type Message,
  type Model,
  type ProviderStreams,
  type TextContent,
  type ThinkingLevel,
} from "@earendil-works/pi-ai";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { openAIResponsesApi } from "@earendil-works/pi-ai/api/openai-responses.lazy";
import { azureOpenAIResponsesApi } from "@earendil-works/pi-ai/api/azure-openai-responses.lazy";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
import { googleGenerativeAIApi } from "@earendil-works/pi-ai/api/google-generative-ai.lazy";
import { transformMessages } from "@earendil-works/pi-ai/api/transform-messages";
import { applyStatefulResponsesPayload } from "../utils/response-api";
import { getModelThinkingBudget } from "../config/model-thinking";

export interface LLMAdapterRequest {
  providerId: string;
  model: string;
  options: any;
  debugCapture?: any;
}

type DebugCapture = {
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: any;
  };
};

const EMPTY_USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

let originalFetch: typeof globalThis.fetch | null = null;
let tauriFetchOverrideInstalled = false;
const tauriFetchBaseUrls = new Set<string>();

// Capture raw HTTP request URL and response body for non-OK responses
// so we can display useful debug info even when the SDK throws before onResponse fires.
type ErrorDebugCapture = {
  url?: string;
  status?: number;
  body?: string;
};
let _lastErrorDebug: ErrorDebugCapture = {};
let _errorCaptureFetchInstalled = false;

export function getLastErrorDebugCapture(): ErrorDebugCapture {
  return _lastErrorDebug;
}

function installErrorCaptureFetch() {
  if (typeof window === "undefined" || _errorCaptureFetchInstalled) return;
  const prevFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    _lastErrorDebug = { url };
    const response = await prevFetch(input, init);
    if (!response.ok) {
      _lastErrorDebug.status = response.status;
      try {
        const cloned = response.clone();
        _lastErrorDebug.body = await cloned.text();
      } catch {
        // ignore
      }
    } else {
      _lastErrorDebug = {};
    }
    return response;
  }) as typeof globalThis.fetch;
  _errorCaptureFetchInstalled = true;
}

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function shouldRouteThroughTauriFetch(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  for (const baseUrl of tauriFetchBaseUrls) {
    if (url.startsWith(baseUrl)) return true;
  }
  return false;
}

async function buildRequestInitForTauriFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<RequestInit | undefined> {
  if (!(input instanceof Request)) return init;

  const method = init?.method || input.method;
  let body = init?.body;
  if (
    body === undefined &&
    method !== "GET" &&
    method !== "HEAD" &&
    input.body
  ) {
    body = await input.clone().arrayBuffer();
  }

  return {
    method,
    headers: init?.headers || input.headers,
    body,
    signal: init?.signal || input.signal,
  };
}

function installTauriFetchOverride(baseUrl?: string) {
  if (typeof window === "undefined" || !isTauriApp()) {
    return;
  }

  const normalizedBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
  if (/^https?:\/\//i.test(normalizedBaseUrl)) {
    tauriFetchBaseUrls.add(normalizedBaseUrl);
  }

  if (tauriFetchOverrideInstalled) return;

  originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getFetchUrl(input);
    if (shouldRouteThroughTauriFetch(url)) {
      const requestInit = await buildRequestInitForTauriFetch(input, init);
      return tauriFetch(url, requestInit, FetchType.LLM);
    }

    return originalFetch!(input, init);
  }) as typeof globalThis.fetch;
  tauriFetchOverrideInstalled = true;
  logger.debug("[LLM Adapter] Installed scoped Tauri fetch override for pi-ai");
}

function extractSystemPrompt(messages: any[]) {
  const systemChunks: string[] = [];
  const remaining: any[] = [];

  for (const msg of messages || []) {
    if (msg?.role === "system" && typeof msg.content === "string") {
      if (msg.content.trim()) systemChunks.push(msg.content.trim());
      continue;
    }
    remaining.push(msg);
  }

  return {
    systemPrompt: systemChunks.length ? systemChunks.join("\n") : undefined,
    messages: remaining,
  };
}

function dataUrlToPiImageContent(url: string): ImageContent | undefined {
  const match = url.match(/^data:([^;,]+);base64,(.*)$/i);
  if (!match) return undefined;

  const [, mimeType, data] = match;
  if (!mimeType || !data) return undefined;

  return {
    type: "image",
    mimeType,
    data,
  };
}

function isPiUserContentPart(
  part: TextContent | ImageContent | undefined,
): part is TextContent | ImageContent {
  return !!part;
}

function toPiUserContent(
  content: any,
): string | (TextContent | ImageContent)[] {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");

  const parts = content
    .map((part: any) => {
      if (!part || typeof part !== "object") return undefined;
      if (part.type === "text" && typeof part.text === "string") {
        return { type: "text", text: part.text } satisfies TextContent;
      }
      if (part.type === "image_url" && part.image_url?.url) {
        return dataUrlToPiImageContent(part.image_url.url);
      }
      return undefined;
    })
    .filter(isPiUserContentPart);

  return parts.length > 0 ? parts : "";
}

function toTextContent(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .map((part: any) => {
        if (!part || typeof part !== "object") return "";
        if (part.type === "text" && typeof part.text === "string") {
          return part.text;
        }
        if (part.type === "image_url" && part.image_url?.url) {
          return `[image] ${part.image_url.url}`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
    if (text) return text;
  }
  try {
    return JSON.stringify(content);
  } catch {
    return String(content ?? "");
  }
}

function toPiContext(
  messages: any[],
  model: Parameters<typeof transformMessages>[1],
): Context {
  const normalized = extractSystemPrompt(messages);
  const piMessages: Message[] = [];

  for (const msg of normalized.messages) {
    if (msg?.role === "user") {
      piMessages.push({
        role: "user",
        content: toPiUserContent(msg.content),
        timestamp: Date.now(),
      });
      continue;
    }

    if (msg?.role === "assistant") {
      const text = toTextContent(msg.content);
      const structuredContent = Array.isArray(msg.contentBlocks)
        ? msg.contentBlocks
        : [{ type: "text", text: text ?? "" }];
      piMessages.push({
        role: "assistant",
        content: structuredContent,
        api: msg.piApi || "openai-completions",
        provider: msg.piProvider || "openai",
        model: msg.piModel || "legacy-history",
        usage: msg.usage || EMPTY_USAGE,
        stopReason: msg.stopReason || "stop",
        timestamp: Date.now(),
      });
    }
  }

  return {
    systemPrompt: normalized.systemPrompt,
    messages: transformMessages(
      piMessages as Parameters<typeof transformMessages>[0],
      model as Parameters<typeof transformMessages>[1],
    ),
  };
}

function getCustomProviderRuntimeConfig(
  providerId: string,
  accessStore: any,
): any | null {
  const custom = accessStore.getCustomProvider(providerId);
  if (!custom) return null;
  const apiTypeKey = `${providerId}ApiType`;
  const isResponseApi =
    custom.type === "openai" &&
    (custom.config?.useResponseApi === true ||
      (accessStore as any)[apiTypeKey] === "response");
  return {
    apiKey: custom.apiKey,
    baseUrl: custom.endpoint,
    sdkType: custom.type === "openai" ? "openai-compatible" : custom.type,
    useProxy: custom.config?.useProxy,
    proxyUrl: custom.config?.proxyUrl,
    apiType:
      custom.type === "openai"
        ? custom.config?.useResponseApi
          ? "response"
          : (accessStore as any)[apiTypeKey] || "chat"
        : "chat",
    responseStateful:
      isResponseApi &&
      (custom.config?.useResponseStateful === true ||
        (accessStore as any)[`${providerId}ResponseStateful`] === true),
  };
}

function getBuiltinProviderRuntimeConfig(
  providerId: string,
  accessStore: any,
): any | null {
  const provider = getAllProviders().find((p) => p.id === providerId);
  const storeConfig = accessStore.getProviderConfig(providerId);
  const effectiveConfig = accessStore.getEffectiveProviderConfig(providerId);
  if (!effectiveConfig?.apiKey) {
    return null;
  }
  let apiType = "chat";
  if (provider?.storeKeys?.apiType) {
    apiType = (accessStore as any)[provider.storeKeys.apiType] || "chat";
  }
  const responseStatefulKey = provider?.storeKeys?.responseStateful;
  return {
    apiKey: effectiveConfig.apiKey,
    baseUrl: effectiveConfig.baseUrl || provider?.defaultBaseUrl,
    sdkType: provider?.sdkType,
    useProxy: storeConfig.useProxy,
    proxyUrl: storeConfig.proxyUrl,
    apiType,
    responseStateful: responseStatefulKey
      ? (accessStore as any)[responseStatefulKey] === true
      : false,
  };
}

function getProviderRuntimeConfig(providerId: string) {
  if (typeof window === "undefined") return null;
  try {
    const accessStore = useAccessStore.getState();
    if (providerId.startsWith("custom_")) {
      return getCustomProviderRuntimeConfig(providerId, accessStore);
    }
    return getBuiltinProviderRuntimeConfig(providerId, accessStore);
  } catch (error) {
    logger.warn("[LLM Adapter] Failed to load provider runtime config:", error);
    return null;
  }
}

function isOpenAIProtocolSdk(sdkType: string): boolean {
  const normalized = String(sdkType || "").toLowerCase();
  return (
    normalized === "openai" ||
    normalized === "openai-compatible" ||
    normalized.includes("openai")
  );
}

function resolvePiApiType(runtimeCfg: any): string {
  const sdkType = String(runtimeCfg?.sdkType || "").toLowerCase();
  if (isOpenAIProtocolSdk(sdkType)) {
    return runtimeCfg?.apiType === "response"
      ? "openai-responses"
      : "openai-completions";
  }
  if (sdkType === "anthropic") return "anthropic-messages";
  if (sdkType === "google") return "google-generative-ai";
  return "openai-completions";
}

function resolveCompat(
  runtimeCfg: any,
  providerId: string,
  builtinCompat?: any,
) {
  const baseUrl: string = String(runtimeCfg?.baseUrl || "");
  const isCustomProvider = String(providerId || "").startsWith("custom_");
  const isOfficialOpenAIHost =
    baseUrl.includes("api.openai.com") || baseUrl.includes("openai.azure.com");
  const shouldForceSystemRole =
    isOpenAIProtocolSdk(runtimeCfg?.sdkType) &&
    (isCustomProvider || !isOfficialOpenAIHost);

  if (!shouldForceSystemRole) return builtinCompat;
  return {
    ...(builtinCompat || {}),
    supportsDeveloperRole: false,
  };
}

async function toPiModel(
  providerId: string,
  modelId: string,
  cfg?: any,
  knownProvider?: string,
): Promise<any | null> {
  const runtimeCfg = cfg || getProviderRuntimeConfig(providerId);
  if (!runtimeCfg?.apiKey) return null;
  const api = resolvePiApiType(runtimeCfg);

  if (knownProvider) {
    try {
      const builtin = await findPiModelByIdAsync(modelId, knownProvider);
      if (!builtin) throw new Error("Unknown pi-ai model");
      const compat = resolveCompat(runtimeCfg, providerId, builtin.compat);
      return {
        ...builtin,
        id: modelId,
        name: modelId,
        api: isOpenAIProtocolSdk(runtimeCfg?.sdkType) ? api : builtin.api,
        baseUrl: runtimeCfg.baseUrl || builtin.baseUrl,
        compat,
      } as any;
    } catch {
      // Fallback to dynamic model construction for unknown model ids.
    }
  }

  return {
    id: modelId,
    name: modelId,
    api,
    provider: providerId,
    baseUrl: runtimeCfg.baseUrl,
    reasoning: true,
    // 自建兼容服务（vLLM 等）常见的 reasoning_effort 取值映射。
    // vLLM/Qwen 仅支持 low/medium/xhigh，把 minimal/high/max 收敛到合法档位，
    // 避免上游 400（例如 vLLM 拒绝 reasoning_effort=high）
    thinkingLevelMap: {
      off: null,
      minimal: "low",
      low: "low",
      medium: "medium",
      high: "xhigh",
      xhigh: "xhigh",
      max: "xhigh",
    },
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 32768,
    compat: resolveCompat(runtimeCfg, providerId),
  } as any;
}

function createRequestModels(requestModel: Model<Api>) {
  const models = createModels();
  const apiFactories: Record<string, () => ProviderStreams> = {
    "openai-completions": openAICompletionsApi,
    "openai-responses": openAIResponsesApi,
    "azure-openai-responses": azureOpenAIResponsesApi,
    "anthropic-messages": anthropicMessagesApi,
    "google-generative-ai": googleGenerativeAIApi,
  };
  const apiFactory = apiFactories[requestModel.api];
  if (!apiFactory) {
    throw new Error(`Unsupported pi-ai API: ${requestModel.api}`);
  }

  models.setProvider(
    createProvider({
      id: requestModel.provider,
      name: requestModel.provider,
      baseUrl: requestModel.baseUrl,
      // 浏览器端 API key 由每次请求显式传入；provider 仍需声明认证语义。
      auth: {
        apiKey: {
          name: requestModel.provider,
          resolve: async () => ({ auth: {} }),
        },
      },
      models: [requestModel],
      api: apiFactory(),
    }),
  );
  return models;
}

function getNormalizedProxyUrl(proxyUrl?: string): string | undefined {
  const normalized = (proxyUrl || "").trim();
  if (normalized) {
    return normalized;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

function withProxyModel(model: any, cfg: any): any {
  if (typeof window !== "undefined" && isTauriApp()) {
    return model;
  }

  const proxyUrl = getNormalizedProxyUrl(cfg?.proxyUrl);
  if (!proxyUrl || !cfg?.apiKey) {
    return model;
  }
  if (cfg.useProxy) {
    if (!model.baseUrl) {
      return model;
    }
    return {
      ...model,
      baseUrl: `${proxyUrl}/?url=${encodeURIComponent(model.baseUrl)}`,
    };
  }
  return applyProxyIfNeeded(model, cfg.apiKey, proxyUrl);
}

function assistantMessageToProviderMetadata(message: any) {
  if (!message) return {};

  // pi-ai 已统一不同供应商的 token、缓存和费用字段，直接保留结构化数据，
  // 避免 UI 再按供应商重复解析。
  return {
    ...(message.responseId ? { responseId: message.responseId } : {}),
    stopReason: message.stopReason,
    usage: message.usage,
    content: message.content,
    api: message.api,
    provider: message.provider,
    model: message.model,
  };
}

function assistantMessageToResult(message: any, debugCapture: DebugCapture) {
  const text = (message?.content || [])
    .filter((c: any) => c?.type === "text")
    .map((c: any) => c.text)
    .join("");
  return {
    text,
    usage: {
      promptTokens: message?.usage?.input ?? 0,
      completionTokens: message?.usage?.output ?? 0,
      cacheReadTokens: message?.usage?.cacheRead ?? 0,
      cacheWriteTokens: message?.usage?.cacheWrite ?? 0,
      totalTokens: message?.usage?.totalTokens ?? 0,
      cost: message?.usage?.cost,
    },
    finishReason: message?.stopReason,
    providerMetadata: assistantMessageToProviderMetadata(message),
    requestDebug: debugCapture.request,
    responseDebug: debugCapture.response,
  };
}

function assistantEventToUnifiedPart(event: any) {
  switch (event?.type) {
    case "text_delta":
      return { type: "text-delta", text: event.delta };
    case "thinking_delta":
      return { type: "reasoning-delta", delta: event.delta };
    case "toolcall_end":
      return { type: "tool-call", toolCall: event.toolCall };
    default:
      return undefined;
  }
}

async function* toUnifiedFullStream(piStream: any) {
  yield* mapStreamParts(piStream, assistantEventToUnifiedPart);
}

async function* toUnifiedAgentStream(agentStream: any) {
  yield* mapStreamParts(agentStream, agentEventToUnifiedPart);
}

async function* mapStreamParts(stream: any, toPart: (event: any) => any) {
  for await (const event of stream) {
    // Handle error events from the pi-ai SDK (e.g. HTTP 403, 429, etc.)
    if (event?.type === "error") {
      // Prefer the raw response body captured at fetch level (original API JSON),
      // fall back to the SDK-reformatted error message string.
      const errorCapture = getLastErrorDebugCapture();
      const rawBody = errorCapture.body;
      const errorMsg =
        rawBody ||
        event?.error?.errorMessage ||
        event?.reason ||
        "Unknown streaming error from provider";
      throw new Error(errorMsg);
    }
    const part = toPart(event);
    if (part?.type === "error") {
      const errorCapture = getLastErrorDebugCapture();
      throw new Error(
        errorCapture.body ||
          part.error?.errorMessage ||
          part.reason ||
          "Unknown agent streaming error",
      );
    }
    if (part) yield part;
  }
}

function buildDebugGetters(debugCapture: DebugCapture) {
  return {
    requestDebug: () => debugCapture.request,
    responseDebug: () => debugCapture.response,
  };
}

function buildPiStreamOptions(
  req: LLMAdapterRequest,
  cfg: any,
  debugCapture: DebugCapture,
  requestModel: any,
) {
  installTauriFetchOverride(requestModel?.baseUrl);
  installErrorCaptureFetch();

  // 思考深度 → pi-ai 的思考档位：
  // -1=动态（不传参，使用服务端默认），0=关闭思考，>0=按档位映射
  // 仅当会话未设置（undefined）时，回退到模型配置弹窗中的模型级默认值
  const sessionBudget = req.options?.thinkingBudget;
  // undefined 表示会话未设置，继承模型默认值；-1 是用户明确选择的动态模式，
  // 不能再被模型默认值覆盖。
  const thinkingBudget =
    sessionBudget === undefined
      ? getModelThinkingBudget(req.model)
      : sessionBudget;
  let reasoning: ThinkingLevel | undefined;
  if (typeof thinkingBudget === "number" && thinkingBudget > 0) {
    reasoning =
      thinkingBudget <= 1024
        ? "low"
        : thinkingBudget <= 4096
          ? "medium"
          : thinkingBudget <= 8192
            ? "high"
            : "xhigh";
  }
  // thinkingBudget === 0（关闭思考）：不传 reasoning，由下方 onPayload 注入
  // chat_template_kwargs.enable_thinking=false 实现关闭

  const isCustomProvider = String(req.providerId || "").startsWith("custom_");

  return {
    reasoning,
    temperature: req.options?.temperature,
    maxTokens: req.options?.maxTokens,
    signal: req.options?.abortSignal,
    apiKey: cfg.apiKey,
    onPayload: (payload: any, usedModel: any) => {
      const errorCapture = getLastErrorDebugCapture();
      let nextPayload = payload;
      if (
        thinkingBudget === 0 &&
        isCustomProvider &&
        usedModel?.api === "openai-completions"
      ) {
        // reasoning_effort 无法表达“关闭思考”；vLLM/Qwen 需通过
        // chat_template_kwargs.enable_thinking=false 关闭（顶层 enable_thinking 会被忽略）
        nextPayload = {
          ...nextPayload,
          chat_template_kwargs: {
            ...(nextPayload.chat_template_kwargs || {}),
            enable_thinking: false,
          },
        };
      }
      if (
        cfg.apiType === "response" &&
        cfg.responseStateful &&
        !req.options?.disableResponseStateful
      ) {
        nextPayload = applyStatefulResponsesPayload(nextPayload, {
          previousResponseId: req.options?.previousResponseId,
          hasTools: Array.isArray(payload?.tools) && payload.tools.length > 0,
        });
      }
      debugCapture.request = {
        url: errorCapture.url || usedModel.baseUrl,
        method: "POST",
        body: nextPayload,
      };
      return nextPayload;
    },
    onResponse: (response: any) => {
      // onResponse fires only when the SDK successfully receives a response header.
      // For error responses (e.g. 403), the OpenAI SDK may throw BEFORE this hook
      // fires. In that case, we fall back to _lastErrorDebug captured by the fetch
      // interceptor, which operates at a lower level.
      const tauriBody = (response as any)?.__tauriDebugBody;
      const errorCapture = getLastErrorDebugCapture();

      const body = tauriBody || errorCapture.body || undefined;

      const headers: Record<string, string> = {};
      try {
        if (
          response.headers &&
          typeof response.headers.forEach === "function"
        ) {
          response.headers.forEach((v: string, k: string) => (headers[k] = v));
        } else if (response.headers) {
          Object.assign(headers, response.headers);
        }
      } catch (e) {
        // Ignore header extraction errors
      }

      debugCapture.response = {
        status: response.status ?? errorCapture.status,
        headers,
        body,
      };
    },
  };
}

async function prepareAdapterRequest(req: LLMAdapterRequest) {
  const cfg = getProviderRuntimeConfig(req.providerId) as any;
  const knownProvider = resolvePiProviderId(req.providerId);

  const model = await toPiModel(
    req.providerId,
    req.model,
    cfg,
    knownProvider,
  );
  if (!cfg?.apiKey || !model) {
    throw new Error(
      `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
    );
  }

  const debugCapture: DebugCapture = req.debugCapture || {};
  const context = toPiContext(req.options?.messages ?? [], model);
  const openAiTools = Array.isArray(req.options?.tools) ? req.options.tools : [];
  const agentTools = toAgentTools(openAiTools);
  const requestModel = withProxyModel(model, cfg);
  const streamOptions = buildPiStreamOptions(
    req,
    cfg,
    debugCapture,
    requestModel,
  );

  return {
    context,
    agentTools,
    requestModel,
    streamOptions,
    debugCapture,
  };
}

export function streamText(req: LLMAdapterRequest) {
  return (async () => {
    const { context, agentTools, requestModel, streamOptions, debugCapture } =
      await prepareAdapterRequest(req);

    if (agentTools.length > 0) {
      const models = createRequestModels(requestModel);
      const agentStream = createPiAgentRun({
        context,
        model: requestModel,
        streamOptions,
        tools: agentTools,
        streamFn: models.streamSimple.bind(models),
        abortSignal: req.options?.abortSignal,
        sessionId: req.options?.sessionId,
      });
      return {
        fullStream: toUnifiedAgentStream(agentStream),
        providerMetadata: agentStream
          .result()
          .then((messages) =>
            assistantMessageToProviderMetadata(lastAssistantMessage(messages)),
          )
          .catch(() => ({})),
        ...buildDebugGetters(debugCapture),
      };
    }

    const models = createRequestModels(requestModel);
    const piStream = models.streamSimple(requestModel, context, streamOptions);
    return {
      fullStream: toUnifiedFullStream(piStream),
      providerMetadata: piStream
        .result()
        .then(assistantMessageToProviderMetadata)
        .catch(() => ({})),
      ...buildDebugGetters(debugCapture),
    };
  })();
}

export async function generateText(req: LLMAdapterRequest) {
  const { context, agentTools, requestModel, streamOptions, debugCapture } =
    await prepareAdapterRequest(req);

  if (agentTools.length > 0) {
    const models = createRequestModels(requestModel);
    const messages = await createPiAgentRun({
      context,
      model: requestModel,
      streamOptions,
      tools: agentTools,
      streamFn: models.streamSimple.bind(models),
      abortSignal: req.options?.abortSignal,
      sessionId: req.options?.sessionId,
    }).result();
    const message = lastAssistantMessage(messages);
    if (!message) throw new Error("[LLM Adapter] Agent returned no response");
    return assistantMessageToResult(message, debugCapture);
  }

  const models = createRequestModels(requestModel);
  const message = await models.completeSimple(
    requestModel,
    context,
    streamOptions,
  );
  return assistantMessageToResult(message, debugCapture);
}
