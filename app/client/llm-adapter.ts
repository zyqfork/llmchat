import { logger } from "../utils/logger";
import { completeSimple, streamSimple } from "@mariozechner/pi-ai";
import type { Context, Model } from "@mariozechner/pi-ai";
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
  };
};

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

function toPiContext(messages: any[]): Context {
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
      apiType,
    };
  } catch (error) {
    logger.warn("[LLM Adapter] Failed to load provider runtime config:", error);
    return null;
  }
}

function toPiModel(providerId: string, modelId: string): Model<any> | null {
  const cfg = getProviderRuntimeConfig(providerId);
  if (!cfg?.apiKey) return null;

  const api =
    cfg.sdkType === "openai"
      ? cfg.apiType === "response"
        ? "openai-responses"
        : "openai-completions"
      : cfg.sdkType === "anthropic"
      ? "anthropic-messages"
      : cfg.sdkType === "google"
      ? "google-generative-ai"
      : "openai-completions";

  return {
    id: modelId,
    name: modelId,
    api,
    provider: providerId,
    baseUrl: cfg.baseUrl,
    reasoning: true,
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 32768,
  } as Model<any>;
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
    const result = await executeMcpAction(meta.clientId, {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: meta.toolName,
        arguments: toolCall.arguments || {},
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
    const cfg = getProviderRuntimeConfig(req.providerId);
    const model = toPiModel(req.providerId, req.model);
    if (!cfg?.apiKey || !model) {
      throw new Error(
        `[LLM Adapter] pi-ai missing runtime config for provider ${req.providerId}`,
      );
    }

    const debugCapture: DebugCapture = {};
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
        const s = streamSimple(model, context, {
          apiKey: cfg.apiKey,
          temperature: req.options?.temperature,
          maxTokens: req.options?.maxTokens,
          signal: req.options?.abortSignal,
          onPayload: (payload, usedModel) => {
            debugCapture.request = {
              url: usedModel.baseUrl,
              method: "POST",
              headers: usedModel.headers ?? {},
              body: payload,
            };
            return undefined;
          },
          onResponse: (response) => {
            debugCapture.response = {
              status: response.status,
              headers: response.headers,
            };
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
  }

  async generateText(req: LLMAdapterRequest) {
    const cfg = getProviderRuntimeConfig(req.providerId);
    const model = toPiModel(req.providerId, req.model);
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
    while (loop < 6) {
      loop += 1;
      result = await completeSimple(model, context, {
        apiKey: cfg.apiKey,
        temperature: req.options?.temperature,
        maxTokens: req.options?.maxTokens,
        signal: req.options?.abortSignal,
        onPayload: (payload, usedModel) => {
          debugCapture.request = {
            url: usedModel.baseUrl,
            method: "POST",
            headers: usedModel.headers ?? {},
            body: payload,
          };
          return undefined;
        },
        onResponse: (response) => {
          debugCapture.response = {
            status: response.status,
            headers: response.headers,
          };
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
