import { unifiedChat, UnifiedChatOptions } from "./unified-api";
import {
  ChatOptions,
  LLMApi,
  LLMModel,
  SpeechOptions,
  RequestMessage,
} from "./api";
import { logger } from "../utils/logger";

/**
 * 统一的客户端 API 实现
 * 替代所有单独的 platform 文件
 */
export class UnifiedClientApi extends LLMApi {
  async chat(options: ChatOptions): Promise<void> {
    try {
      // 转换消息格式 - options.messages 已经是 RequestMessage[] 类型
      const messages = options.messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      }));

      const requestOptions: UnifiedChatOptions = {
        messages,
        model: options.config.model,
        temperature: options.config.temperature,
        maxTokens: undefined, // 可以从 config 中获取
        stream: options.config.stream,
        tools: options.tools,
      };

      const result = await unifiedChat(requestOptions);

      if (options.config.stream) {
        // 处理流式响应
        // 这里需要根据 AI SDK 的实际 API 来处理流式响应
        // 暂时简化处理
        options.onFinish("Stream response handled", new Response());
      } else {
        // 处理普通响应
        const response = result as any;
        options.onUpdate?.(response.content, response.content);
        options.onFinish(response.content, new Response());
      }
    } catch (error) {
      logger.error("[Unified Client API] Chat failed:", error);
      options.onError?.(error as Error);
    }
  }

  async speech(_options: SpeechOptions): Promise<ArrayBuffer> {
    // 语音合成功能，可以通过统一的代理端点实现
    throw new Error("Speech synthesis not implemented in unified API yet");
  }

  async models(): Promise<LLMModel[]> {
    // 模型列表获取，可以通过统一的端点实现
    return [];
  }
}
