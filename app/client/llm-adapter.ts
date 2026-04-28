import { logger } from "../utils/logger";
import { applyProxyIfNeeded } from "../utils/pi-web-ui-compat";
import { getAllProviders } from "../constant";
import { resolvePiProviderId } from "./pi-provider-resolver";
import { executeMcpToolCall } from "./mcp-tool-executor";
import { runAgentLoop } from "@mariozechner/pi-agent-core";

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
  streamSimple: (...args: any[]) => any;
  getModel: (...args: any[]) => any;
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

function toPiModel(
  providerId: string,
  modelId: string,
  cfg?: any,
  knownProvider?: string,
): any | null {
  const runtimeCfg = cfg || getProviderRuntimeConfig(providerId);
  if (!runtimeCfg?.apiKey) return null;

  const isCustomProvider = String(providerId || "").startsWith("custom_");
  const baseUrl: string = String(runtimeCfg.baseUrl || "");
  const isOfficialOpenAIHost =
    baseUrl.includes("api.openai.com") || baseUrl.includes("openai.azure.com");
  const sdkType = String(runtimeCfg.sdkType || "").toLowerCase();
  const isOpenAIProtocol =
    sdkType === "openai" ||
    sdkType === "openai-compatible" ||
    sdkType.includes("openai");
  const shouldForceSystemRole =
    isOpenAIProtocol && (isCustomProvider || !isOfficialOpenAIHost);
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

function attachBuiltinModelToConfig(
  piAi: PiAiModule,
  knownProvider: string | undefined,
  modelId: string,
  cfg: any,
) {
  if (!knownProvider || !cfg) {
    return;
  }
  try {
    cfg.builtinModel = piAi.getModel(knownProvider as any, modelId as any);
  } catch {
    // ignore and fallback to dynamic model
  }
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

class PiAiAdapter implements LLMAdapter {
  engine: LLMEngine = "pi-ai";

  streamText(req: LLMAdapterRequest) {
    return (async () => {
      const piAi = await getPiAiModule();
      const cfg = getProviderRuntimeConfig(req.providerId) as any;
      const knownProvider = await resolvePiProviderId(req.providerId);
      attachBuiltinModelToConfig(piAi, knownProvider, req.model, cfg);

      const model = toPiModel(req.providerId, req.model, cfg, knownProvider);
      if (!cfg?.apiKey || !model) {
        throw new Error(
          `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
        );
      }

      const debugCapture: DebugCapture = {};
      const requestModel = withProxyModel(model, cfg);
      const openAiTools = Array.isArray(req.options?.tools)
        ? req.options.tools
        : [];
      const agentTools = toAgentTools(openAiTools);
      const fullStream = (async function* () {
        const context = toPiContext(req.options?.messages ?? []);
        const queue: any[] = [];
        let done = false;
        let wake: (() => void) | null = null;
        const push = (event: any) => {
          queue.push(event);
          if (wake) {
            const notify = wake;
            wake = null;
            notify();
          }
        };

        const loopPromise = runAgentLoop(
          [],
          {
            systemPrompt: context.systemPrompt || "",
            messages: context.messages || [],
            tools: agentTools as any,
          },
          {
            model: requestModel,
            convertToLlm: async (messages: any[]) => messages as any[],
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
          },
          async (event: any) => {
            if (event.type === "message_update") {
              const assistantEvent = event.assistantMessageEvent;
              if (assistantEvent?.type === "text_delta") {
                push({ type: "text-delta", text: assistantEvent.delta });
              } else if (assistantEvent?.type === "thinking_delta") {
                push({ type: "reasoning-delta", delta: assistantEvent.delta });
              } else if (assistantEvent?.type === "toolcall_end") {
                push({ type: "tool-call", toolCall: assistantEvent.toolCall });
              }
            } else if (event.type === "tool_execution_end") {
              push({
                type: "tool-result",
                toolCall: {
                  id: event.toolCallId,
                  name: event.toolName,
                  arguments: event.args,
                },
                result:
                  event.result?.content?.[0]?.text ??
                  JSON.stringify(event.result ?? {}),
                isError: !!event.isError,
              });
            }
          },
          req.options?.abortSignal,
          piAi.streamSimple as any,
        )
          .catch((error) => {
            push({
              type: "error",
              error: error instanceof Error ? error.message : String(error),
            });
          })
          .finally(() => {
            done = true;
            if (wake) {
              const notify = wake;
              wake = null;
              notify();
            }
          });

        while (!done || queue.length > 0) {
          if (queue.length === 0) {
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
            continue;
          }
          yield queue.shift();
        }
        await loopPromise;
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
    const knownProvider = await resolvePiProviderId(req.providerId);
    attachBuiltinModelToConfig(piAi, knownProvider, req.model, cfg);
    const model = toPiModel(req.providerId, req.model, cfg, knownProvider);
    if (!cfg?.apiKey || !model) {
      throw new Error(
        `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
      );
    }

    const context = toPiContext(req.options?.messages ?? []);
    const openAiTools = Array.isArray(req.options?.tools)
      ? req.options.tools
      : [];
    const agentTools = toAgentTools(openAiTools);

    let result: any = null;
    const debugCapture: DebugCapture = {};
    const requestModel = withProxyModel(model, cfg);
    const generatedMessages: any[] = [];
    await runAgentLoop(
      [],
      {
        systemPrompt: context.systemPrompt || "",
        messages: context.messages || [],
        tools: agentTools as any,
      },
      {
        model: requestModel,
        convertToLlm: async (messages: any[]) => messages as any[],
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
      },
      async (event: any) => {
        if (
          event.type === "message_end" &&
          event.message?.role === "assistant"
        ) {
          generatedMessages.push(event.message);
          result = event.message;
        }
      },
      req.options?.abortSignal,
      piAi.streamSimple as any,
    );

    if (!result && generatedMessages.length > 0) {
      result = generatedMessages[generatedMessages.length - 1];
    }
    if (!result) {
      throw new Error("[LLM Adapter] No assistant result generated");
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
