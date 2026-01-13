"use client";
// azure and openai, using same models. so using same LLMApi.
import {
  ApiPath,
  OPENAI_BASE_URL,
  DEFAULT_MODELS,
  OpenaiPath,
  Azure,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
} from "@/app/constant";
import {
  ChatMessageTool,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";
import { collectModelsWithDefaultModel } from "@/app/utils/model";
import {
  preProcessImageContent,
  uploadImage,
  base64Image2Blob,
  streamWithThink,
  registerMcpToolFunctions,
} from "@/app/utils/chat";
import { cloudflareAIGatewayUrl } from "@/app/utils/cloudflare";
import { ModelSize, DalleQuality, DalleStyle } from "@/app/typing";
import { getModelCapabilitiesWithCustomConfig } from "@/app/config/model-capabilities";
import { getProxyUrl, FetchType } from "@/app/utils/fetch";

import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  MultimodalContent,
  SpeechOptions,
} from "../api";
import { getClientConfig } from "@/app/config/client";
import {
  getMessageTextContent,
  isVisionModel,
  isDalle3 as _isDalle3,
  getTimeoutMSByModel,
} from "@/app/utils";
import { fetch } from "@/app/utils/fetch";
import { logger } from "@/app/utils/logger";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export interface RequestPayload {
  messages: {
    role: "developer" | "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
  max_tokens?: number;
  max_completion_tokens?: number;
}

export interface DalleRequestPayload {
  model: string;
  prompt: string;
  response_format: "url" | "b64_json";
  n: number;
  size: ModelSize;
  quality: DalleQuality;
  style: DalleStyle;
}

export interface ResponseApiPayload {
  input: string | { type: string; text?: string; image_url?: any }[];
  model: string;
  instructions?: string; // 系统提示词
  temperature?: number;
  max_output_tokens?: number; // Response API 使用 max_output_tokens 而不是 max_tokens
  stream?: boolean;
  store?: boolean;
  conversation_id?: string; // Response API 会话 ID
  previous_response_id?: string; // 上一个响应 ID
}

export class ChatGPTApi implements LLMApi {
  private disableListModels = false;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    const isAzure = path.includes("deployments");

    if (accessStore.useCustomConfig) {
      if (isAzure && !accessStore.isValidAzure()) {
        throw Error(
          "incomplete azure config, please check it in your settings page",
        );
      }

      baseUrl = isAzure ? accessStore.azureUrl : accessStore.openaiUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      const apiPath = isAzure ? ApiPath.Azure : ApiPath.OpenAI;
      baseUrl = isApp ? OPENAI_BASE_URL : apiPath;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (
      !baseUrl.startsWith("http") &&
      !isAzure &&
      !baseUrl.startsWith(ApiPath.OpenAI)
    ) {
      baseUrl = "https://" + baseUrl;
    }

    // 检查是否启用代理
    const useProxy = isAzure
      ? accessStore.azureUseProxy
      : accessStore.openaiUseProxy;

    if (useProxy) {
      // 使用代理模式，支持 Tauri 和 standalone 模式
      const configuredProxyUrl = isAzure
        ? accessStore.azureProxyUrl
        : accessStore.openaiProxyUrl;
      const proxyUrl = getProxyUrl(useProxy, configuredProxyUrl);
      const endpoint = [baseUrl, path].join("/");

      // 在 Tauri 环境中，proxyUrl 为空，直接使用原始 URL
      // stream_fetch 命令会在 Rust 后端处理请求
      if (!proxyUrl) {
        return cloudflareAIGatewayUrl(endpoint);
      }

      // 在 standalone 模式中，使用代理服务器
      const proxyPath = isAzure ? "/api/azure/" : "/api/openai/";
      try {
        const u = new URL(proxyUrl + proxyPath + path);
        u.searchParams.append("endpoint", endpoint);
        return cloudflareAIGatewayUrl(u.toString());
      } catch (e) {
        logger.error("[OpenAI] Failed to build proxy URL:", e);
        // 如果代理URL构建失败，回退到直接URL
        return cloudflareAIGatewayUrl(endpoint);
      }
    }

    const finalUrl = cloudflareAIGatewayUrl([baseUrl, path].join("/"));

    return finalUrl;
  }

  async extractMessage(res: any) {
    if (res.error) {
      return "```\n" + JSON.stringify(res, null, 4) + "\n```";
    }
    // dalle3 model return url, using url create image message
    if (res.data) {
      let url = res.data?.at(0)?.url ?? "";
      const b64_json = res.data?.at(0)?.b64_json ?? "";
      if (!url && b64_json) {
        // uploadImage
        url = await uploadImage(base64Image2Blob(b64_json, "image/png"));
      }
      return [
        {
          type: "image_url",
          image_url: {
            url,
          },
        },
      ];
    }
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
    return res.choices?.at(0)?.message?.content ?? res;
  }

  // 专门用于 TTS 的 headers 函数，确保始终使用 OpenAI 配置
  private getTTSHeaders(): Record<string, string> {
    const accessStore = useAccessStore.getState();

    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // 强制使用 OpenAI 配置，不受当前会话模型影响
    const openaiApiKey = accessStore.openaiApiKey;

    if (openaiApiKey && openaiApiKey.length > 0) {
      headers["Authorization"] = `Bearer ${openaiApiKey.trim()}`;
    } else {
      // 如果没有 OpenAI API Key，尝试使用访问码
      if (accessStore.enabledAccessControl() && accessStore.accessCode) {
        headers["Authorization"] = `Bearer nk-${accessStore.accessCode}`;
      }
    }

    return headers;
  }

  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    const requestPayload = {
      model: options.model,
      input: options.input,
      voice: options.voice,
      response_format: options.response_format,
      speed: options.speed,
    };

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const speechPath = this.path(OpenaiPath.SpeechPath);

      // 使用专门的 TTS headers 函数，确保使用 OpenAI 配置
      const headers = this.getTTSHeaders();

      const speechPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: headers,
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const res = await fetch(speechPath, speechPayload, FetchType.LLM);
      clearTimeout(requestTimeoutId);
      return await res.arrayBuffer();
    } catch (e) {
      throw e;
    }
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

    let requestPayload:
      | RequestPayload
      | DalleRequestPayload
      | ResponseApiPayload;

    const isDalle3 = _isDalle3(options.config.model);
    const isO1OrO3 =
      options.config.model.startsWith("o1") ||
      options.config.model.startsWith("o3") ||
      options.config.model.startsWith("o4-mini");

    // Check if using Response API
    const useResponseApi =
      modelConfig.providerName === ServiceProvider.OpenAI &&
      accessStore.openaiApiType === "response";

    if (isDalle3) {
      const prompt = getMessageTextContent(
        options.messages.slice(-1)?.pop() as any,
      );
      requestPayload = {
        model: options.config.model,
        prompt,
        // URLs are only valid for 60 minutes after the image has been generated.
        response_format: "b64_json", // using b64_json, and save image in CacheStorage
        n: 1,
        size: options.config?.size ?? "1024x1024",
        quality: options.config?.quality ?? "standard",
        style: options.config?.style ?? "vivid",
      };
    } else {
      const visionModel = isVisionModel(options.config.model);
      const messages: ChatOptions["messages"] = [];
      for (const v of options.messages) {
        const content = visionModel
          ? await preProcessImageContent(v.content)
          : getMessageTextContent(v);
        if (!(isO1OrO3 && v.role === "system"))
          messages.push({ role: v.role, content });
      }

      if (useResponseApi) {
        // Response API format - 只发送当前用户输入，通过 conversation_id 维持上下文

        // 1. 提取系统提示词 (instructions)
        let instructions = "";
        const systemMessages = messages.filter((msg) => msg.role === "system");
        if (systemMessages.length > 0) {
          instructions = systemMessages
            .map((msg) =>
              typeof msg.content === "string"
                ? msg.content
                : String(msg.content),
            )
            .join("\n");
        }

        // 2. 提取当前用户输入 (input) - 只取最后一个用户消息
        const userMessages = messages.filter((msg) => msg.role === "user");
        const lastUserMessage = userMessages[userMessages.length - 1];
        let input: string | { type: string; text?: string; image_url?: any }[];

        if (!lastUserMessage) {
          throw new Error("No user message found for Response API");
        }

        if (typeof lastUserMessage.content === "string") {
          input = lastUserMessage.content;
        } else if (Array.isArray(lastUserMessage.content)) {
          // Multimodal content
          input = lastUserMessage.content.map((item: any) => {
            if (item.type === "text") {
              return { type: "text", text: item.text };
            } else if (item.type === "image_url") {
              return { type: "image_url", image_url: item.image_url };
            }
            return item;
          });
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
          stream: options.config.stream,
          store: true, // 启用状态存储以维持上下文
          ...(conversationId && { conversation_id: conversationId }), // 如果有会话 ID 则包含
        } as ResponseApiPayload;
      } else {
        // O1 not support image, tools (plugin in ChatGPTNextWeb) and system, stream, logprobs, temperature, top_p, n, presence_penalty, frequency_penalty yet.
        requestPayload = {
          messages,
          stream: options.config.stream,
          model: modelConfig.model,
          temperature: !isO1OrO3 ? modelConfig.temperature : 1,
          presence_penalty: !isO1OrO3 ? modelConfig.presence_penalty : 0,
          frequency_penalty: !isO1OrO3 ? modelConfig.frequency_penalty : 0,
          top_p: !isO1OrO3 ? modelConfig.top_p : 1,
          // max_tokens: Math.max(modelConfig.max_tokens, 1024),
          // Please do not ask me why not send max_tokens, no reason, this param is just shit, I dont want to explain anymore.
        };

        if (isO1OrO3) {
          // by default the o1/o3 models will not attempt to produce output that includes markdown formatting
          // manually add "Formatting re-enabled" developer message to encourage markdown inclusion in model responses
          // (https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/reasoning?tabs=python-secure#markdown-output)
          requestPayload["messages"].unshift({
            role: "developer",
            content: "Formatting re-enabled",
          });

          // o1/o3 uses max_completion_tokens to control the number of tokens (https://platform.openai.com/docs/guides/reasoning#controlling-costs)
          requestPayload["max_completion_tokens"] = modelConfig.max_tokens;
        }

        // add max_tokens to vision model
        if (visionModel && !isO1OrO3) {
          requestPayload["max_tokens"] = Math.max(modelConfig.max_tokens, 4000);
        }
      }
    }

    const shouldStream = !isDalle3 && !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      let chatPath = "";
      if (modelConfig.providerName === ServiceProvider.Azure) {
        // find model, and get displayName as deployName
        const { models: configModels, customModels: configCustomModels } =
          useAppConfig.getState();
        const {
          defaultModel,
          customModels: accessCustomModels,
          useCustomConfig,
        } = useAccessStore.getState();
        const models = collectModelsWithDefaultModel(
          configModels,
          [configCustomModels, accessCustomModels].join(","),
          defaultModel,
        );
        const model = models.find(
          (model) =>
            model.name === modelConfig.model &&
            model?.provider?.providerName === ServiceProvider.Azure,
        );
        chatPath = this.path(
          (isDalle3 ? Azure.ImagePath : Azure.ChatPath)(
            (model?.displayName ?? model?.name) as string,
            useCustomConfig ? useAccessStore.getState().azureApiVersion : "",
          ),
        );
      } else {
        // Determine the API path based on configuration
        let apiPath: string;

        // Check if user has custom API path
        if (accessStore.openaiApiPath) {
          apiPath = accessStore.openaiApiPath;
        } else if (isDalle3) {
          apiPath = OpenaiPath.ImagePath;
        } else if (useResponseApi) {
          apiPath = OpenaiPath.ResponsePath;
        } else {
          apiPath = OpenaiPath.ChatPath;
        }

        chatPath = this.path(apiPath);
      }
      if (shouldStream) {
        let index = -1;
        const tools: any[] = options.tools || [];
        const funcs: Record<string, Function> = {};

        // 为 MCP 工具注册处理函数
        registerMcpToolFunctions(tools, funcs);

        const modelCapabilities = getModelCapabilitiesWithCustomConfig(
          options.config.model,
        );
        streamWithThink(
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
            const json = JSON.parse(text);

            // Handle Response API streaming format
            if (useResponseApi) {
              // Response API 流式响应格式不同，需要检查不同的字段

              // 检查是否有 output 数组
              if (json.output && Array.isArray(json.output)) {
                const messageOutput = json.output.find(
                  (item: any) => item.type === "message",
                );
                if (messageOutput && messageOutput.content) {
                  const textContent = messageOutput.content
                    .filter((item: any) => item.type === "output_text")
                    .map((item: any) => item.text)
                    .join("");

                  if (textContent) {
                    return {
                      isThinking: false,
                      content: textContent,
                    };
                  }
                }
              }

              // 检查是否有 reasoning 信息
              if (json.reasoning && json.reasoning.summary) {
                return {
                  isThinking: true,
                  content: json.reasoning.summary,
                };
              }

              // 检查 delta 字段（兼容性处理）
              const delta = json.delta;
              if (delta) {
                const reasoning =
                  delta.reasoning || delta.reasoning_content || "";
                const content = delta.content || delta.output || "";

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
              }

              return { isThinking: false, content: "" };
            }

            // Handle Chat Completions API streaming format
            const choices = json.choices as Array<{
              delta: {
                content: string;
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
                  index += 1;
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
                // 优先使用 index，但如果 index 无效则使用最后一个工具
                let targetTool = null;
                if (
                  typeof tool_calls[0]?.index === "number" &&
                  runTools[tool_calls[0].index]
                ) {
                  targetTool = runTools[tool_calls[0].index];
                } else {
                  targetTool = runTools[runTools.length - 1];
                }

                if (
                  targetTool &&
                  targetTool.function &&
                  targetTool.function.arguments !== undefined
                ) {
                  targetTool.function.arguments += args;
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
            // reset index value
            index = -1;
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

        const res = await fetch(chatPath, chatPayload, FetchType.LLM);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();

        // For Response API, save the response body for conversation ID extraction
        if (useResponseApi && resJson) {
          (res as any).__responseBody = resJson;
        }

        const message = await this.extractMessage(resJson);
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
      options.onError?.(e as Error);
    }
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    const accessStore = useAccessStore.getState();
    const apiKey = accessStore.openaiApiKey;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(
      this.path(OpenaiPath.ListModelPath),
      {
        method: "GET",
        headers,
      },
      FetchType.LLM,
    );

    if (!res.ok) {
      const resJson = await res.json();
      const errMessage = resJson.error?.message ?? res.statusText;
      throw new Error(
        `Failed to list models, status: ${res.status}, message: ${errMessage}`,
      );
    }

    const resJson = (await res.json()) as OpenAIListModelResponse;
    const chatModels = resJson.data;

    if (!chatModels) {
      return [];
    }

    //由于目前 OpenAI 的 disableListModels 默认为 true，所以当前实际不会运行到这场
    let seq = 1000; //同 Constant.ts 中的排序保持一致
    return chatModels.map((m) => ({
      name: m.id,
      available: true,
      sorted: seq++,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
        sorted: 1,
      },
    }));
  }
}
export { OpenaiPath };
