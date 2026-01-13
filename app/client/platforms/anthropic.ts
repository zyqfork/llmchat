import {
  Anthropic,
  ApiPath,
  DEFAULT_MODELS,
  OpenaiPath,
  ServiceProvider,
} from "@/app/constant";
import { OpenAIListModelResponse } from "./openai";
import { ChatOptions, getHeaders, LLMApi, SpeechOptions } from "../api";
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  ChatMessageTool,
} from "@/app/store";
import { getClientConfig } from "@/app/config/client";
import { ANTHROPIC_BASE_URL } from "@/app/constant";
import { getMessageTextContent, isVisionModel } from "@/app/utils";
import {
  preProcessImageContent,
  stream,
  streamWithThink,
  registerMcpToolFunctions,
} from "@/app/utils/chat";
import { getModelCapabilitiesWithCustomConfig } from "@/app/config/model-capabilities";
import { cloudflareAIGatewayUrl } from "@/app/utils/cloudflare";
import { RequestPayload } from "./openai";
import { fetch, getProxyUrl, FetchType } from "@/app/utils/fetch";
import { logger } from "@/app/utils/logger";

export type MultiBlockContent = {
  type: "image" | "text";
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
  text?: string;
};

export type AnthropicMessage = {
  role: (typeof ClaudeMapper)[keyof typeof ClaudeMapper];
  content: string | MultiBlockContent[];
};

export interface AnthropicChatRequest {
  model: string; // The model that will complete your prompt.
  messages: AnthropicMessage[]; // The prompt that you want Claude to complete.
  max_tokens: number; // The maximum number of tokens to generate before stopping.
  stop_sequences?: string[]; // Sequences that will cause the model to stop generating completion text.
  temperature?: number; // Amount of randomness injected into the response.
  top_p?: number; // Use nucleus sampling.
  top_k?: number; // Only sample from the top K options for each subsequent token.
  metadata?: object; // An object describing metadata about the request.
  stream?: boolean; // Whether to incrementally stream the response using server-sent events.
  thinking?: {
    type: "enabled";
    budget_tokens: number;
  }; // Extended thinking configuration for Claude models.
}

export interface ChatRequest {
  model: string; // The model that will complete your prompt.
  prompt: string; // The prompt that you want Claude to complete.
  max_tokens_to_sample: number; // The maximum number of tokens to generate before stopping.
  stop_sequences?: string[]; // Sequences that will cause the model to stop generating completion text.
  temperature?: number; // Amount of randomness injected into the response.
  top_p?: number; // Use nucleus sampling.
  top_k?: number; // Only sample from the top K options for each subsequent token.
  metadata?: object; // An object describing metadata about the request.
  stream?: boolean; // Whether to incrementally stream the response using server-sent events.
}

export interface ChatResponse {
  completion: string;
  stop_reason: "stop_sequence" | "max_tokens";
  model: string;
}

export type ChatStreamResponse = ChatResponse & {
  stop?: string;
  log_id: string;
};

const ClaudeMapper = {
  assistant: "assistant",
  user: "user",
  system: "user",
} as const;

const keys = ["claude-2, claude-instant-1"];

export class ClaudeApi implements LLMApi {
  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  extractMessage(res: any) {
    return res?.content?.[0]?.text;
  }
  async chat(options: ChatOptions): Promise<void> {
    const visionModel = isVisionModel(options.config.model);

    const accessStore = useAccessStore.getState();

    const shouldStream = !!options.config.stream;

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    // try get base64image from local cache image_url
    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      const content = await preProcessImageContent(v.content);
      messages.push({ role: v.role, content });
    }

    const keys = ["system", "user"];

    // roles must alternate between "user" and "assistant" in claude, so add a fake assistant message between two user messages
    for (let i = 0; i < messages.length - 1; i++) {
      const message = messages[i];
      const nextMessage = messages[i + 1];

      if (keys.includes(message.role) && keys.includes(nextMessage.role)) {
        messages[i] = [
          message,
          {
            role: "assistant",
            content: ";",
          },
        ] as any;
      }
    }

    const prompt = messages
      .flat()
      .filter((v) => {
        if (!v.content) return false;
        if (typeof v.content === "string" && !v.content.trim()) return false;
        return true;
      })
      .map((v) => {
        const { role, content } = v;
        const insideRole = ClaudeMapper[role] ?? "user";

        if (!visionModel || typeof content === "string") {
          return {
            role: insideRole,
            content: getMessageTextContent(v),
          };
        }
        return {
          role: insideRole,
          content: content
            .filter((v) => v.image_url || v.text)
            .map(({ type, text, image_url }) => {
              if (type === "text") {
                return {
                  type,
                  text: text!,
                };
              }
              const { url = "" } = image_url || {};
              const colonIndex = url.indexOf(":");
              const semicolonIndex = url.indexOf(";");
              const comma = url.indexOf(",");

              const mimeType = url.slice(colonIndex + 1, semicolonIndex);
              const encodeType = url.slice(semicolonIndex + 1, comma);
              const data = url.slice(comma + 1);

              return {
                type: "image" as const,
                source: {
                  type: encodeType,
                  media_type: mimeType,
                  data,
                },
              };
            }),
        };
      });

    if (prompt[0]?.role === "assistant") {
      prompt.unshift({
        role: "user",
        content: ";",
      });
    }

    // 获取模型能力
    const modelCapabilities = getModelCapabilitiesWithCustomConfig(
      modelConfig.model,
    );

    const requestBody: AnthropicChatRequest = {
      messages: prompt,
      stream: shouldStream,

      model: modelConfig.model,
      max_tokens: modelConfig.max_tokens,
      temperature: modelConfig.temperature,
      top_p: modelConfig.top_p,
      // top_k: modelConfig.top_k,
      top_k: 5,
    };

    // 如果模型具有推理能力且是Claude类型，添加thinking配置
    if (
      modelCapabilities.reasoning &&
      modelCapabilities.thinkingType === "claude"
    ) {
      const thinkingBudget = modelConfig.thinkingBudget ?? -1;

      if (thinkingBudget !== 0) {
        // 0表示关闭thinking
        requestBody.thinking = {
          type: "enabled",
          budget_tokens: thinkingBudget === -1 ? 10000 : thinkingBudget, // -1表示自动，使用默认值10000
        };
      }
    }

    const path = this.path(Anthropic.ChatPath);

    const controller = new AbortController();
    options.onController?.(controller);

    if (shouldStream) {
      let index = -1;
      const tools: any[] = options.tools || [];
      const funcs: Record<string, Function> = {};
      registerMcpToolFunctions(tools, funcs);
      const modelCapabilities = getModelCapabilitiesWithCustomConfig(
        options.config.model,
      );
      return streamWithThink(
        path,
        requestBody,
        {
          ...getHeaders(),
          "anthropic-version": accessStore.anthropicApiVersion,
        },
        // @ts-ignore
        tools.map((tool) => ({
          name: tool?.function?.name,
          description: tool?.function?.description,
          input_schema: tool?.function?.parameters,
        })),
        funcs,
        controller,
        // parseSSE
        (text: string, runTools: ChatMessageTool[]) => {
          // console.log("parseSSE", text, runTools);
          let chunkJson:
            | undefined
            | {
                type:
                  | "message_start"
                  | "content_block_start"
                  | "content_block_delta"
                  | "content_block_stop"
                  | "message_delta"
                  | "message_stop"
                  | "ping";
                content_block?: {
                  type: "tool_use" | "thinking" | "text";
                  id?: string;
                  name?: string;
                  text?: string;
                };
                delta?: {
                  type:
                    | "text_delta"
                    | "input_json_delta"
                    | "thinking_delta"
                    | "signature_delta";
                  text?: string;
                  thinking?: string;
                  partial_json?: string;
                  stop_reason?: string;
                  signature?: string;
                };
                index?: number;
              };
          chunkJson = JSON.parse(text);

          // 忽略 ping、message_start、message_stop 等事件
          if (
            chunkJson?.type === "ping" ||
            chunkJson?.type === "message_start" ||
            chunkJson?.type === "message_stop"
          ) {
            return {
              isThinking: false,
              content: "",
            };
          }

          // Handle refusal stop reason in message_delta
          if (chunkJson?.delta?.stop_reason === "refusal") {
            // Return a message to display to the user
            const refusalMessage =
              "\n\n[Assistant refused to respond. Please modify your request and try again.]";
            options.onError?.(
              new Error("Content policy violation: " + refusalMessage),
            );
            return {
              isThinking: false,
              content: refusalMessage,
            };
          }

          // 处理 content_block_start 事件
          // 根据文档，thinking 内容块会先发送 content_block_start 事件
          if (chunkJson?.type === "content_block_start") {
            const blockType = chunkJson?.content_block?.type;

            if (blockType === "tool_use") {
              index += 1;
              const id = chunkJson?.content_block?.id || "";
              const name = chunkJson?.content_block?.name || "";
              if (id && name) {
                runTools.push({
                  id,
                  type: "function",
                  function: {
                    name,
                    arguments: "",
                  },
                });
              }
            }

            // 对于 thinking 和 text 类型，返回空内容
            // thinking 内容会在后续的 thinking_delta 事件中返回
            return {
              isThinking: blockType === "thinking",
              content: "",
            };
          }

          // 处理 content_block_stop 事件
          if (chunkJson?.type === "content_block_stop") {
            return {
              isThinking: false,
              content: "",
            };
          }

          // 处理 content_block_delta 事件
          if (chunkJson?.type === "content_block_delta") {
            const deltaType = chunkJson?.delta?.type;

            // 处理 tool_use 的 input_json_delta
            if (
              deltaType === "input_json_delta" &&
              chunkJson?.delta?.partial_json
            ) {
              if (index >= 0 && runTools[index]) {
                // @ts-ignore
                runTools[index]["function"]["arguments"] +=
                  chunkJson?.delta?.partial_json;
              }
              return {
                isThinking: false,
                content: "",
              };
            }

            // 处理 signature_delta（thinking 内容块的签名）
            if (deltaType === "signature_delta") {
              // 签名用于验证 thinking 内容的完整性，不需要显示
              return {
                isThinking: false,
                content: "",
              };
            }

            // 处理 thinking_delta
            if (deltaType === "thinking_delta") {
              const thinkingContent = chunkJson?.delta?.thinking || "";
              return {
                isThinking: true,
                content: thinkingContent,
              };
            }

            // 处理 text_delta
            if (deltaType === "text_delta") {
              const textContent = chunkJson?.delta?.text || "";
              return {
                isThinking: false,
                content: textContent,
              };
            }
          }

          // 处理 message_delta 事件（包含 usage 信息等）
          if (chunkJson?.type === "message_delta") {
            return {
              isThinking: false,
              content: "",
            };
          }

          // 默认返回空内容
          return {
            isThinking: false,
            content: "",
          };
        },
        // processToolMessage, include tool_calls message and tool call results
        (
          requestPayload: RequestPayload,
          toolCallMessage: any,
          toolCallResult: any[],
        ) => {
          // reset index value
          index = -1;
          // @ts-ignore
          requestPayload?.messages?.splice(
            // @ts-ignore
            requestPayload?.messages?.length,
            0,
            {
              role: "assistant",
              content: toolCallMessage.tool_calls.map(
                (tool: ChatMessageTool) => ({
                  type: "tool_use",
                  id: tool.id,
                  name: tool?.function?.name,
                  input: tool?.function?.arguments
                    ? JSON.parse(tool?.function?.arguments)
                    : {},
                }),
              ),
            },
            // @ts-ignore
            ...toolCallResult.map((result) => ({
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: result.tool_call_id,
                  content: result.content,
                },
              ],
            })),
          );
        },
        options,
        true, // 总是启用 thinking 处理，根据响应内容判断是否显示
      );
    } else {
      const payload = {
        method: "POST",
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        headers: {
          ...getHeaders(false, {
            model: options.config.model,
            providerName: options.config.providerName,
          }), // get common headers
          "anthropic-version": accessStore.anthropicApiVersion,
          // do not send `anthropicApiKey` in browser!!!
          // Authorization: getAuthKey(accessStore.anthropicApiKey),
        },
      };

      try {
        controller.signal.onabort = () =>
          options.onFinish("", new Response(null, { status: 400 }));

        const res = await fetch(path, payload, FetchType.LLM);
        const resJson = await res.json();

        const message = this.extractMessage(resJson);
        try {
          const debugBody = JSON.parse(payload.body as any);
          (res as any).__requestDebug = {
            url: path,
            method: payload.method,
            headers: payload.headers,
            body: debugBody,
          };
        } catch {}
        options.onFinish(message, res);
      } catch (e) {
        logger.error("failed to chat", e);
        options.onError?.(e as Error);
      }
    }
  }
  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }
  async models() {
    try {
      // 明确指定使用 Anthropic 的配置，确保使用 x-api-key 认证头
      const headers = getHeaders(false, {
        providerName: ServiceProvider.Anthropic,
      });

      const res = await fetch(
        this.path(OpenaiPath.ListModelPath),
        {
          method: "GET",
          headers,
        },
        FetchType.LLM,
      );

      const resJson = (await res.json()) as OpenAIListModelResponse;
      const chatModels = resJson.data;

      if (!chatModels) {
        return [];
      }
      return chatModels.map((m) => ({
        name: m.id,
        available: true,
        provider: {
          id: "anthropic",
          providerName: "Anthropic",
          providerType: "anthropic",
          sorted: 4,
        },
        sorted: 4,
      }));
    } catch (e) {
      logger.error("[Anthropic] failed to list models", e);
      return DEFAULT_MODELS.filter(
        (m) => m.provider.providerName === "Anthropic",
      );
    }
  }
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl: string = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.anthropicUrl;
    }

    // if endpoint is empty, use default endpoint
    if (baseUrl.trim().length === 0) {
      const isApp = !!getClientConfig()?.isApp;

      baseUrl = isApp ? ANTHROPIC_BASE_URL : ApiPath.Anthropic;
    }

    if (!baseUrl.startsWith("http") && !baseUrl.startsWith("/api")) {
      baseUrl = "https://" + baseUrl;
    }

    baseUrl = trimEnd(baseUrl, "/");

    // 检查是否启用代理
    if (accessStore.anthropicUseProxy) {
      const proxyUrl = getProxyUrl(
        accessStore.anthropicUseProxy,
        accessStore.anthropicProxyUrl,
      );
      const endpoint = `${baseUrl}/${path}`;

      // 在 Tauri 环境中，proxyUrl 为空，直接使用原始 URL
      if (!proxyUrl) {
        return cloudflareAIGatewayUrl(endpoint);
      }

      // 在 standalone 模式中，使用代理服务器
      const proxyPath = "/api/anthropic/";
      try {
        const u = new URL(proxyUrl + proxyPath + path);
        u.searchParams.append("endpoint", endpoint);
        return cloudflareAIGatewayUrl(u.toString());
      } catch (e) {
        logger.error("[Anthropic] Failed to build proxy URL:", e);
        return cloudflareAIGatewayUrl(endpoint);
      }
    }

    // try rebuild url, when using cloudflare ai gateway in client
    return cloudflareAIGatewayUrl(`${baseUrl}/${path}`);
  }
}

function trimEnd(s: string, end = " ") {
  if (end.length === 0) return s;

  while (s.endsWith(end)) {
    s = s.slice(0, -end.length);
  }

  return s;
}
