"use client";
// azure and openai, using same models. so using same LLMApi.
import { DEFAULT_MODELS, ServiceProvider } from "@/app/constant";

// SiliconFlow API endpoints
const SiliconFlow = {
  ChatPath: "chat/completions",
  ResponsePath: "responses",
  ListModelPath: "models",
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
} from "../api";
import { getClientConfig } from "@/app/config/client";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  isVisionModel,
  getTimeoutMSByModel,
} from "@/app/utils";
import { getModelCapabilitiesWithCustomConfig } from "@/app/config/model-capabilities";
import { RequestPayload } from "./openai";

import { fetch, getProxyUrl, FetchType } from "@/app/utils/fetch";
import { logger } from "@/app/utils/logger";
export interface SiliconFlowListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export class SiliconflowApi implements LLMApi {
  private disableListModels = false;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.siliconflowUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp
        ? ServiceProvider.SiliconFlow.defaultBaseUrl
        : ServiceProvider.SiliconFlow.apiPath;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (
      !baseUrl.startsWith("http") &&
      !baseUrl.startsWith(ServiceProvider.SiliconFlow.apiPath)
    ) {
      baseUrl = "https://" + baseUrl;
    }

    logger.debug("[Proxy Endpoint] ", baseUrl, path);

    // 检查是否启用代理
    if (accessStore.siliconflowUseProxy) {
      const proxyUrl = getProxyUrl(
        accessStore.siliconflowUseProxy,
        accessStore.siliconflowProxyUrl,
      );
      const endpoint = [baseUrl, path].join("/");

      // 在 Tauri 环境中，proxyUrl 为空，直接使用原始 URL
      if (!proxyUrl) {
        return endpoint;
      }

      // 在 standalone 模式中，使用代理服务器
      const proxyPath = "/api/siliconflow/";
      try {
        const u = new URL(proxyUrl + proxyPath + path);
        u.searchParams.append("endpoint", endpoint);
        return u.toString();
      } catch (e) {
        logger.error("[SiliconFlow] Failed to build proxy URL:", e);
        return endpoint;
      }
    }

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    // Response API format
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
    if (res.output) {
      return res.output;
    }
    return res.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const visionModel = isVisionModel(options.config.model);
    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      if (v.role === "assistant") {
        const content = getMessageTextContentWithoutThinking(v);
        messages.push({ role: v.role, content });
      } else {
        const content = visionModel
          ? await preProcessImageContent(v.content)
          : getMessageTextContent(v);
        messages.push({ role: v.role, content });
      }
    }

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    const requestPayload: RequestPayload = {
      messages,
      stream: options.config.stream,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
      // max_tokens: Math.max(modelConfig.max_tokens, 1024),
      // Please do not ask me why not send max_tokens, no reason, this param is just shit, I dont want to explain anymore.
    };

    logger.debug("[Request] openai payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    // Check if using Response API
    const accessStore = useAccessStore.getState();
    const useResponseApi = accessStore.siliconflowApiType === "response";

    let finalRequestPayload: any;
    let apiPath: string;

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

      finalRequestPayload = {
        input,
        model: modelConfig.model,
        ...(instructions && { instructions }), // 只有存在系统提示词时才包含
        temperature: modelConfig.temperature,
        max_output_tokens: Math.max(modelConfig.max_tokens, 1024), // Response API 使用 max_output_tokens
        stream: options.config.stream,
        store: true, // 启用状态存储以维持上下文
        ...(conversationId && { conversation_id: conversationId }), // 如果有会话 ID 则包含
      };

      // Use custom API path if provided, otherwise use default Response API path
      apiPath = accessStore.siliconflowApiPath || SiliconFlow.ResponsePath;
    } else {
      finalRequestPayload = requestPayload;
      apiPath = accessStore.siliconflowApiPath || SiliconFlow.ChatPath;
    }

    try {
      const chatPath = this.path(apiPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(finalRequestPayload),
        signal: controller.signal,
        headers: getHeaders(false, {
          model: options.config.model,
          providerName: options.config.providerName,
        }),
      };

      // console.log(chatPayload);

      // Use extended timeout for thinking models as they typically require more processing time
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
          finalRequestPayload,
          getHeaders(false, {
            model: options.config.model,
            providerName: options.config.providerName,
          }),
          tools as any,
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
            // console.log("parseSSE", text, runTools);
            const json = JSON.parse(text);

            // Handle Response API streaming format
            if (useResponseApi) {
              const delta = json.delta;
              if (!delta) return { isThinking: false, content: "" };

              // SiliconFlow Response API 可能包含思考内容
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

            // Handle Chat Completions API streaming format
            const choices = json.choices as Array<{
              delta: {
                content: string | null;
                tool_calls: ChatMessageTool[];
                reasoning_content: string | null;
              };
            }>;
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
          },
          // processToolMessage, include tool_calls message and tool call results
          (
            requestPayload: RequestPayload,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            // @ts-ignore
            requestPayload?.messages?.splice(
              // @ts-ignore
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
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    const res = await fetch(
      this.path(SiliconFlow.ListModelPath),
      {
        method: "GET",
        headers: {
          ...getHeaders(false, {
            providerName: "SiliconFlow",
          }),
        },
      },
      FetchType.LLM,
    );

    const resJson = (await res.json()) as SiliconFlowListModelResponse;
    const chatModels = resJson.data;
    logger.debug("[Models]", chatModels);

    if (!chatModels) {
      return [];
    }

    let seq = 1000; //同 Constant.ts 中的排序保持一致
    return chatModels.map((m) => ({
      name: m.id,
      available: true,
      sorted: seq++,
      provider: {
        id: "siliconflow",
        providerName: "SiliconFlow",
        providerType: "siliconflow",
        sorted: 14,
      },
    }));
  }
}
