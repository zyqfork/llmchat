import { DEFAULT_MODELS } from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";
import { ChatOptions, LLMApi, LLMModel, LLMUsage } from "../api";
import { GoogleGenAI } from "@google/genai";
import {
  isWebSearchModel,
  getModelCapabilitiesWithCustomConfig,
} from "@/app/config/model-capabilities";
import { getMessageTextContent, getMessageImages } from "@/app/utils";

export class GoogleGenAIApi implements LLMApi {
  private client: GoogleGenAI | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const accessStore = useAccessStore.getState();

    // 获取 API 配置
    const apiKey = accessStore.googleApiKey;
    const customUrl = accessStore.useCustomConfig
      ? accessStore.googleUrl
      : null;

    if (!apiKey) {
      return;
    }

    try {
      const clientConfig: any = { apiKey };

      // 如果有自定义 URL，添加到配置中
      if (customUrl) {
        clientConfig.httpOptions = { baseUrl: customUrl };
      }

      this.client = new GoogleGenAI(clientConfig);
    } catch (error) {}
  }

  async chat(options: ChatOptions): Promise<void> {
    if (!this.client) {
      this.initializeClient();
      if (!this.client) {
        throw new Error("Failed to initialize Google GenAI client");
      }
    }

    const messages = options.messages
      .filter((v) => v.role === "user" || v.role === "assistant") // 只保留有效角色
      .map((v) => {
        const textContent = getMessageTextContent(v);
        const images = getMessageImages(v);

        return {
          role: v.role === "assistant" ? "model" : "user", // 确保只有 user 和 model 角色
          parts: [
            // 只有当文本内容不为空时才添加text part
            ...(textContent && textContent.trim()
              ? [
                  {
                    text: textContent,
                  },
                ]
              : []),
            // 添加图片
            ...images.map((image) => ({
              inlineData: {
                mimeType: image.split(";")[0].split(":")[1],
                data: image.split(",")[1],
              },
            })),
          ],
        };
      })
      .filter((msg) => msg.parts.length > 0); // 只保留有内容的消息

    // 获取模型配置，并且明确排除思考相关的参数
    const { thinkingBudget, ...cleanModelConfig } = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    // 检查是否是图像模型，如果是，使用清理后的配置
    const isImageModel = options.config.model.includes("image");
    const modelConfig = isImageModel
      ? cleanModelConfig
      : {
          ...useAppConfig.getState().modelConfig,
          ...useChatStore.getState().currentSession().mask.modelConfig,
          ...{
            model: options.config.model,
          },
        };

    // 检查是否启用搜索功能
    const session = useChatStore.getState().currentSession();
    const enableWebSearch = session.searchEnabled ?? false;
    const isSearchModel = isWebSearchModel(options.config.model);

    // 检查模型能力
    const modelCapabilities = getModelCapabilitiesWithCustomConfig(
      options.config.model,
    );

    // 配置工具
    const tools: any[] = [];
    if (enableWebSearch && isSearchModel) {
      if (options.config.model.includes("gemini-1.5")) {
        // Gemini 1.5 使用 googleSearchRetrieval
        tools.push({
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.7,
            },
          },
        });
      } else {
        // Gemini 2.x 使用 googleSearch
        tools.push({
          googleSearch: {},
        });
      }
    }

    // 安全设置
    const safetySettings = [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ];

    // 生成配置
    const config: any = {
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.max_tokens,
      topP: modelConfig.top_p,
      safetySettings,
      // 如果启用搜索，使用推荐的温度设置
      ...(enableWebSearch &&
        tools.length > 0 && {
          temperature: 1.0,
        }),
      ...(tools.length > 0 && { tools }),
    };

    // 如果模型具有推理能力且是Gemini类型，且不是图像模型，添加思考配置
    if (
      modelCapabilities.reasoning &&
      modelCapabilities.thinkingType === "gemini" &&
      !options.config.model.includes("image")
    ) {
      const thinkingBudget = modelConfig.thinkingBudget ?? -1;

      // 构建thinking配置
      const thinkingConfig: any = {
        includeThoughts: true, // 包含思考内容
      };

      // 只有当thinkingBudget不为undefined时才添加
      if (thinkingBudget !== undefined) {
        thinkingConfig.thinkingBudget = thinkingBudget;
      }

      config.thinkingConfig = thinkingConfig;
    }

    try {
      // 使用 models.generateContentStream 进行流式生成

      // 确保config中没有任何思考相关的参数
      const {
        thinkingConfig,
        includeThoughts,
        thinkingBudget: configThinkingBudget,
        ...cleanConfig
      } = config;
      const finalConfig = isImageModel ? cleanConfig : config;

      const response = await this.client.models.generateContentStream({
        model: options.config.model,
        contents: messages,
        config: finalConfig,
      });

      let responseText = "";
      let isInThinkingMode = false;

      for await (const chunk of response) {
        // 处理思考内容和普通内容
        if (chunk.candidates && chunk.candidates.length > 0) {
          const candidate = chunk.candidates[0];
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.thought && part.text) {
                // 这是思考内容 - 直接使用 <think> 标签包装

                // 如果刚进入思考模式，添加开始标签
                if (!isInThinkingMode) {
                  isInThinkingMode = true;
                  if (responseText.length > 0) {
                    responseText += "\n";
                  }
                  responseText += "<think>\n" + part.text;
                } else {
                  // 继续添加思考内容
                  responseText += part.text;
                }

                options.onUpdate?.(responseText, part.text);
              } else if (part.text && !part.thought) {
                // 这是普通内容（包括markdown格式的图片）

                // 如果从思考模式切换到普通模式，添加结束标签和分隔符
                if (isInThinkingMode) {
                  isInThinkingMode = false;
                  responseText += "\n</think>\n\n";
                }

                responseText += part.text;
                options.onUpdate?.(responseText, part.text);
              }
            }
          }
        }

        // 备用方案：如果没有找到 candidates，使用 chunk.text
        if (!chunk.candidates && chunk.text) {
          responseText += chunk.text;
          options.onUpdate?.(responseText, chunk.text);
        }

        // 处理可能的图片数据（备用方案）
        if (chunk.inlineData) {
          const { mimeType, data } = chunk.inlineData;
          const base64Image = `data:${mimeType};base64,${data}`;
          responseText += `![Generated Image](${base64Image})\n`;
          options.onUpdate?.(
            responseText,
            `![Generated Image](${base64Image})\n`,
          );
        }
      }

      // 如果流结束时还在思考模式，添加结束标签
      if (isInThinkingMode) {
        responseText += "\n</think>";
      }
      // 创建一个模拟的 Response 对象
      const mockResponse = new Response(responseText, { status: 200 });
      options.onFinish(responseText, mockResponse);
    } catch (error) {
      options.onError?.(error as Error);
    }
  }

  usage(): Promise<LLMUsage> {
    throw new Error("Method not implemented.");
  }

  async models(): Promise<LLMModel[]> {
    try {
      if (!this.client) {
        this.initializeClient();
        if (!this.client) {
          throw new Error("Failed to initialize Google GenAI client");
        }
      }
      const response = await this.client.models.list();
      let models: LLMModel[] = [];
      for await (const model of response) {
        if (!model.name) continue;
        const modelName = model.name.replace("models/", "");
        models.push({
          name: modelName,
          displayName: model.displayName,
          available: true,
          provider: {
            id: "google",
            providerName: "Google",
            providerType: "google",
            sorted: 1,
          },
          sorted: 1,
          contextTokens: model.inputTokenLimit,
        });
      }
      // if list models is empty, return default models
      if (models.length === 0) {
        return DEFAULT_MODELS.filter(
          (m) => m.provider.providerName === "Google",
        );
      }
      return models;
    } catch (e) {
      return DEFAULT_MODELS.filter((m) => m.name.startsWith("gemini"));
    }
  }

  async speech(_options: any): Promise<ArrayBuffer> {
    throw new Error("Speech generation not implemented for GoogleGenAI");
  }
}
