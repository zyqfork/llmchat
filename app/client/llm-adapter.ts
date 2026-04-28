import { logger } from "../utils/logger";
import { applyProxyIfNeeded } from "../utils/pi-web-ui-compat";
import { fetch as tauriFetch, FetchType, isTauriApp } from "../utils/fetch";
import { getAllProviders } from "../constant";
import { useAccessStore } from "../store/access";
import { resolvePiProviderId } from "./pi-provider-resolver";
import { executeMcpToolCall } from "./mcp-tool-executor";
import { completeSimple, getModel, streamSimple } from "@mariozechner/pi-ai";
import { agentLoop, runAgentLoop } from "@mariozechner/pi-agent-core";

export interface LLMAdapterRequest {
  providerId: string;
  model: string;
  options: any;
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

const passthroughConvertToLlm = async (messages: any[]) => messages as any[];
let originalFetch: typeof globalThis.fetch | null = null;
let tauriFetchOverrideInstalled = false;
const tauriFetchBaseUrls = new Set<string>();

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

function toPiUserContent(content: any): string | any[] {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");

  return content
    .map((part: any) => {
      if (!part || typeof part !== "object") return undefined;
      if (part.type === "text" && typeof part.text === "string") {
        return { type: "text", text: part.text };
      }
      if (part.type === "image_url" && part.image_url?.url) {
        // Keep text-only compatibility by downgrading unknown image format.
        return { type: "text", text: `[image] ${part.image_url.url}` };
      }
      return undefined;
    })
    .filter(Boolean);
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

function toPiContext(messages: any[]): any {
  const normalized = extractSystemPrompt(messages);
  const piMessages: any[] = [];

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
      piMessages.push({
        role: "assistant",
        content: [{ type: "text", text: text ?? "" }],
        api: "openai-completions",
        provider: "openai",
        model: "compat-history",
        usage: EMPTY_USAGE,
        stopReason: "stop",
        timestamp: Date.now(),
      });
    }
  }

  return {
    systemPrompt: normalized.systemPrompt,
    messages: piMessages,
  };
}

function getCustomProviderRuntimeConfig(
  providerId: string,
  accessStore: any,
): any | null {
  const custom = accessStore.getCustomProvider(providerId);
  if (!custom) return null;
  const apiTypeKey = `${providerId}ApiType`;
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
  return {
    apiKey: effectiveConfig.apiKey,
    baseUrl: effectiveConfig.baseUrl || provider?.defaultBaseUrl,
    sdkType: provider?.sdkType,
    useProxy: storeConfig.useProxy,
    proxyUrl: storeConfig.proxyUrl,
    apiType,
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

function toPiModel(
  providerId: string,
  modelId: string,
  cfg?: any,
  knownProvider?: string,
): any | null {
  const runtimeCfg = cfg || getProviderRuntimeConfig(providerId);
  if (!runtimeCfg?.apiKey) return null;
  const api = resolvePiApiType(runtimeCfg);

  if (knownProvider) {
    try {
      const builtin = getModel(knownProvider as any, modelId as any);
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
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 32768,
    compat: resolveCompat(runtimeCfg, providerId),
  } as any;
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

function toAgentTools(openAiTools: any[] = []) {
  return openAiTools
    .map((tool: any) => {
      const fn = tool?.function;
      if (!fn?.name) return null;
      return {
        name: fn.name,
        label: fn.name,
        description: fn.description || `Tool ${fn.name}`,
        parameters: fn.parameters || {
          type: "object",
          properties: {},
        },
        execute: async (toolCallId: string, args: any) => {
          const toolExec = await executeMcpToolCall(
            {
              id: toolCallId,
              name: fn.name,
              arguments: args,
            },
            openAiTools,
          );
          if (toolExec.isError) {
            throw new Error(toolExec.content);
          }
          return {
            content: [{ type: "text", text: toolExec.content }],
            details: toolExec.content,
          };
        },
      };
    })
    .filter(Boolean);
}

function assistantMessageToProviderMetadata(message: any) {
  if (message?.api !== "openai-responses") {
    return {};
  }

  return {
    responseId: message?.responseId,
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
      totalTokens: message?.usage?.totalTokens ?? 0,
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

function agentEventToUnifiedPart(event: any) {
  if (event?.type === "message_update") {
    return assistantEventToUnifiedPart(event.assistantMessageEvent);
  }

  if (event?.type === "tool_execution_end") {
    return {
      type: "tool-result",
      toolCall: {
        id: event.toolCallId,
        name: event.toolName,
        arguments: event.args,
      },
      result:
        event.result?.content?.[0]?.text ?? JSON.stringify(event.result ?? {}),
      isError: !!event.isError,
    };
  }

  return undefined;
}

async function* toUnifiedFullStream(piStream: any) {
  yield* mapStreamParts(piStream, assistantEventToUnifiedPart);
}

async function* toUnifiedAgentStream(agentStream: any) {
  yield* mapStreamParts(agentStream, agentEventToUnifiedPart);
}

async function* mapStreamParts(stream: any, toPart: (event: any) => any) {
  for await (const event of stream) {
    const part = toPart(event);
    if (part) yield part;
  }
}

function lastAssistantMessage(messages: any[] = []) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "assistant") {
      return message;
    }
  }
  return undefined;
}

function buildAgentContext(context: any, tools: any) {
  return {
    systemPrompt: context.systemPrompt || "",
    messages: context.messages || [],
    tools,
  };
}

function buildAgentRunOptions(requestModel: any, streamOptions: any) {
  return {
    model: requestModel,
    convertToLlm: passthroughConvertToLlm,
    ...streamOptions,
  };
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

  return {
    temperature: req.options?.temperature,
    maxTokens: req.options?.maxTokens,
    signal: req.options?.abortSignal,
    apiKey: cfg.apiKey,
    onPayload: (payload: any, usedModel: any) => {
      debugCapture.request = {
        url: usedModel.baseUrl,
        method: "POST",
        body: payload,
      };
      return undefined;
    },
    onResponse: (response: any) => {
      const capturedResponse: NonNullable<DebugCapture["response"]> = {
        status: response.status,
        headers: response.headers,
      };
      debugCapture.response = capturedResponse;
    },
  };
}

async function prepareAdapterRequest(req: LLMAdapterRequest) {
  const cfg = getProviderRuntimeConfig(req.providerId) as any;
  const knownProvider = resolvePiProviderId(req.providerId);

  const model = toPiModel(req.providerId, req.model, cfg, knownProvider);
  if (!cfg?.apiKey || !model) {
    throw new Error(
      `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
    );
  }

  const debugCapture: DebugCapture = {};
  const context = toPiContext(req.options?.messages ?? []);
  const openAiTools = Array.isArray(req.options?.tools)
    ? req.options.tools
    : [];
  const agentTools = toAgentTools(openAiTools);
  const normalizedTools =
    agentTools.length > 0 ? (agentTools as any) : undefined;
  const requestModel = withProxyModel(model, cfg);
  const streamOptions = buildPiStreamOptions(
    req,
    cfg,
    debugCapture,
    requestModel,
  );

  return {
    context,
    normalizedTools,
    requestModel,
    streamOptions,
    debugCapture,
  };
}

export function streamText(req: LLMAdapterRequest) {
  return (async () => {
    const {
      context,
      normalizedTools,
      requestModel,
      streamOptions,
      debugCapture,
    } = await prepareAdapterRequest(req);

    if (!normalizedTools) {
      const piStream = streamSimple(requestModel, context, streamOptions);
      return {
        fullStream: toUnifiedFullStream(piStream),
        providerMetadata: piStream
          .result()
          .then(assistantMessageToProviderMetadata)
          .catch(() => ({})),
        ...buildDebugGetters(debugCapture),
      };
    }

    const agentContext = buildAgentContext(context, normalizedTools);
    const agentOptions = buildAgentRunOptions(requestModel, streamOptions);
    const agentStream = agentLoop(
      [],
      agentContext,
      agentOptions,
      req.options?.abortSignal,
      streamSimple as any,
    );

    return {
      fullStream: toUnifiedAgentStream(agentStream),
      providerMetadata: agentStream
        .result()
        .then((messages: any[]) =>
          assistantMessageToProviderMetadata(lastAssistantMessage(messages)),
        )
        .catch(() => ({})),
      ...buildDebugGetters(debugCapture),
    };
  })();
}

export async function generateText(req: LLMAdapterRequest) {
  const {
    context,
    normalizedTools,
    requestModel,
    streamOptions,
    debugCapture,
  } = await prepareAdapterRequest(req);

  let result: any = null;

  if (!normalizedTools) {
    const message = await completeSimple(requestModel, context, streamOptions);

    return assistantMessageToResult(message, debugCapture);
  }

  const agentContext = buildAgentContext(context, normalizedTools);
  const agentOptions = buildAgentRunOptions(requestModel, streamOptions);
  await runAgentLoop(
    [],
    agentContext,
    agentOptions,
    async (event: any) => {
      if (event.type === "message_end" && event.message?.role === "assistant") {
        result = event.message;
      }
    },
    req.options?.abortSignal,
    streamSimple as any,
  );

  if (!result) {
    throw new Error("[LLM Adapter] No assistant result generated");
  }

  return assistantMessageToResult(result, debugCapture);
}
