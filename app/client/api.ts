import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  ServiceProvider,
  getProviderConfig,
  getAllProviders,
} from "../constant";
import {
  ChatMessageTool,
  ChatMessage,
  ModelType,
  useAccessStore,
  useChatStore,
  CustomProviderType,
} from "../store";
import { unifiedChat, UnifiedChatOptions } from "./unified-api";
import { logger } from "../utils/logger";
import { ModelSize } from "../typing";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export const TTSModels = ["tts-1", "tts-1-hd"] as const;

// DALL-E 请求参数接口
export interface DalleRequestPayload {
  model: string;
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  response_format?: "url" | "b64_json";
  user?: string;
}
export type ChatModel = ModelType;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface MultimodalContentForAlibaba {
  text?: string;
  image?: string;
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  providerName?: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  size?: ModelSize;
  quality?: DalleRequestPayload["quality"];
  style?: DalleRequestPayload["style"];
}

export interface SpeechOptions {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  onController?: (controller: AbortController) => void;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  tools?: any[]; // MCP tools in OpenAI function call format

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, responseRes: Response) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
  sorted: number;
  isDefault?: boolean;
  contextTokens?: number; // 上下文窗口Token数
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract speech(options: SpeechOptions): Promise<ArrayBuffer>;
  abstract models(): Promise<LLMModel[]>;
}

/**
 * 统一的客户端 API 实现
 * 替代所有单独的 platform 文件
 */
class UnifiedClientApi extends LLMApi {
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

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    // 使用统一的客户端 API，不再区分不同的厂商
    this.llm = new UnifiedClientApi();
  }

  config() {}

  prompts() {}

  masks() {}

  // ShareGPT功能已被移除，替换为打印功能
  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    // 打印功能已在UI组件中实现，此方法保留用于兼容性
    return null;
  }
}

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

export function validString(x: string): boolean {
  return x?.length > 0;
}

export function getHeaders(
  ignoreHeaders: boolean = false,
  overrideModelConfig?: any,
) {
  const accessStore = useAccessStore.getState();
  const chatStore = useChatStore.getState();
  let headers: Record<string, string> = {};
  if (!ignoreHeaders) {
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  const clientConfig = getClientConfig();

  function getConfig() {
    // Use overrideModelConfig if provided (for model testing), otherwise use session config
    const modelConfig =
      overrideModelConfig || chatStore.currentSession().mask.modelConfig;

    // 标准化providerName以确保正确匹配
    const normalizedProviderName = normalizeProviderName(
      modelConfig.providerName as string,
    );

    // 获取厂商配置
    const providerConfig = getProviderConfig(normalizedProviderName);

    // 检查是否是自定义服务商
    const isCustomProvider =
      typeof modelConfig.providerName === "string" &&
      modelConfig.providerName.startsWith("custom_");
    const customProvider = isCustomProvider
      ? accessStore.customProviders.find(
          (p) => p.id === modelConfig.providerName,
        )
      : null;
    const isEnabledAccessControl = accessStore.enabledAccessControl();

    // 动态获取API key
    const apiKey =
      isCustomProvider && customProvider
        ? customProvider.apiKey
        : accessStore.getProviderApiKey(normalizedProviderName);

    return {
      providerConfig,
      isCustomProvider,
      customProvider,
      apiKey,
      isEnabledAccessControl,
      normalizedProviderName, // 添加这个字段供其他地方使用
    };
  }

  function getAuthHeader(): string {
    const { providerConfig } = getConfig();
    return providerConfig?.authHeaderName || "Authorization";
  }

  const {
    providerConfig,
    isCustomProvider,
    customProvider,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();

  const authHeader = getAuthHeader();

  // 判断是否需要特殊的认证处理（非标准 Authorization 头）
  const needsSpecialAuth = !!(
    providerConfig?.authHeaderName &&
    providerConfig.authHeaderName !== "Authorization"
  );

  const bearerToken = getBearerToken(apiKey, needsSpecialAuth);

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    // 对于需要特殊认证头的厂商，即使使用 access code，也应该使用对应的认证头
    if (needsSpecialAuth) {
      headers[authHeader] = getBearerToken(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
        needsSpecialAuth,
      );
    } else {
      headers["Authorization"] = getBearerToken(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
      );
    }
  }

  // 为自定义服务商添加配置信息到请求头
  if (isCustomProvider && customProvider) {
    // 使用Base64编码避免非ISO-8859-1字符问题
    const configJson = JSON.stringify(customProvider);
    // 使用TextEncoder将UTF-8字符串转换为字节数组，然后转换为Base64
    const encoder = new TextEncoder();
    const bytes = encoder.encode(configJson);
    const base64 = btoa(String.fromCharCode(...bytes));
    headers["x-custom-provider-config"] = base64;
  }

  return headers;
}

export function getClientApi(provider: string): ClientApi {
  // 现在所有厂商都使用统一的 API，不需要区分不同的厂商
  return new ClientApi();
}

// 标准化provider名称，将provider.id转换为ServiceProvider枚举值
export function normalizeProviderName(provider: string): string {
  // 检查 provider 是否为空
  if (!provider || typeof provider !== "string") {
    logger.warn(
      "normalizeProviderName: provider is undefined or invalid, defaulting to OpenAI",
    );
    return ServiceProvider.OpenAI.id;
  }

  // 如果是自定义服务商，需要根据其类型返回对应的ServiceProvider
  if (provider.startsWith("custom_")) {
    const { useAccessStore } = require("../store");
    const accessStore = useAccessStore.getState();
    const customProvider = accessStore.customProviders.find(
      (p: any) => p.id === provider,
    );

    if (customProvider) {
      // 根据自定义服务商类型返回对应的ServiceProvider
      const typeToProviderMap: Record<CustomProviderType, string> = {
        openai: ServiceProvider.OpenAI.id,
        google: ServiceProvider.Google.id,
        anthropic: ServiceProvider.Anthropic.id,
      };

      return (
        typeToProviderMap[customProvider.type as CustomProviderType] ||
        ServiceProvider.OpenAI.id
      );
    }
  }

  // 创建动态映射表，将provider.id映射到ServiceProvider.id
  const providerIdMap: Record<string, string> = {};
  getAllProviders().forEach((provider) => {
    providerIdMap[provider.id.toLowerCase()] = provider.id;
  });

  // 如果provider已经是ServiceProvider.id，直接返回
  const allProviderIds = getAllProviders().map((p) => p.id);
  if (allProviderIds.includes(provider)) {
    return provider;
  }

  // 如果provider是provider.id格式，转换为ServiceProvider.id
  const lowerProvider = provider.toLowerCase();
  const normalizedProvider = providerIdMap[lowerProvider];

  if (normalizedProvider) {
    return normalizedProvider;
  }

  // 默认返回第一个可用的提供商
  return getAllProviders()[0]?.id || ServiceProvider.OpenAI.id;
}

// 自定义服务商现在直接使用内置的API，不再需要CustomProviderApi
