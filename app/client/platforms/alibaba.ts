"use client";
import { ServiceProvider } from "@/app/constant";

// Alibaba API endpoints
const Alibaba = {
  ChatPath: "chat/completions",
  ResponsePath: "responses",
};
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  ChatMessageTool,
} from "@/app/store";
import {
  preProcessImageContent,
  streamWithThink,
  registerMcpToolFunctions,
} from "@/app/utils/chat";
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  SpeechOptions,
  MultimodalContent,
  MultimodalContentForAlibaba,
} from "../api";
import { getClientConfig } from "@/app/config/client";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  getTimeoutMSByModel,
  isVisionModel,
} from "@/app/utils";
import { getModelCapabilitiesWithCustomConfig } from "@/app/config/model-capabilities";
import { fetch, getProxyUrl, FetchType } from "@/app/utils/fetch";
import { logger } from "@/app/utils/logger";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

// OpenAI 兼容格式的请求负载
interface RequestPayload {
  model: string;
  messages: {
    role: "system" | "user" | "assistant" | "tool";
    content: string | MultimodalContent[];
    tool_calls?: ChatMessageTool[];
    tool_call_id?: string;
  }[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  tools?: any[];
}

export class QwenApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.alibabaUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp
        ? ServiceProvider.Alibaba.defaultBaseUrl
        : ServiceProvider.Alibaba.apiPath;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (
      !baseUrl.startsWith("http") &&
      !baseUrl.startsWith(ServiceProvider.Alibaba.apiPath)
    ) {
      baseUrl = "https://" + baseUrl;
    }

    logger.debug("[Proxy Endpoint] ", baseUrl, path);

    // 检查是否启用代理
    if (accessStore.alibabaUseProxy) {
      const proxyUrl = getProxyUrl(
        accessStore.alibabaUseProxy,
        accessStore.alibabaProxyUrl,
      );
      const endpoint = [baseUrl, path].join("/");

      // 在 Tauri 环境中，proxyUrl 为空，直接使用原始 URL
      if (!proxyUrl) {
        return endpoint;
      }

      // 在 standalone 模式中，使用代理服务器
      const proxyPath = ServiceProvider.Alibaba.apiPath + "/";
      try {
        const u = new URL(proxyUrl + proxyPath + path);
        u.searchParams.append("endpoint", endpoint);
        return u.toString();
      } catch (e) {
        logger.error("[Alibaba] Failed to build proxy URL:", e);
        return endpoint;
      }
    }

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    // Response API format - check for output field
    if (res.output && Array.isArray(res.output)) {
      // Response API 返回的是 output 数组，提取第一个 message 的内容
      const firstOutput = res.output.find(
        (item: any) => item.type === "message",
      );
      if (firstOutput && firstOutput.content) {
        // 提取文本内容
        const textContent = firstOutput.content
          .filter((item: any) => item.type === "output_text")
          .map((item: any) => item.text)
          .join("");
        return textContent;
      }
      return res.output;
    }
    // 兼容旧格式
    if (res.output) {
      return res.output;
    }
    // OpenAI 兼容格式
    return res?.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const accessStore = useAccessStore.getState();
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    const visionModel = isVisionModel(options.config.model);

    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      const content = (
        visionModel
          ? await preProcessImageContent(v.content)
          : v.role === "assistant"
          ? getMessageTextContentWithoutThinking(v)
          : getMessageTextContent(v)
      ) as any;

      messages.push({ role: v.role, content });
    }

    const shouldStream = !!options.config.stream;

    // Check if using Response API
    const useResponseApi = accessStore.alibabaApiType === "response";

    let requestPayload: any;

    if (useResponseApi) {
      // Response API format - 只发送当前用户输入，通过 conversation_id 维持上下文

      // 1. 提取系统提示词 (instructions)
      let instructions = "";
      const systemMessages = messages.filter((msg) => msg.role === "system");
      if (systemMessages.length > 0) {
        instructions = systemMessages
          .map((msg) =>
            typeof msg.content === "string" ? msg.content : String(msg.content),
          )
          .join("\n");
      }

      // 2. 提取当前用户输入 (input) - 只取最后一个用户消息
      const userMessages = messages.filter((msg) => msg.role === "user");
      const lastUserMessage = userMessages[userMessages.length - 1];
      let input: string | any[];

      if (!lastUserMessage) {
        throw new Error("No user message found for Response API");
      }

      if (typeof lastUserMessage.content === "string") {
        input = lastUserMessage.content;
      } else if (Array.isArray(lastUserMessage.content)) {
        input = lastUserMessage.content;
      } else {
        input = String(lastUserMessage.content);
      }

      // 3. 获取当前会话的 Response API 状态
      const currentSession = useChatStore.getState().currentSession();
      const conversationId = currentSession.responseApiConversationId;

      requestPayload = {
        input,
        model: modelConfig.model,
        ...(instructions && { instructions }), // 只有存在系统提示词时才包含
        temperature: modelConfig.temperature,
        max_output_tokens: Math.max(modelConfig.max_tokens, 1024), // Response API 使用 max_output_tokens
        stream: shouldStream,
        store: true, // 启用状态存储以维持上下文
        ...(conversationId && { conversation_id: conversationId }), // 如果有会话 ID 则包含
      };
    } else {
      // Chat Completions format
      requestPayload = {
        model: modelConfig.model,
        messages,
        stream: shouldStream,
        temperature: modelConfig.temperature,
        top_p: modelConfig.top_p === 1 ? 0.99 : modelConfig.top_p, // qwen top_p is should be < 1
        // max_tokens: modelConfig.max_tokens,
      };

      // 添加 tools 参数（如果有）
      if (options.tools && options.tools.length > 0) {
        requestPayload.tools = options.tools;
      }
    }

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      // Get base headers with the correct provider configuration for testing
      const baseHeaders = getHeaders(false, {
        model: options.config.model,
        providerName: options.config.providerName,
      });

      // OpenAI 兼容模式的 headers
      const headers: Record<string, string> = {
        ...baseHeaders,
        "Content-Type": "application/json",
      };

      // Explicitly ensure Authorization header is set correctly for Alibaba
      if (baseHeaders["Authorization"] && !headers["Authorization"]) {
        headers["Authorization"] = baseHeaders["Authorization"];
      }

      // Determine API path
      let apiPath: string;
      if (accessStore.alibabaApiPath) {
        apiPath = accessStore.alibabaApiPath;
      } else if (useResponseApi) {
        apiPath = Alibaba.ResponsePath;
      } else {
        apiPath = Alibaba.ChatPath;
      }

      const chatPath = this.path(apiPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: headers,
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        getTimeoutMSByModel(options.config.model),
      );

      if (shouldStream) {
        const tools: any[] = options.tools || [];
        const funcs: Record<string, Function> = {};
        registerMcpToolFunctions(tools, funcs);
        const modelCapabilities = getModelCapabilitiesWithCustomConfig(
          options.config.model,
        );
        return streamWithThink(
          chatPath,
          requestPayload,
          headers,
          tools as any,
          funcs,
          controller,
          // parseSSE - OpenAI 兼容格式
          (text: string, runTools: ChatMessageTool[]) => {
            // console.log("parseSSE", text, runTools);
            const json = JSON.parse(text);

            // Handle Response API streaming format
            if (useResponseApi) {
              const delta = json.delta;
              if (!delta) return { isThinking: false, content: "" };

              // 阿里巴巴 Response API 可能包含思考内容
              const reasoning =
                delta.reasoning || delta.reasoning_content || "";
              const content = delta.content || delta.output || "";

              // 如果有思考内容，优先返回思考内容
              if (reasoning && reasoning.length > 0) {
                return {
                  isThinking: true,
                  content: reasoning,
                };
              } else if (content && content.length > 0) {
                return {
                  isThinking: false,
                  content: content,
                };
              }

              return { isThinking: false, content: "" };
            }

            const choices = json.choices as Array<{
              delta: {
                content: string | null;
                tool_calls: ChatMessageTool[];
                reasoning_content: string | null;
              };
            }>;

            if (!choices?.length) return { isThinking: false, content: "" };

            const tool_calls = choices[0]?.delta?.tool_calls;
            if (tool_calls?.length > 0) {
              const id = tool_calls[0]?.id;
              const name = tool_calls[0]?.function?.name;
              const args = tool_calls[0]?.function?.arguments;

              if (id) {
                // 检查是否已经存在相同 id 的工具
                const existingTool = runTools.find((t) => t.id === id);

                if (existingTool) {
                  // 更新现有工具
                  if (existingTool.function) {
                    if (name && !existingTool.function.name) {
                      existingTool.function.name = name;
                    }
                    if (args) {
                      existingTool.function.arguments =
                        (existingTool.function.arguments || "") + args;
                    }
                  }
                } else {
                  // 创建新工具
                  runTools.push({
                    id,
                    type: tool_calls[0]?.type,
                    function: {
                      name: name || "",
                      arguments: args || "",
                    },
                  });
                }
              } else if (args) {
                // 没有 id，累积到最后一个工具
                const lastTool = runTools[runTools.length - 1];
                if (
                  lastTool &&
                  lastTool.function &&
                  lastTool.function.arguments !== undefined
                ) {
                  lastTool.function.arguments += args;
                }
              }
            }

            const reasoning = choices[0]?.delta?.reasoning_content;
            const content = choices[0]?.delta?.content;

            // Skip if both content and reasoning_content are empty or null
            if (
              (!reasoning || reasoning.length === 0) &&
              (!content || content.length === 0)
            ) {
              return {
                isThinking: false,
                content: "",
              };
            }

            if (reasoning && reasoning.length > 0) {
              return {
                isThinking: true,
                content: reasoning,
              };
            } else if (content && content.length > 0) {
              return {
                isThinking: false,
                content: Array.isArray(content)
                  ? content.map((item) => item.text).join(",")
                  : content,
              };
            }

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
            // OpenAI 兼容格式直接使用 messages 数组
            requestPayload?.messages?.splice(
              requestPayload?.messages?.length,
              0,
              toolCallMessage,
              ...toolCallResult,
            );
          },
          options,
          modelCapabilities.reasoning || false, // 传递模型推理能力
        );
      } else {
        const res = await fetch(chatPath, chatPayload, FetchType.LLM);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();

        // For Response API, save the response body for conversation ID extraction
        if (useResponseApi && resJson) {
          (res as any).__responseBody = resJson;
        }

        const message = this.extractMessage(resJson);
        try {
          const debugBody = JSON.parse(chatPayload.body as any);
          (res as any).__requestDebug = {
            url: chatPath,
            method: chatPayload.method,
            headers: chatPayload.headers,
            body: debugBody,
          };
        } catch {}
        options.onFinish(message, res);
      }
    } catch (e) {
      logger.error("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<LLMModel[]> {
    try {
      const modelsPath = this.path("models");
      logger.debug("[Alibaba] Fetching models from:", modelsPath);

      const headers = getHeaders(false, {
        model: "",
        providerName: ServiceProvider.Alibaba.id,
      });
      logger.debug("[Alibaba] Request headers:", headers);

      const response = await fetch(
        modelsPath,
        {
          method: "GET",
          headers,
        },
        FetchType.LLM,
      );

      logger.debug(
        "[Alibaba] Response status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      logger.debug("[Alibaba] Received models count:", data.data?.length || 0);

      // 转换为 LLMModel 格式
      const models: LLMModel[] = (data.data || []).map((model: any) => ({
        name: model.id,
        displayName: model.id,
        available: true,
        provider: {
          id: ServiceProvider.Alibaba.id,
          providerName: ServiceProvider.Alibaba.name,
          providerType: ServiceProvider.Alibaba.id,
          sorted: 4, // 与 DEFAULT_MODELS 中的 sorted 值保持一致
        },
        sorted: 0,
      }));

      logger.debug("[Alibaba] Successfully fetched models:", models.length);
      return models;
    } catch (error) {
      logger.error("[Alibaba] Failed to fetch models:", error);
      return [];
    }
  }
}
export { Alibaba };
