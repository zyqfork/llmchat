"use client";
import { ApiPath, Ollama, DEFAULT_MODELS } from "@/app/constant";
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  ChatMessageTool,
} from "@/app/store";
import { preProcessImageContent } from "@/app/utils/chat";
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  SpeechOptions,
} from "../api";
import { getClientConfig } from "@/app/config/client";
import { getMessageTextContent, isVisionModel } from "@/app/utils";

import { fetch } from "@/app/utils/stream";
import { getProxyUrl } from "@/app/utils/tauri-proxy";

export interface OllamaListModelResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: {
      format?: string;
      family?: string;
      families?: string[];
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
}

export interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
    images?: string[];
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

export class OllamaApi implements LLMApi {
  private disableListModels = false;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.ollamaUrl;
    }

    if (baseUrl.length === 0) {
      baseUrl = "http://localhost:11434";
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http")) {
      baseUrl = "http://" + baseUrl;
    }

    console.log("[Ollama Endpoint] ", baseUrl, path);

    // 检查是否启用代理
    if (accessStore.ollamaUseProxy) {
      const proxyUrl = getProxyUrl(
        accessStore.ollamaUseProxy,
        accessStore.ollamaProxyUrl,
      );
      const endpoint = [baseUrl, path].join("/");
      const proxyPath = "/api/ollama/";

      try {
        const u = new URL(proxyUrl + proxyPath + path);
        u.searchParams.append("endpoint", endpoint);
        return u.toString();
      } catch (e) {
        console.error("[Ollama] Failed to build proxy URL:", e);
        return [baseUrl, path].join("/");
      }
    }

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const visionModel = isVisionModel(options.config.model);
    const messages: OllamaChatRequest["messages"] = [];

    for (const v of options.messages) {
      const content = visionModel
        ? await preProcessImageContent(v.content)
        : getMessageTextContent(v);

      messages.push({
        role: v.role,
        content:
          typeof content === "string" ? content : JSON.stringify(content),
      });
    }

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    const requestPayload: OllamaChatRequest = {
      model: modelConfig.model,
      messages,
      stream: options.config.stream,
      options: {
        temperature: modelConfig.temperature,
        top_p: modelConfig.top_p,
        num_predict: modelConfig.max_tokens,
      },
    };

    console.log("[Request] ollama payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(Ollama.ChatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        60000, // 60 seconds timeout
      );

      if (shouldStream) {
        let responseText = "";
        let finished = false;

        const finish = () => {
          if (!finished) {
            finished = true;
            options.onFinish(responseText, {
              ok: true,
              status: 200,
            } as Response);
          }
        };

        controller.signal.onabort = finish;

        const response = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          options.onError?.(new Error(`Ollama API error: ${errorText}`));
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          options.onError?.(new Error("No response body"));
          return;
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const json = JSON.parse(line);

              if (json.message?.content) {
                const content = json.message.content;
                responseText += content;
                options.onUpdate?.(responseText, content);
              }

              if (json.done) {
                finish();
                return;
              }
            } catch (e) {
              console.error("[Ollama] Failed to parse line:", line, e);
            }
          }
        }

        finish();
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);

        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
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

    try {
      const res = await fetch(this.path("api/tags"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error(
          "[Ollama Models] Failed to fetch models:",
          res.statusText,
        );
        return [];
      }

      const resJson = (await res.json()) as OllamaListModelResponse;
      const models = resJson.models;
      console.log("[Ollama Models]", models);

      if (!models || models.length === 0) {
        return [];
      }

      let seq = 1000;
      return models.map((m) => ({
        name: m.name,
        displayName: m.name,
        available: true,
        sorted: seq++,
        provider: {
          id: "ollama",
          providerName: "Ollama",
          providerType: "ollama",
          sorted: 15,
        },
      }));
    } catch (e) {
      console.error("[Ollama Models] Error fetching models:", e);
      return [];
    }
  }
}
