// 导入统一的模型配置
import {
  getModelCapabilities as getModelCapabilitiesFromConfig,
  isWebSearchModel as isWebSearchModelFromConfig,
  type ModelCapabilities,
} from "./config/model-config";
import { findPiModelById, getPiModelsByProvider } from "./utils/pi-ai-resolver";
import { MODELS_DEV_CONFIG as GENERATED_MODELS_DEV_CONFIG } from "./config/generated/models-config";
import type {
  GeneratedModelConfig,
  GeneratedProviderConfig,
  ModelsDevConfigMap,
} from "./config/models-dev-types";

const MODELS_DEV_CONFIG: ModelsDevConfigMap =
  (GENERATED_MODELS_DEV_CONFIG as unknown as ModelsDevConfigMap) || {};

function getProviderModelsMap(
  provider: unknown,
): Readonly<Record<string, GeneratedModelConfig>> | null {
  if (
    !provider ||
    typeof provider !== "object" ||
    !("models" in provider) ||
    !(provider as any).models
  ) {
    return null;
  }
  return (provider as GeneratedProviderConfig).models || null;
}

function getGeneratedProviderById(providerId: string): unknown {
  const normalizedProviderId = String(providerId || "").toLowerCase();
  return (
    MODELS_DEV_CONFIG[normalizedProviderId] ??
    MODELS_DEV_CONFIG[String(providerId || "")]
  );
}

function findModelInGeneratedConfig(
  modelId: string,
): GeneratedModelConfig | null {
  for (const provider of Object.values(MODELS_DEV_CONFIG)) {
    const models = getProviderModelsMap(provider);
    if (!models) continue;
    if (models[modelId]) return models[modelId];
  }
  return null;
}

function getGeneratedModelContextWindow(
  model: GeneratedModelConfig | null,
): number | undefined {
  if (
    !model ||
    typeof model !== "object" ||
    !("limit" in model) ||
    !model.limit ||
    typeof model.limit !== "object" ||
    !("context" in model.limit)
  ) {
    return undefined;
  }
  return model.limit.context as number;
}

function getGeneratedModelInputModalities(
  model: GeneratedModelConfig | null,
): readonly string[] | undefined {
  if (
    !model ||
    typeof model !== "object" ||
    !("modalities" in model) ||
    !model.modalities ||
    typeof model.modalities !== "object" ||
    !("input" in model.modalities) ||
    !Array.isArray(model.modalities.input)
  ) {
    return undefined;
  }
  return model.modalities.input as readonly string[];
}

// 辅助函数：从生成的配置中获取知识截止日期
function getKnowledgeCutoffFromConfig(): Record<string, string> {
  const cutoffDates: Record<string, string> = {};

  Object.values(MODELS_DEV_CONFIG).forEach((provider) => {
    const models = getProviderModelsMap(provider);
    if (!models) return;
    Object.entries(models).forEach(([modelId, modelData]) => {
      if (
        modelData &&
        typeof modelData === "object" &&
        "knowledge" in modelData &&
        modelData.knowledge
      ) {
        cutoffDates[modelId] = modelData.knowledge as string;
      }
    });
  });

  return cutoffDates;
}

// 辅助函数：从生成的配置中获取厂商模型列表
function getProviderModelsFromConfig(providerId: string): string[] {
  const piModels = getPiModelsByProvider(providerId).map((model) =>
    String(model.id),
  );
  if (piModels.length > 0) {
    return piModels;
  }

  const providerModels = getProviderModelsMap(
    getGeneratedProviderById(providerId),
  );
  return providerModels ? Object.keys(providerModels) : [];
}

// 辅助函数：从生成的配置中获取模型上下文长度
function getModelContextFromConfig(modelId: string): number | undefined {
  const piModel = findPiModelById(modelId);
  if (piModel?.contextWindow) {
    return piModel.contextWindow;
  }

  const model = findModelInGeneratedConfig(modelId);
  return getGeneratedModelContextWindow(model);
}

// 辅助函数：从生成的配置中判断模型是否支持视觉
function getModelVisionSupportFromConfig(modelId: string): boolean {
  const piModel = findPiModelById(modelId);
  if (piModel) {
    return Array.isArray(piModel.input) && piModel.input.includes("image");
  }

  const model = findModelInGeneratedConfig(modelId);
  const inputModalities = getGeneratedModelInputModalities(model);
  return Array.isArray(inputModalities) && inputModalities.includes("image");
}

// 导出模型能力接口
export type { ModelCapabilities };

// 获取模型能力（基于生成的配置）
// 支持可选的厂商名称参数，用于精确查找模型配置
export function getModelCapabilities(
  modelName: string,
  providerName?: string,
): ModelCapabilities {
  return getModelCapabilitiesFromConfig(modelName, providerName);
}

export const OWNER = "zyqfork";
export const REPO = "llmchat";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;

export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

// ==================== 统一图标配置 ====================

// 支持的图标类型
export type ModelIconType =
  | "openai"
  | "azure"
  | "claude"
  | "gemini"
  | "meta"
  | "deepseek"
  | "kimi"
  | "qwen"
  | "wenxin"
  | "grok"
  | "siliconcloud"
  | "ollama"
  | "chatglm"
  | "doubao" // 字节跳动豆包/火山引擎
  | "mistral" // Mistral AI
  | "huggingface" // Hugging Face
  | "perplexity" // Perplexity
  | "stability" // Stability AI
  | "midjourney" // Midjourney
  | "replicate" // Replicate
  | "together" // Together AI
  | "modelscope" // 魔搭社区
  | "cohere" // Cohere
  | "anthropic" // Anthropic (独立图标)
  | "yi" // 零一万物
  | "minimax" // MiniMax
  | "stepfun" // 阶跃星辰
  | "baichuan" // 百川智能
  | "sensetime" // 商汤科技
  | "iflytek" // 科大讯飞
  | "tencent" // 腾讯
  | "netease" // 网易
  | "360" // 360智脑
  | "groq" // Groq (硬件加速)
  | "fireworks" // Fireworks AI
  | "anyscale" // Anyscale
  | "runpod" // RunPod
  | "novita" // Novita AI
  | "lepton" // Lepton AI
  | "cerebras"; // Cerebras

// 统一的图标配置 - 每个图标类型包含模型匹配规则和厂商映射
export const ICON_CONFIG: Record<
  ModelIconType,
  {
    modelPatterns: string[];
    providerNames: string[];
    description: string;
  }
> = {
  openai: {
    modelPatterns: [
      "gpt-3",
      "gpt-4",
      "gpt-5",
      "o1",
      "o3",
      "o4",
      "chatgpt",
      "dall-e",
      "dalle",
      "ada",
    ],
    providerNames: ["openai"],
    description: "OpenAI 系列",
  },
  azure: {
    modelPatterns: [], // Azure 主要通过厂商名称识别
    providerNames: ["azure", "azure openai"],
    description: "Azure OpenAI 服务",
  },
  claude: {
    modelPatterns: ["claude"],
    providerNames: ["anthropic"],
    description: "Anthropic Claude 系列",
  },
  anthropic: {
    modelPatterns: [], // 独立的 Anthropic 图标
    providerNames: ["anthropic inc", "anthropic ai"],
    description: "Anthropic 公司",
  },
  gemini: {
    modelPatterns: ["gemini", "learnlm", "gemma"],
    providerNames: ["google"],
    description: "Google Gemini 系列",
  },
  meta: {
    modelPatterns: ["llama", "code-llama", "codellama"],
    providerNames: ["meta", "facebook"],
    description: "Meta LLaMA 系列",
  },
  deepseek: {
    modelPatterns: ["deepseek"],
    providerNames: ["deepseek"],
    description: "DeepSeek 系列",
  },
  kimi: {
    modelPatterns: ["kimi", "moonshot"],
    providerNames: ["moonshotai", "moonshot", "月之暗面"],
    description: "月之暗面 Kimi 系列",
  },
  qwen: {
    modelPatterns: ["qwen", "qwq", "qvq", "通义"],
    providerNames: ["alibaba", "alibaba cloud", "阿里巴巴", "阿里云", "通义"],
    description: "阿里云通义千问系列",
  },
  wenxin: {
    modelPatterns: ["wenxin", "文心", "ernie"],
    providerNames: ["百度", "baidu"],
    description: "百度文心系列",
  },
  grok: {
    modelPatterns: ["grok"],
    providerNames: ["xai"],
    description: "xAI Grok 系列",
  },
  siliconcloud: {
    modelPatterns: [], // SiliconFlow 主要通过厂商名称识别
    providerNames: ["siliconflow"],
    description: "SiliconFlow 聚合服务",
  },
  ollama: {
    modelPatterns: ["ollama"],
    providerNames: ["ollama", "ollama cloud"],
    description: "Ollama 本地模型",
  },
  chatglm: {
    modelPatterns: ["chatglm", "glm", "zhipu", "智谱", "清言", "qingyan"],
    providerNames: ["zai", "zhipu", "智谱", "智谱ai", "zhipuai"],
    description: "智谱 ChatGLM 系列",
  },
  doubao: {
    modelPatterns: ["doubao", "豆包", "bytedance", "字节", "抖音", "^ep-"], // 使用 ^ep- 表示以 ep- 开头
    providerNames: [
      "bytedance",
      "字节跳动",
      "字节",
      "抖音",
      "doubao",
      "豆包",
      "火山引擎",
      "volcengine",
    ],
    description: "字节跳动豆包/火山引擎系列",
  },
  mistral: {
    modelPatterns: ["mistral", "mixtral", "codestral", "pixtral"],
    providerNames: ["mistral", "mistral ai"],
    description: "Mistral AI 系列",
  },
  huggingface: {
    modelPatterns: ["huggingface", "hf", "transformers"],
    providerNames: ["huggingface", "hugging face", "hf"],
    description: "Hugging Face 模型",
  },
  perplexity: {
    modelPatterns: ["perplexity", "pplx"],
    providerNames: ["perplexity"],
    description: "Perplexity 搜索模型",
  },
  stability: {
    modelPatterns: [
      "stable",
      "sdxl",
      "sd3",
      "stablediffusion",
      "stable-diffusion",
    ],
    providerNames: ["stability", "stability ai", "stabilityai"],
    description: "Stability AI 图像生成",
  },
  midjourney: {
    modelPatterns: ["midjourney", "mj"],
    providerNames: ["midjourney"],
    description: "Midjourney 图像生成",
  },
  replicate: {
    modelPatterns: ["replicate"],
    providerNames: ["replicate"],
    description: "Replicate 平台",
  },
  together: {
    modelPatterns: ["together"],
    providerNames: ["together", "together ai", "togetherai"],
    description: "Together AI 平台",
  },
  modelscope: {
    modelPatterns: ["modelscope", "魔搭", "达摩院"],
    providerNames: ["modelscope", "魔搭", "阿里达摩院", "达摩院"],
    description: "魔搭社区模型",
  },
  cohere: {
    modelPatterns: ["cohere", "command", "embed"],
    providerNames: ["cohere"],
    description: "Cohere 系列",
  },
  yi: {
    modelPatterns: ["^yi-", "01-ai"], // 使用 ^yi- 表示以 yi- 开头
    providerNames: ["01-ai", "零一万物", "01.ai"],
    description: "零一万物 Yi 系列",
  },
  minimax: {
    modelPatterns: ["minimax", "abab"],
    providerNames: ["minimax", "海螺ai"],
    description: "MiniMax 海螺AI",
  },
  stepfun: {
    modelPatterns: ["^step-", "stepfun"], // 使用 ^step- 表示以 step- 开头
    providerNames: ["stepfun", "阶跃星辰"],
    description: "阶跃星辰 Step 系列",
  },
  baichuan: {
    modelPatterns: ["baichuan"],
    providerNames: ["baichuan", "百川智能"],
    description: "百川智能系列",
  },
  sensetime: {
    modelPatterns: ["sensechat", "商汤"],
    providerNames: ["sensetime", "商汤科技", "商汤"],
    description: "商汤科技系列",
  },
  iflytek: {
    modelPatterns: ["spark", "讯飞星火"],
    providerNames: ["iflytek", "科大讯飞", "讯飞"],
    description: "科大讯飞星火系列",
  },
  tencent: {
    modelPatterns: ["hunyuan", "混元"],
    providerNames: ["tencent", "腾讯", "腾讯云"],
    description: "腾讯混元系列",
  },
  netease: {
    modelPatterns: ["youdao", "有道"],
    providerNames: ["netease", "网易", "有道"],
    description: "网易有道系列",
  },
  "360": {
    modelPatterns: ["360gpt", "智脑"],
    providerNames: ["360", "奇虎360"],
    description: "360智脑系列",
  },
  groq: {
    modelPatterns: ["groq"], // 注意：这是硬件加速平台，不是 xAI 的 Grok
    providerNames: ["groq"],
    description: "Groq 硬件加速平台",
  },
  fireworks: {
    modelPatterns: ["fireworks"],
    providerNames: ["fireworks", "fireworks ai"],
    description: "Fireworks AI 平台",
  },
  anyscale: {
    modelPatterns: ["anyscale"],
    providerNames: ["anyscale"],
    description: "Anyscale 平台",
  },
  runpod: {
    modelPatterns: ["runpod"],
    providerNames: ["runpod"],
    description: "RunPod 平台",
  },
  novita: {
    modelPatterns: ["novita"],
    providerNames: ["novita", "novita ai"],
    description: "Novita AI 平台",
  },
  lepton: {
    modelPatterns: ["lepton"],
    providerNames: ["lepton", "lepton ai"],
    description: "Lepton AI 平台",
  },
  cerebras: {
    modelPatterns: ["cerebras"],
    providerNames: ["cerebras"],
    description: "Cerebras 系统",
  },
};

/**
 * 根据模型名称获取对应的图标类型
 * @param modelName 模型名称
 * @returns 图标类型或 null
 */
export function getModelIconType(modelName: string): ModelIconType | null {
  if (!modelName) return null;

  const lowerModelName = modelName.toLowerCase();

  // 按照模式长度排序，优先匹配更具体的模式
  const sortedConfigs = Object.entries(ICON_CONFIG).sort((a, b) => {
    const maxLengthA = Math.max(...a[1].modelPatterns.map((p) => p.length));
    const maxLengthB = Math.max(...b[1].modelPatterns.map((p) => p.length));
    return maxLengthB - maxLengthA; // 降序排列，长的优先
  });

  // 遍历排序后的图标配置，按优先级匹配
  for (const [iconType, config] of sortedConfigs) {
    if (
      config.modelPatterns.some((pattern) => {
        const lowerPattern = pattern.toLowerCase();
        // 处理以 ^ 开头的模式（表示字符串开头匹配）
        if (lowerPattern.startsWith("^")) {
          const actualPattern = lowerPattern.substring(1);
          return lowerModelName.startsWith(actualPattern);
        }
        // 普通包含匹配
        return lowerModelName.includes(lowerPattern);
      })
    ) {
      return iconType as ModelIconType;
    }
  }

  return null;
}

/**
 * 根据厂商名称获取对应的图标类型
 * @param providerName 厂商名称
 * @returns 图标类型或 null
 */
export function getProviderIconType(
  providerName: string,
): ModelIconType | null {
  if (!providerName) return null;

  const lowerProviderName = providerName.toLowerCase();

  // 遍历所有图标配置，匹配厂商名称
  for (const [iconType, config] of Object.entries(ICON_CONFIG)) {
    if (
      config.providerNames.some(
        (name) => lowerProviderName === name.toLowerCase(),
      )
    ) {
      return iconType as ModelIconType;
    }
  }

  return null;
}

// ==================== 原有配置 ====================

export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";

export const CACHE_URL_PREFIX = "/api/cache";
export const UPLOAD_URL = `${CACHE_URL_PREFIX}/upload`;

export enum ColorScheme {
  Default = "default",
  Ocean = "ocean",
  Forest = "forest",
  Sunset = "sunset",
  Purple = "purple",
  Rose = "rose",
}

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",

  Auth = "/auth",

  Artifacts = "/artifacts",
  SearchChat = "/search-chat",
  McpMarket = "/mcp-market",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "chat-next-web-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",

  Mcp = "mcp-store",
}

export const DEFAULT_SIDEBAR_WIDTH = 300;
export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "nk-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "llmchat";

export const REQUEST_TIMEOUT_MS = 60000;
export const REQUEST_TIMEOUT_MS_FOR_THINKING = REQUEST_TIMEOUT_MS * 5;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

// 厂商配置接口
export interface ProviderConfig {
  id: string;
  name: string;
  modelProvider: string;
  iconUrl: string;
  sdkType:
    | "openai"
    | "openai-compatible"
    | "anthropic"
    | "google"
    | "xai"
    | "azure";
  defaultBaseUrl: string;
  apiPath: string;
  proxyPath?: string;
  envApiKeyName: string;
  envBaseUrlName?: string;
  authHeaderName?: string;
  endpoints: {
    chat: string;
    response?: string;
    image?: string;
    speech?: string;
    models?: string;
  };
  azure?: {
    resourceName?: string;
    apiVersion?: string;
  };
  ui?: {
    defaultCollapsed?: boolean;
    showResponseApi?: boolean;
    showProxy?: boolean;
    showApiPath?: boolean;
    showEndpoint?: boolean;
    showApiVersion?: boolean;
  };
  storeKeys: {
    apiKey: string;
    baseUrl: string;
    apiType?: string;
    apiPath?: string;
    responseStateful?: string;
    useProxy?: string;
    proxyUrl?: string;
    apiVersion?: string;
    resourceName?: string;
  };
}

// 厂商配置对象
export const ServiceProvider: Record<string, ProviderConfig> = {
  OpenAI: {
    id: "openai",
    name: "OpenAI",
    modelProvider: "GPT",
    iconUrl: "/logos/openai.svg",
    sdkType: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    apiPath: "/api/openai",
    envApiKeyName: "OPENAI_API_KEY",
    envBaseUrlName: "OPENAI_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      image: "images/generations",
      speech: "audio/speech",
      models: "models",
    },
    ui: {
      defaultCollapsed: false, // OpenAI 默认展开
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "openaiApiKey",
      baseUrl: "openaiUrl",
      apiType: "openaiApiType",
      apiPath: "openaiApiPath",
      responseStateful: "openaiResponseStateful",
      useProxy: "openaiUseProxy",
      proxyUrl: "openaiProxyUrl",
    },
  },
  Azure: {
    id: "azure",
    name: "Azure OpenAI",
    modelProvider: "GPT",
    iconUrl: "/logos/azure.svg",
    sdkType: "azure",
    defaultBaseUrl: "", // Azure使用动态URL
    apiPath: "/api/azure",
    envApiKeyName: "AZURE_API_KEY",
    envBaseUrlName: "AZURE_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      image: "images/generations",
      speech: "audio/speech",
      models: "models",
    },
    azure: {
      apiVersion: "2024-02-01",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: false,
      showProxy: true,
      showApiPath: false,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "azureApiKey",
      baseUrl: "azureUrl",
      useProxy: "azureUseProxy",
      proxyUrl: "azureProxyUrl",
      apiVersion: "azureApiVersion",
    },
  },
  Google: {
    id: "google",
    name: "Google",
    modelProvider: "GeminiPro",
    iconUrl: "/logos/google.svg",
    sdkType: "google",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/",
    apiPath: "/api/google",
    envApiKeyName: "GOOGLE_API_KEY",
    envBaseUrlName: "GOOGLE_BASE_URL",
    authHeaderName: "x-goog-api-key",
    endpoints: {
      chat: "v1beta/models/{model}:streamGenerateContent",
      models: "v1beta/models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: false,
      showProxy: true,
      showApiPath: false,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "googleApiKey",
      baseUrl: "googleUrl",
      useProxy: "googleUseProxy",
      proxyUrl: "googleProxyUrl",
    },
  },
  Anthropic: {
    id: "anthropic",
    name: "Anthropic",
    modelProvider: "Claude",
    iconUrl: "/logos/anthropic.svg",
    sdkType: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    apiPath: "/api/anthropic",
    envApiKeyName: "ANTHROPIC_API_KEY",
    envBaseUrlName: "ANTHROPIC_BASE_URL",
    authHeaderName: "x-api-key",
    endpoints: {
      chat: "messages",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: false,
      showProxy: true,
      showApiPath: false,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "anthropicApiKey",
      baseUrl: "anthropicUrl",
      useProxy: "anthropicUseProxy",
      proxyUrl: "anthropicProxyUrl",
    },
  },
  Alibaba: {
    id: "alibaba",
    name: "Alibaba Cloud",
    modelProvider: "Qwen",
    iconUrl: "/logos/alibaba.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiPath: "/api/alibaba",
    envApiKeyName: "ALIBABA_API_KEY",
    envBaseUrlName: "ALIBABA_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "alibabaApiKey",
      baseUrl: "alibabaUrl",
      apiType: "alibabaApiType",
      apiPath: "alibabaApiPath",
      responseStateful: "alibabaResponseStateful",
      useProxy: "alibabaUseProxy",
      proxyUrl: "alibabaProxyUrl",
    },
  },
  MoonshotAI: {
    id: "moonshotai",
    name: "MoonshotAI",
    modelProvider: "MoonshotAI",
    iconUrl: "/logos/moonshot.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    apiPath: "/api/moonshotai",
    envApiKeyName: "MOONSHOT_API_KEY",
    envBaseUrlName: "MOONSHOT_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "moonshotApiKey",
      baseUrl: "moonshotUrl",
      apiType: "moonshotApiType",
      apiPath: "moonshotApiPath",
      responseStateful: "moonshotResponseStateful",
      useProxy: "moonshotUseProxy",
      proxyUrl: "moonshotProxyUrl",
    },
  },
  XAI: {
    id: "xai",
    name: "xAI",
    modelProvider: "XAI",
    iconUrl: "/logos/xai.svg",
    sdkType: "xai",
    defaultBaseUrl: "https://api.x.ai/v1",
    apiPath: "/api/xai",
    envApiKeyName: "XAI_API_KEY",
    envBaseUrlName: "XAI_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "xaiApiKey",
      baseUrl: "xaiUrl",
      apiType: "xaiApiType",
      apiPath: "xaiApiPath",
      responseStateful: "xaiResponseStateful",
      useProxy: "xaiUseProxy",
      proxyUrl: "xaiProxyUrl",
    },
  },
  DeepSeek: {
    id: "deepseek",
    name: "DeepSeek",
    modelProvider: "DeepSeek",
    iconUrl: "/logos/deepseek.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    apiPath: "/api/deepseek",
    envApiKeyName: "DEEPSEEK_API_KEY",
    envBaseUrlName: "DEEPSEEK_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "deepseekApiKey",
      baseUrl: "deepseekUrl",
      apiType: "deepseekApiType",
      apiPath: "deepseekApiPath",
      responseStateful: "deepseekResponseStateful",
      useProxy: "deepseekUseProxy",
      proxyUrl: "deepseekProxyUrl",
    },
  },
  SiliconFlow: {
    id: "siliconflow",
    name: "SiliconFlow",
    modelProvider: "SiliconFlow",
    iconUrl: "/logos/siliconflow.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "https://api.siliconflow.cn/v1",
    apiPath: "/api/siliconflow",
    envApiKeyName: "SILICONFLOW_API_KEY",
    envBaseUrlName: "SILICONFLOW_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models?&sub_type=chat",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "siliconflowApiKey",
      baseUrl: "siliconflowUrl",
      apiType: "siliconflowApiType",
      apiPath: "siliconflowApiPath",
      responseStateful: "siliconflowResponseStateful",
      useProxy: "siliconflowUseProxy",
      proxyUrl: "siliconflowProxyUrl",
    },
  },
  OllamaCloud: {
    id: "ollama-cloud",
    name: "Ollama Cloud",
    modelProvider: "OllamaCloud",
    iconUrl: "/logos/ollama.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "https://api.ollama-cloud.com/v1",
    apiPath: "/api/ollama-cloud",
    envApiKeyName: "OLLAMA_CLOUD_API_KEY",
    envBaseUrlName: "OLLAMA_CLOUD_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: false,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "ollamaCloudApiKey",
      baseUrl: "ollamaCloudUrl",
      apiPath: "ollamaCloudApiPath",
      useProxy: "ollamaCloudUseProxy",
      proxyUrl: "ollamaCloudProxyUrl",
    },
  },
  ZAI: {
    id: "zai",
    name: "ZAI",
    modelProvider: "ZAI",
    iconUrl: "/logos/zai.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "https://api.zai.com/v1",
    apiPath: "/api/zai",
    envApiKeyName: "ZAI_API_KEY",
    envBaseUrlName: "ZAI_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      response: "responses",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: true,
      showProxy: true,
      showApiPath: true,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "zaiApiKey",
      baseUrl: "zaiUrl",
      apiType: "zaiApiType",
      apiPath: "zaiApiPath",
      responseStateful: "zaiResponseStateful",
      useProxy: "zaiUseProxy",
      proxyUrl: "zaiProxyUrl",
    },
  },
  Ollama: {
    id: "ollama",
    name: "Ollama",
    modelProvider: "Ollama",
    iconUrl: "/logos/ollama.svg",
    sdkType: "openai-compatible",
    defaultBaseUrl: "http://localhost:11434/v1",
    apiPath: "/api/ollama",
    envApiKeyName: "OLLAMA_API_KEY",
    envBaseUrlName: "OLLAMA_BASE_URL",
    endpoints: {
      chat: "chat/completions",
      models: "models",
    },
    ui: {
      defaultCollapsed: true,
      showResponseApi: false,
      showProxy: false, // 本地服务，通常不需要代理
      showApiPath: false,
      showEndpoint: true,
    },
    storeKeys: {
      apiKey: "ollamaApiKey",
      baseUrl: "ollamaUrl",
    },
  },
};

// 为了向后兼容，提供一个获取厂商配置的辅助函数
export function getProviderConfig(
  providerId: string,
): ProviderConfig | undefined {
  return Object.values(ServiceProvider).find(
    (provider) => provider.id === providerId,
  );
}

// 获取所有厂商ID列表
export function getAllProviderIds(): string[] {
  return Object.values(ServiceProvider).map((provider) => provider.id);
}

// 获取所有厂商配置列表
export function getAllProviders(): ProviderConfig[] {
  return Object.values(ServiceProvider);
}

// Google API safety settings, see https://ai.google.dev/gemini-api/docs/safety-settings
// BLOCK_NONE will not block any content, and BLOCK_ONLY_HIGH will block only high-risk content.
export enum GoogleSafetySettingsThreshold {
  BLOCK_NONE = "BLOCK_NONE",
  BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
  BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
  BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
}

export enum ModelProvider {
  GPT = "GPT",
  GeminiPro = "GeminiPro", // 现在使用官方 SDK 实现
  Claude = "Claude",
  Qwen = "Qwen",
  MoonshotAI = "MoonshotAI",
  XAI = "XAI",
  DeepSeek = "DeepSeek",
  SiliconFlow = "SiliconFlow",
  OllamaCloud = "OllamaCloud",
  Ollama = "Ollama",
  OpenRouter = "OpenRouter",
}

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
// export const DEFAULT_SYSTEM_TEMPLATE = `
// You are ChatGPT, a large language model trained by {{ServiceProvider}}.
// Knowledge cutoff: {{cutoff}}
// Current model: {{model}}
// Current time: {{time}}
// Latex inline: $x^2$
// Latex block: $$e=mc^2$$
// `;
export const DEFAULT_SYSTEM_TEMPLATE = `
You are ChatGPT, a large language model trained by {{ServiceProvider}}.
Knowledge cutoff: {{cutoff}}
Current model: {{model}}
Current time: {{time}}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$
`;

export const MCP_TOOLS_TEMPLATE = `
### MCP Server: {{ clientId }}
**Server ID (clientId)**: {{ clientId }}
**Available Tools**:
{{ tools }}

**IMPORTANT**: When calling these tools, you MUST use the Server ID "{{ clientId }}" in the code block format:
\`\`\`json:mcp:{{ clientId }}
{
  "method": "tools/call",
  "params": {
    "name": "tool_name_here",
    "arguments": {...}
  }
}
\`\`\`

**Usage Note**: These tools are immediately available for use. When users request actions that match these tools, use them directly without asking for permission.
`;

export const MCP_SYSTEM_TEMPLATE = `
# MCP Tools

{{ MCP_TOOLS }}

## Call Format

Use ONLY this format:

\`\`\`json:mcp:{SERVER_ID}
{"method":"tools/call","params":{"name":"TOOL_NAME","arguments":{...}}}
\`\`\`

## Rules

1. Use markdown code block: \`\`\`json:mcp:{SERVER_ID}\`\`\`
2. {SERVER_ID} = MCP server ID (e.g., "smithery-websearch")
3. TOOL_NAME = actual tool name from available tools
4. One tool call per message
5. Call tools immediately when needed

## Examples

Search:
\`\`\`json:mcp:smithery-websearch
{"method":"tools/call","params":{"name":"search","arguments":{"query":"AI news","limit":10}}}
\`\`\`

File:
\`\`\`json:mcp:filesystem
{"method":"tools/call","params":{"name":"write_file","arguments":{"path":"/file.txt","content":"text"}}}
\`\`\`

## NEVER Use

❌ <|tool_calls_section_begin|> or functions.* or plain JSON
✅ ONLY use \`\`\`json:mcp:{SERVER_ID}\`\`\` format
`;

export const SUMMARIZE_MODEL = "gpt-4o-mini";
export const GEMINI_SUMMARIZE_MODEL = "gemini-pro";
export const DEEPSEEK_SUMMARIZE_MODEL = "deepseek-chat";

// MCP工具相关常量
export const MCP_TOOL_THRESHOLD = 10; // 当工具数量超过此值时使用强化提示词模式

export const KnowledgeCutOffDate: Record<string, string> = {
  // 完全使用生成的配置，如果没有则使用默认值
  ...getKnowledgeCutoffFromConfig(),
  // 默认配置作为 fallback
  default: "2021-09",
};

export const DEFAULT_TTS_ENGINE = "OpenAI-TTS";
export const DEFAULT_TTS_ENGINES = ["OpenAI-TTS", "Edge-TTS"];
export const DEFAULT_TTS_MODEL = "tts-1";
export const DEFAULT_TTS_VOICE = "alloy";
export const DEFAULT_TTS_MODELS = ["tts-1", "tts-1-hd"];
export const DEFAULT_TTS_VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
];

// 动态生成视觉模型检测函数，基于 models-config.ts 中的配置
export function isVisionModel(model: string): boolean {
  if (typeof window !== "undefined") {
    try {
      // 与模型能力配置面板保持一致：支持读取 localStorage 中手动勾选的能力
      const capabilities = getModelCapabilitiesFromConfig(model);
      if (capabilities.vision === true) {
        return true;
      }
    } catch (error) {
      // 静默处理错误，继续使用其他检测方法
    }
  }

  // 直接使用生成的配置判断
  return getModelVisionSupportFromConfig(model);
}

// 检测模型是否支持网络搜索
export function isWebSearchModel(modelName: string): boolean {
  return isWebSearchModelFromConfig(modelName);
}

// 使用生成的模型配置创建 DEFAULT_MODELS
let seq = 1000; // 内置的模型序号生成器从1000开始

// 动态生成 DEFAULT_MODELS，基于 ServiceProvider 配置和生成的模型数据
export const DEFAULT_MODELS = (() => {
  const models: any[] = [];
  let currentSeq = seq;

  // 遍历所有 ServiceProvider 配置
  getAllProviders().forEach((provider, providerIndex) => {
    const providerModels = getProviderModelsFromConfig(provider.id);

    providerModels.forEach((modelName: string) => {
      models.push({
        name: modelName,
        available: true,
        sorted: currentSeq++,
        contextTokens: getModelContextFromConfig(modelName),
        provider: {
          id: provider.id,
          providerName: provider.name,
          providerType: provider.id,
          sorted: providerIndex + 1,
        },
      });
    });
  });

  return models;
})();

export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;

// some famous webdav endpoints
export const internalAllowedWebDavEndpoints = [
  "https://dav.jianguoyun.com/dav/",
  "https://dav.dropdav.com/",
  "https://dav.box.com/dav",
  "https://nanao.teracloud.jp/dav/",
  "https://bora.teracloud.jp/dav/",
  "https://webdav.4shared.com/",
  "https://dav.idrivesync.com",
  "https://webdav.yandex.com",
  "https://app.koofr.net/dav/Koofr",
];

export const DEFAULT_GA_ID = "G-89WN60ZK2E";

export const SAAS_CHAT_URL = "https://github.com/zyqfork/llmchat";
export const SAAS_CHAT_UTM_URL =
  "https://github.com/zyqfork/llmchat?utm_source=github";
