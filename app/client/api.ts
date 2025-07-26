import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  ServiceProvider,
} from "../constant";
import {
  ChatMessageTool,
  ChatMessage,
  ModelType,
  useAccessStore,
  useChatStore,
} from "../store";
import { ChatGPTApi, DalleRequestPayload } from "./platforms/openai";
import { GeminiProApi } from "./platforms/google";
import { ClaudeApi } from "./platforms/anthropic";
import { DoubaoApi } from "./platforms/bytedance";
import { QwenApi } from "./platforms/alibaba";
import { MoonshotApi } from "./platforms/moonshot";
import { DeepSeekApi } from "./platforms/deepseek";
import { XAIApi } from "./platforms/xai";
import { SiliconflowApi } from "./platforms/siliconflow";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export const TTSModels = ["tts-1", "tts-1-hd"] as const;
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
  size?: DalleRequestPayload["size"];
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
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
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
    switch (provider) {
      case ModelProvider.GeminiPro:
        this.llm = new GeminiProApi();
        break;
      case ModelProvider.Claude:
        this.llm = new ClaudeApi();
        break;
      case ModelProvider.Doubao:
        this.llm = new DoubaoApi();
        break;
      case ModelProvider.Qwen:
        this.llm = new QwenApi();
        break;
      case ModelProvider.Moonshot:
        this.llm = new MoonshotApi();
        break;
      case ModelProvider.DeepSeek:
        this.llm = new DeepSeekApi();
        break;
      case ModelProvider.XAI:
        this.llm = new XAIApi();
        break;
      case ModelProvider.SiliconFlow:
        this.llm = new SiliconflowApi();
        break;
      default:
        this.llm = new ChatGPTApi();
    }
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value: "Share from [QADChat]: https://github.com/syferie/qadchat",
        },
      ]);

    console.log("[Share]", messages, msgs);
    const clientConfig = getClientConfig();
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
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

    console.log("[getHeaders.getConfig] 🔍 Provider matching:", {
      original: modelConfig.providerName,
      normalized: normalizedProviderName,
      model: modelConfig.model,
    });

    const isGoogle = normalizedProviderName === ServiceProvider.Google;
    const isAzure = normalizedProviderName === ServiceProvider.Azure;
    const isAnthropic = normalizedProviderName === ServiceProvider.Anthropic;
    const isByteDance = normalizedProviderName === ServiceProvider.ByteDance;
    const isAlibaba = normalizedProviderName === ServiceProvider.Alibaba;
    const isMoonshot = normalizedProviderName === ServiceProvider.Moonshot;
    const isDeepSeek = normalizedProviderName === ServiceProvider.DeepSeek;
    const isXAI = normalizedProviderName === ServiceProvider.XAI;
    const isSiliconFlow =
      normalizedProviderName === ServiceProvider.SiliconFlow;

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
    const apiKey =
      isCustomProvider && customProvider
        ? customProvider.apiKey
        : isGoogle
        ? accessStore.googleApiKey
        : isAzure
        ? accessStore.azureApiKey
        : isAnthropic
        ? accessStore.anthropicApiKey
        : isByteDance
        ? accessStore.bytedanceApiKey
        : isAlibaba
        ? accessStore.alibabaApiKey
        : isMoonshot
        ? accessStore.moonshotApiKey
        : isXAI
        ? accessStore.xaiApiKey
        : isDeepSeek
        ? accessStore.deepseekApiKey
        : isSiliconFlow
        ? accessStore.siliconflowApiKey
        : accessStore.openaiApiKey;

    console.log("[getHeaders.getConfig] 🔑 API Key selection:", {
      isGoogle,
      isAlibaba,
      isByteDance,
      isAnthropic,
      isCustomProvider,
      selectedApiKey: apiKey ? `${apiKey.substring(0, 10)}...` : "null",
      googleApiKey: accessStore.googleApiKey
        ? `${accessStore.googleApiKey.substring(0, 10)}...`
        : "null",
      alibabaApiKey: accessStore.alibabaApiKey
        ? `${accessStore.alibabaApiKey.substring(0, 10)}...`
        : "null",
    });
    return {
      isGoogle,
      isAzure,
      isAnthropic,
      isByteDance,
      isAlibaba,
      isMoonshot,
      isDeepSeek,
      isXAI,
      isSiliconFlow,
      isCustomProvider,
      customProvider,
      apiKey,
      isEnabledAccessControl,
    };
  }

  function getAuthHeader(): string {
    return isAzure
      ? "api-key"
      : isAnthropic
      ? "x-api-key"
      : isGoogle
      ? "x-goog-api-key"
      : "Authorization";
  }

  const {
    isGoogle,
    isAzure,
    isAnthropic,
    isByteDance,
    isAlibaba,
    isMoonshot,
    isDeepSeek,
    isXAI,
    isSiliconFlow,
    isCustomProvider,
    customProvider,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();

  const authHeader = getAuthHeader();

  const bearerToken = getBearerToken(
    apiKey,
    isAzure || isAnthropic || isGoogle,
  );

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    headers["Authorization"] = getBearerToken(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
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

export function getClientApi(provider: ServiceProvider | string): ClientApi {
  console.log(
    "[getClientApi] 🔍 Input provider:",
    provider,
    "Type:",
    typeof provider,
  );

  // 标准化provider名称，支持provider.id、provider.providerName和自定义服务商
  const normalizedProvider = normalizeProviderName(provider as string);
  console.log(
    "[getClientApi] 🔄 Normalized provider:",
    provider,
    "->",
    normalizedProvider,
  );

  let selectedApi: ClientApi;
  switch (normalizedProvider) {
    case ServiceProvider.Google:
      console.log("[getClientApi] ✅ Selected Google/GeminiPro API");
      selectedApi = new ClientApi(ModelProvider.GeminiPro);
      break;
    case ServiceProvider.Anthropic:
      console.log("[getClientApi] ✅ Selected Anthropic/Claude API");
      selectedApi = new ClientApi(ModelProvider.Claude);
      break;
    case ServiceProvider.ByteDance:
      console.log("[getClientApi] ✅ Selected ByteDance/Doubao API");
      selectedApi = new ClientApi(ModelProvider.Doubao);
      break;
    case ServiceProvider.Alibaba:
      console.log("[getClientApi] ✅ Selected Alibaba/Qwen API");
      selectedApi = new ClientApi(ModelProvider.Qwen);
      break;
    case ServiceProvider.Moonshot:
      console.log("[getClientApi] ✅ Selected Moonshot API");
      selectedApi = new ClientApi(ModelProvider.Moonshot);
      break;
    case ServiceProvider.DeepSeek:
      console.log("[getClientApi] ✅ Selected DeepSeek API");
      selectedApi = new ClientApi(ModelProvider.DeepSeek);
      break;
    case ServiceProvider.XAI:
      console.log("[getClientApi] ✅ Selected XAI API");
      selectedApi = new ClientApi(ModelProvider.XAI);
      break;
    case ServiceProvider.SiliconFlow:
      console.log("[getClientApi] ✅ Selected SiliconFlow API");
      selectedApi = new ClientApi(ModelProvider.SiliconFlow);
      break;
    default:
      console.log(
        "[getClientApi] ⚠️ Using default OpenAI/GPT API for provider:",
        provider,
      );
      selectedApi = new ClientApi(ModelProvider.GPT);
      break;
  }

  console.log(
    "[getClientApi] 🎯 Final API type:",
    selectedApi.llm.constructor.name,
  );
  return selectedApi;
}

// 标准化provider名称，将provider.id转换为ServiceProvider枚举值
function normalizeProviderName(provider: string): ServiceProvider {
  console.log("[normalizeProviderName] 🔍 Input:", provider);

  // 如果是自定义服务商，需要根据其类型返回对应的ServiceProvider
  if (provider.startsWith("custom_")) {
    const { useAccessStore } = require("../store");
    const accessStore = useAccessStore.getState();
    const customProvider = accessStore.customProviders.find(
      (p: any) => p.id === provider,
    );

    if (customProvider) {
      console.log(
        "[normalizeProviderName] 🎯 Custom provider found, type:",
        customProvider.type,
      );
      // 根据自定义服务商类型返回对应的ServiceProvider
      switch (customProvider.type) {
        case "google":
          console.log(
            "[normalizeProviderName] ✅ Custom Google provider -> Google",
          );
          return ServiceProvider.Google;
        case "anthropic":
          console.log(
            "[normalizeProviderName] ✅ Custom Anthropic provider -> Anthropic",
          );
          return ServiceProvider.Anthropic;
        case "openai":
        default:
          console.log(
            "[normalizeProviderName] ✅ Custom OpenAI provider -> OpenAI",
          );
          return ServiceProvider.OpenAI;
      }
    }
  }

  // 创建一个映射表，将provider.id映射到ServiceProvider枚举值
  const providerIdMap: Record<string, ServiceProvider> = {
    openai: ServiceProvider.OpenAI,
    azure: ServiceProvider.Azure,
    google: ServiceProvider.Google,
    anthropic: ServiceProvider.Anthropic,
    bytedance: ServiceProvider.ByteDance,
    alibaba: ServiceProvider.Alibaba,
    moonshot: ServiceProvider.Moonshot,
    xai: ServiceProvider.XAI,
    deepseek: ServiceProvider.DeepSeek,
    siliconflow: ServiceProvider.SiliconFlow,
  };

  console.log(
    "[normalizeProviderName] 📋 Available ServiceProvider values:",
    Object.values(ServiceProvider),
  );
  console.log(
    "[normalizeProviderName] 🔍 Checking if provider is already ServiceProvider enum:",
    provider,
    "->",
    Object.values(ServiceProvider).includes(provider as ServiceProvider),
  );

  // 如果provider已经是ServiceProvider枚举值，直接返回
  if (Object.values(ServiceProvider).includes(provider as ServiceProvider)) {
    console.log(
      "[normalizeProviderName] ✅ Already ServiceProvider enum, returning:",
      provider,
    );
    return provider as ServiceProvider;
  }

  // 如果provider是provider.id格式，转换为ServiceProvider枚举值
  const lowerProvider = provider.toLowerCase();
  const normalizedProvider = providerIdMap[lowerProvider];
  console.log(
    "[normalizeProviderName] 🔄 Mapping lookup:",
    lowerProvider,
    "->",
    normalizedProvider,
  );

  if (normalizedProvider) {
    console.log(
      "[normalizeProviderName] ✅ Found mapping, returning:",
      normalizedProvider,
    );
    return normalizedProvider;
  }

  // 默认返回OpenAI
  console.log(
    "[normalizeProviderName] ⚠️ No mapping found, defaulting to OpenAI",
  );
  return ServiceProvider.OpenAI;
}

// 自定义服务商现在直接使用内置的API，不再需要CustomProviderApi
