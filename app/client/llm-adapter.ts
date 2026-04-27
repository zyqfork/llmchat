import { logger } from "../utils/logger";
import { applyProxyIfNeeded } from "../utils/pi-web-ui-compat";
import { getAllProviders } from "../constant";
import { executeMcpAction } from "../mcp/actions.client";

export type LLMEngine = "pi-ai";

export interface LLMAdapterRequest {
  providerId: string;
  model: string;
  options: any;
}

export interface LLMAdapter {
  engine: LLMEngine;
  streamText(req: LLMAdapterRequest): any;
  generateText(req: LLMAdapterRequest): Promise<any>;
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

type PiAiModule = {
  completeSimple: (...args: any[]) => Promise<any>;
  streamSimple: (...args: any[]) => any;
  getModel: (...args: any[]) => any;
  parseStreamingJson: <T = Record<string, unknown>>(
    partialJson: string | undefined,
  ) => T;
  validateToolArguments: (tool: any, toolCall: any) => any;
};

let piAiModulePromise: Promise<PiAiModule> | null = null;

function getPiAiModule(): Promise<PiAiModule> {
  if (!piAiModulePromise) {
    piAiModulePromise = import("@mariozechner/pi-ai") as Promise<PiAiModule>;
  }
  return piAiModulePromise;
}

async function tryCaptureResponseBody(
  response: unknown,
): Promise<any | undefined> {
  const r = response as any;
  try {
    let text: string | undefined;
    if (
      typeof r?.clone === "function" &&
      typeof r?.clone()?.text === "function"
    ) {
      text = await r.clone().text();
    } else if (typeof r?.text === "function") {
      text = await r.text();
    } else if (typeof r?.body === "string") {
      text = r.body;
    }
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
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
      const text =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      piMessages.push({
        role: "assistant",
        content: [{ type: "text", text: text ?? "" }],
        api: "openai-completions",
        provider: "openai",
        model: "compat-history",
        usage: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
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

function getProviderRuntimeConfig(providerId: string) {
  if (typeof window === "undefined") return null;
  try {
    const { useAccessStore } = require("../store/access");
    const accessStore = useAccessStore.getState();
    const provider = getAllProviders().find((p) => p.id === providerId);

    if (providerId.startsWith("custom_")) {
      const custom = accessStore.customProviders.find(
        (p: any) => p.id === providerId,
      );
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

    const storeConfig = accessStore.getProviderConfig(providerId);
    let apiType = "chat";
    if (provider?.storeKeys?.apiType) {
      apiType = (accessStore as any)[provider.storeKeys.apiType] || "chat";
    }
    return {
      apiKey: storeConfig.apiKey,
      baseUrl: storeConfig.baseUrl || provider?.defaultBaseUrl,
      sdkType: provider?.sdkType,
      useProxy: storeConfig.useProxy,
      proxyUrl: storeConfig.proxyUrl,
      apiType,
    };
  } catch (error) {
    logger.warn("[LLM Adapter] Failed to load provider runtime config:", error);
    return null;
  }
}

function toPiModel(providerId: string, modelId: string, cfg?: any): any | null {
  const runtimeCfg = cfg || getProviderRuntimeConfig(providerId);
  if (!runtimeCfg?.apiKey) return null;

  const knownProviderMap: Record<string, string> = {
    openai: "openai",
    anthropic: "anthropic",
    google: "google",
    xai: "xai",
    groq: "groq",
    cerebras: "cerebras",
    openrouter: "openrouter",
    zai: "zai",
  };
  const knownProvider = knownProviderMap[providerId];
  const isCustomProvider = String(providerId || "").startsWith("custom_");
  const baseUrl: string = String(runtimeCfg.baseUrl || "");
  const isOfficialOpenAIHost =
    baseUrl.includes("api.openai.com") || baseUrl.includes("openai.azure.com");
  const shouldForceSystemRole =
    runtimeCfg.sdkType === "openai" &&
    (isCustomProvider || !isOfficialOpenAIHost);
  if (knownProvider && runtimeCfg?.builtinModel) {
    try {
      const builtin = runtimeCfg.builtinModel;
      return {
        ...builtin,
        id: modelId,
        name: modelId,
        baseUrl: runtimeCfg.baseUrl || builtin.baseUrl,
        compat: shouldForceSystemRole
          ? {
              ...(builtin.compat || {}),
              supportsDeveloperRole: false,
            }
          : builtin.compat,
      } as any;
    } catch {
      // Fallback to dynamic model construction for unknown model ids.
    }
  }

  const api =
    runtimeCfg.sdkType === "openai"
      ? runtimeCfg.apiType === "response"
        ? "openai-responses"
        : "openai-completions"
      : runtimeCfg.sdkType === "anthropic"
      ? "anthropic-messages"
      : runtimeCfg.sdkType === "google"
      ? "google-generative-ai"
      : "openai-completions";

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
    compat: shouldForceSystemRole
      ? {
          supportsDeveloperRole: false,
        }
      : undefined,
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

function toPiTools(openAiTools: any[] = []) {
  return openAiTools
    .map((tool: any) => {
      const fn = tool?.function;
      if (!fn?.name) return null;
      return {
        name: fn.name,
        description: fn.description || `Tool ${fn.name}`,
        parameters: fn.parameters || {
          type: "object",
          properties: {},
        },
      };
    })
    .filter(Boolean);
}

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function normalizeDebugHeaders(
  rawHeaders?: Record<string, string> | Headers | Array<[string, string]>,
) {
  if (!rawHeaders) return {};

  try {
    if (typeof Headers !== "undefined" && rawHeaders instanceof Headers) {
      const normalized: Record<string, string> = {};
      rawHeaders.forEach((value, key) => {
        normalized[key] = value;
      });
      return normalized;
    }
  } catch {
    // ignore and fallback
  }

  if (Array.isArray(rawHeaders)) {
    const normalized: Record<string, string> = {};
    rawHeaders.forEach(([key, value]) => {
      if (typeof key === "string") {
        normalized[key] = String(value ?? "");
      }
    });
    return normalized;
  }

  return { ...(rawHeaders as Record<string, string>) };
}

function hasHeader(headers: Record<string, string>, name: string) {
  const lower = name.toLowerCase();
  return Object.keys(headers).some((k) => k.toLowerCase() === lower);
}

function looksLikeFullApiPath(url: string) {
  return /\/(chat\/completions|responses|messages|models)(\?|$)/.test(url);
}

function buildDebugRequestUrl(baseUrl: string | undefined, api: string) {
  const normalized = trimSlash(baseUrl || "");
  if (!normalized) return "";
  if (looksLikeFullApiPath(normalized)) return normalized;

  switch (api) {
    case "openai-responses":
      return `${normalized}/responses`;
    case "anthropic-messages":
      return `${normalized}/messages`;
    case "google-generative-ai":
      return `${normalized}/models`;
    case "openai-completions":
    default:
      return `${normalized}/chat/completions`;
  }
}

function buildDebugHeaders(
  providerId: string,
  apiKey: string,
  api: string,
  rawHeaders?: Record<string, string> | Headers | Array<[string, string]>,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...normalizeDebugHeaders(rawHeaders),
  };
  if (apiKey) {
    if (api === "anthropic-messages") {
      if (!hasHeader(headers, "x-api-key")) {
        headers["x-api-key"] = apiKey;
      }
      if (!hasHeader(headers, "anthropic-version")) {
        headers["anthropic-version"] = "2023-06-01";
      }
    } else if (api === "google-generative-ai") {
      if (!hasHeader(headers, "x-goog-api-key")) {
        headers["x-goog-api-key"] = apiKey;
      }
    } else {
      if (!hasHeader(headers, "Authorization")) {
        headers.Authorization = `Bearer ${apiKey}`;
      }
    }
  }
  if (!hasHeader(headers, "x-provider-id")) {
    headers["x-provider-id"] = providerId;
  }
  return headers;
}

function parseMcpToolMeta(toolName: string, allTools: any[]) {
  const byMeta = allTools.find((t) => t?.function?.name === toolName)?._mcpMeta;
  if (byMeta?.clientId && byMeta?.toolName) return byMeta;

  if (!toolName.startsWith("mcp_")) return null;
  const rest = toolName.slice(4);
  const splitIdx = rest.indexOf("_");
  if (splitIdx <= 0) return null;
  return {
    clientId: rest.slice(0, splitIdx),
    toolName: rest.slice(splitIdx + 1),
  };
}

async function executeMcpToolCall(toolCall: any, allTools: any[]) {
  const meta = parseMcpToolMeta(toolCall.name, allTools);
  if (!meta) {
    return {
      isError: true,
      content: `Unsupported tool: ${toolCall.name}`,
    };
  }

  try {
    const piAi = await getPiAiModule();
    const toolDef = allTools.find(
      (t: any) => t?.function?.name === toolCall.name,
    )?.function;
    const parsedArguments =
      typeof toolCall.arguments === "string"
        ? piAi.parseStreamingJson(toolCall.arguments)
        : toolCall.arguments || {};
    const validatedArguments = toolDef
      ? piAi.validateToolArguments(
          {
            name: toolDef.name,
            description: toolDef.description || `Tool ${toolDef.name}`,
            parameters: toolDef.parameters || {
              type: "object",
              properties: {},
            },
          },
          {
            ...toolCall,
            arguments: parsedArguments,
          },
        )
      : parsedArguments;

    const result = await executeMcpAction(meta.clientId, {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: meta.toolName,
        arguments: validatedArguments,
      },
    } as any);
    return {
      isError: false,
      content:
        typeof result === "string"
          ? result
          : JSON.stringify(result ?? {}, null, 2),
    };
  } catch (error) {
    return {
      isError: true,
      content: error instanceof Error ? error.message : String(error),
    };
  }
}

class PiAiAdapter implements LLMAdapter {
  engine: LLMEngine = "pi-ai";

  streamText(req: LLMAdapterRequest) {
    return (async () => {
      const piAi = await getPiAiModule();
      const cfg = getProviderRuntimeConfig(req.providerId) as any;
      const knownProviderMap: Record<string, string> = {
        openai: "openai",
        anthropic: "anthropic",
        google: "google",
        xai: "xai",
        groq: "groq",
        cerebras: "cerebras",
        openrouter: "openrouter",
        zai: "zai",
      };
      const knownProvider = knownProviderMap[req.providerId];
      if (knownProvider && cfg) {
        try {
          cfg.builtinModel = piAi.getModel(
            knownProvider as any,
            req.model as any,
          );
        } catch {
          // ignore and fallback to dynamic model
        }
      }

      const model = toPiModel(req.providerId, req.model, cfg);
      if (!cfg?.apiKey || !model) {
        throw new Error(
          `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
        );
      }

      const debugCapture: DebugCapture = {};
      const requestModel = withProxyModel(model, cfg);
      const fullStream = (async function* () {
        const context = toPiContext(req.options?.messages ?? []);
        const openAiTools = Array.isArray(req.options?.tools)
          ? req.options.tools
          : [];
        const piTools = toPiTools(openAiTools);
        if (piTools.length > 0) {
          (context as any).tools = piTools;
        }

        let loop = 0;
        while (loop < 6) {
          loop += 1;
          const pendingToolCalls: any[] = [];
          const s = piAi.streamSimple(requestModel, context, {
            apiKey: cfg.apiKey,
            temperature: req.options?.temperature,
            maxTokens: req.options?.maxTokens,
            signal: req.options?.abortSignal,
            onPayload: (payload: any, usedModel: any) => {
              debugCapture.request = {
                url: buildDebugRequestUrl(usedModel.baseUrl, usedModel.api),
                method: "POST",
                headers: buildDebugHeaders(
                  req.providerId,
                  cfg.apiKey,
                  usedModel.api,
                  usedModel.headers ?? {},
                ),
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
              void tryCaptureResponseBody(response).then((body) => {
                if (typeof body !== "undefined") {
                  capturedResponse.body = body;
                }
              });
            },
          });

          for await (const event of s) {
            if (event.type === "text_delta") {
              yield { type: "text-delta", text: event.delta };
            } else if (event.type === "thinking_delta") {
              yield { type: "reasoning-delta", delta: event.delta };
            } else if (event.type === "toolcall_end") {
              pendingToolCalls.push(event.toolCall);
              yield { type: "tool-call", toolCall: event.toolCall };
            }
          }

          const finalMessage = await s.result();
          context.messages.push(finalMessage as any);
          if (
            finalMessage.stopReason !== "toolUse" ||
            pendingToolCalls.length === 0
          ) {
            break;
          }

          for (const call of pendingToolCalls) {
            const toolExec = await executeMcpToolCall(call, openAiTools);
            context.messages.push({
              role: "toolResult",
              toolCallId: call.id,
              toolName: call.name,
              content: [{ type: "text", text: toolExec.content }],
              isError: toolExec.isError,
              timestamp: Date.now(),
            } as any);
            yield {
              type: "tool-result",
              toolCall: call,
              result: toolExec.content,
              isError: toolExec.isError,
            };
          }
        }
      })();

      return {
        fullStream,
        providerMetadata: Promise.resolve({}),
        content: "",
        text: "",
        requestDebug: () => debugCapture.request,
        responseDebug: () => debugCapture.response,
      };
    })();
  }

  async generateText(req: LLMAdapterRequest) {
    const piAi = await getPiAiModule();
    const cfg = getProviderRuntimeConfig(req.providerId) as any;
    const knownProviderMap: Record<string, string> = {
      openai: "openai",
      anthropic: "anthropic",
      google: "google",
      xai: "xai",
      groq: "groq",
      cerebras: "cerebras",
      openrouter: "openrouter",
      zai: "zai",
    };
    const knownProvider = knownProviderMap[req.providerId];
    if (knownProvider && cfg) {
      try {
        cfg.builtinModel = piAi.getModel(
          knownProvider as any,
          req.model as any,
        );
      } catch {
        // ignore and fallback to dynamic model
      }
    }
    const model = toPiModel(req.providerId, req.model, cfg);
    if (!cfg?.apiKey || !model) {
      throw new Error(
        `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
      );
    }

    const context = toPiContext(req.options?.messages ?? []);
    const openAiTools = Array.isArray(req.options?.tools)
      ? req.options.tools
      : [];
    const piTools = toPiTools(openAiTools);
    if (piTools.length > 0) {
      (context as any).tools = piTools;
    }

    let result: any = null;
    let loop = 0;
    const debugCapture: DebugCapture = {};
    const requestModel = withProxyModel(model, cfg);
    while (loop < 6) {
      loop += 1;
      result = await piAi.completeSimple(requestModel, context, {
        apiKey: cfg.apiKey,
        temperature: req.options?.temperature,
        maxTokens: req.options?.maxTokens,
        signal: req.options?.abortSignal,
        onPayload: (payload: any, usedModel: any) => {
          debugCapture.request = {
            url: buildDebugRequestUrl(usedModel.baseUrl, usedModel.api),
            method: "POST",
            headers: buildDebugHeaders(
              req.providerId,
              cfg.apiKey,
              usedModel.api,
              usedModel.headers ?? {},
            ),
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
          void tryCaptureResponseBody(response).then((body) => {
            if (typeof body !== "undefined") {
              capturedResponse.body = body;
            }
          });
        },
      });
      context.messages.push(result as any);

      if (result.stopReason !== "toolUse") {
        break;
      }

      const toolCalls = (result.content || []).filter(
        (c: any) => c?.type === "toolCall",
      );
      if (toolCalls.length === 0) {
        break;
      }

      for (const call of toolCalls) {
        const toolExec = await executeMcpToolCall(call, openAiTools);
        context.messages.push({
          role: "toolResult",
          toolCallId: call.id,
          toolName: call.name,
          content: [{ type: "text", text: toolExec.content }],
          isError: toolExec.isError,
          timestamp: Date.now(),
        } as any);
      }
    }

    const text = result.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");

    return {
      text,
      usage: {
        promptTokens: result.usage?.input ?? 0,
        completionTokens: result.usage?.output ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
      finishReason: result.stopReason,
      providerMetadata: {
        responseId: result.responseId,
      },
      requestDebug: debugCapture.request,
      responseDebug: debugCapture.response,
    };
  }
}

const piAiAdapter = new PiAiAdapter();

export function resolveLLMAdapter(engine?: string): LLMAdapter {
  if (engine && engine !== "pi-ai") {
    logger.warn(
      `[LLM Adapter] Unsupported engine ${engine}, force using pi-ai`,
    );
  }
  return piAiAdapter;
}
