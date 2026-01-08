"use client";
import { ApiPath, ByteDance, BYTEDANCE_BASE_URL } from "@/app/constant";
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  ChatMessageTool,
} from "@/app/store";

import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  MultimodalContent,
  SpeechOptions,
} from "../api";

import { streamWithThink, registerMcpToolFunctions } from "@/app/utils/chat";
import { getClientConfig } from "@/app/config/client";
import { preProcessImageContent } from "@/app/utils/chat";
import {
  getMessageTextContentWithoutThinking,
  getTimeoutMSByModel,
} from "@/app/utils";
import { fetch, getProxyUrl, FetchType } from "@/app/utils/fetch";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

interface RequestPayloadForByteDance {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
  max_tokens?: number;
}

export class DoubaoApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    // 优先使用用户设置的 URL，即使 useCustomConfig 为 false
    if (accessStore.bytedanceUrl && accessStore.bytedanceUrl.length > 0) {
      baseUrl = accessStore.bytedanceUrl;
    } else if (accessStore.useCustomConfig) {
      baseUrl = accessStore.bytedanceUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      // 使用新的默认值，包含 /api/v3
      baseUrl = isApp
        ? "https://ark.cn-beijing.volces.com/api/v3"
        : ApiPath.ByteDance;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.ByteDance)) {
      baseUrl = "https://" + baseUrl;
    }

    // 确保 path 不以 / 开头，避免双斜杠
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    console.log("[Proxy Endpoint] ", baseUrl, cleanPath);

    // 检查是否启用代理
    if (accessStore.bytedanceUseProxy) {
      const proxyUrl = getProxyUrl(
        accessStore.bytedanceUseProxy,
        accessStore.bytedanceProxyUrl,
      );
      const endpoint = `${baseUrl}/${cleanPath}`;

      // 在 Tauri 环境中，proxyUrl 为空，直接使用原始 URL
      if (!proxyUrl) {
        return endpoint;
      }

      // 在 standalone 模式中，使用代理服务器
      const proxyPath = "/api/bytedance/";
      try {
        const u = new URL(proxyUrl + proxyPath + cleanPath);
        u.searchParams.append("endpoint", endpoint);
        return u.toString();
      } catch (e) {
        console.error("[ByteDance] Failed to build proxy URL:", e);
        return endpoint;
      }
    }

    return `${baseUrl}/${cleanPath}`;
  }

  extractMessage(res: any) {
    // Response API format - 支持多种可能的响应格式
    if (res.output) {
      // 字节跳动 Response API 非流式响应
      return typeof res.output === "string"
        ? res.output
        : JSON.stringify(res.output);
    }
    if (res.data?.output) {
      // 嵌套的 output 字段
      return typeof res.data.output === "string"
        ? res.data.output
        : JSON.stringify(res.data.output);
    }
    // Chat Completions API 格式
    if (res.choices?.at(0)?.message?.content) {
      return res.choices.at(0).message.content;
    }
    // 如果都没有，尝试返回整个响应的字符串表示（用于调试）
    console.warn("[ByteDance] Unexpected response format:", res);
    return "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const accessStore = useAccessStore.getState();
    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      const content =
        v.role === "assistant"
          ? getMessageTextContentWithoutThinking(v)
          : await preProcessImageContent(v.content);
      messages.push({ role: v.role, content });
    }

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    const shouldStream = !!options.config.stream;
    const useResponseApi = accessStore.bytedanceApiType === "response";

    let requestPayload: any;

    if (useResponseApi) {
      const lastMessage = messages[messages.length - 1];
      const input =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : String(lastMessage.content);

      // 字节跳动 Response API 不支持 max_tokens 字段
      requestPayload = {
        input,
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        stream: shouldStream,
        store: false,
      };
    } else {
      requestPayload = {
        messages,
        stream: shouldStream,
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        presence_penalty: modelConfig.presence_penalty,
        frequency_penalty: modelConfig.frequency_penalty,
        top_p: modelConfig.top_p,
      };
    }

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      // Determine API path
      let apiPath: string;
      if (accessStore.bytedanceApiPath) {
        apiPath = accessStore.bytedanceApiPath;
      } else if (useResponseApi) {
        apiPath = ByteDance.ResponsePath;
      } else {
        apiPath = ByteDance.ChatPath;
      }

      const chatPath = this.path(apiPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(false, {
          model: options.config.model,
          providerName: options.config.providerName,
        }),
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
        return streamWithThink(
          chatPath,
          requestPayload,
          getHeaders(false, {
            model: options.config.model,
            providerName: options.config.providerName,
          }),
          tools as any,
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
            try {
              const json = JSON.parse(text);

              // Handle Response API streaming format
              if (useResponseApi) {
                // 字节跳动 Response API 使用事件驱动的 SSE 格式
                // 事件类型包括：
                // - response.output_text.delta: 实际输出内容的增量
                // - response.reasoning_summary_text.delta: 推理内容的增量
                // - response.output_text.done: 输出完成，包含完整文本

                const eventType = json.type;

                // 处理实际输出内容的增量
                if (eventType === "response.output_text.delta") {
                  const delta = json.delta || "";
                  if (delta) {
                    return {
                      isThinking: false,
                      content: delta,
                    };
                  }
                }

                // 处理推理内容的增量（可选，用于显示思考过程）
                if (eventType === "response.reasoning_summary_text.delta") {
                  const delta = json.delta || "";
                  if (delta) {
                    // 推理内容可以作为思考过程显示，或者忽略
                    // 这里我们选择忽略推理内容，只显示最终输出
                    return { isThinking: false, content: "" };
                  }
                }

                // 处理输出完成事件（包含完整文本）
                if (eventType === "response.output_text.done") {
                  const text = json.text || "";
                  if (text) {
                    return {
                      isThinking: false,
                      content: text,
                    };
                  }
                }

                // 处理其他事件类型（如 response.created, response.in_progress 等）
                // 这些事件不包含内容，返回空
                if (eventType && eventType.startsWith("response.")) {
                  return { isThinking: false, content: "" };
                }

                // 兼容其他可能的格式
                if (json.delta) {
                  const content =
                    json.delta.output || json.delta.content || json.delta || "";
                  if (content) {
                    return {
                      isThinking: false,
                      content: content,
                    };
                  }
                }

                // 如果没有找到内容，返回空（可能是结束标记或其他元数据）
                return { isThinking: false, content: "" };
              }

              // Handle Chat Completions API streaming format
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
                const index = tool_calls[0]?.index;
                const id = tool_calls[0]?.id;
                const args = tool_calls[0]?.function?.arguments;
                const name = tool_calls[0]?.function?.name;

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
                  // 累积参数到对应的工具
                  if (typeof index === "number" && runTools[index]) {
                    const tool = runTools[index];
                    if (
                      tool &&
                      tool.function &&
                      tool.function.arguments !== undefined
                    ) {
                      tool.function.arguments += args;
                    }
                  } else {
                    // 如果没有 index，累积到最后一个工具
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
                  content: content,
                };
              }

              return {
                isThinking: false,
                content: "",
              };
            } catch (e) {
              // JSON 解析失败或其他错误
              console.error("[ByteDance] Failed to parse SSE chunk:", e, text);
              return { isThinking: false, content: "" };
            }
          },
          // processToolMessage, include tool_calls message and tool call results
          (
            requestPayload: RequestPayloadForByteDance,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            requestPayload?.messages?.splice(
              requestPayload?.messages?.length,
              0,
              toolCallMessage,
              ...toolCallResult,
            );
          },
          options,
        );
      } else {
        const res = await fetch(chatPath, chatPayload, FetchType.LLM);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
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
      console.error("Failed to make a chat request", e);
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
    return [];
  }
}
export { ByteDance };
