import { ChatMessage } from "../store";
import { logger } from "../utils/logger";

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: any[];
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

/**
 * 统一的客户端 API 调用
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  /**
   * 发送聊天请求
   */
  async chat(request: ChatRequest): Promise<ChatResponse | ReadableStream> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (request.stream) {
        return response.body!;
      } else {
        return await response.json();
      }
    } catch (error) {
      logger.error("[API Client] Chat request failed:", error);
      throw error;
    }
  }

  /**
   * 获取模型列表
   */
  async getModels(provider: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?provider=${provider}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("[API Client] Get models failed:", error);
      throw error;
    }
  }
}

// 默认实例
export const apiClient = new ApiClient();
