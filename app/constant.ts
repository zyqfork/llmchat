import { getModelContextTokens } from "./config/model-context-tokens";

export const OWNER = "zyqfork";
export const REPO = "llmchat";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;

export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

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
    iconUrl: "https://models.dev/logos/openai.svg",
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
      useProxy: "openaiUseProxy",
      proxyUrl: "openaiProxyUrl",
    },
  },
  Azure: {
    id: "azure",
    name: "Azure OpenAI",
    modelProvider: "GPT",
    iconUrl: "https://models.dev/logos/azure.svg",
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
    iconUrl: "https://models.dev/logos/google.svg",
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
    iconUrl: "https://models.dev/logos/anthropic.svg",
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
    iconUrl: "https://models.dev/logos/alibaba.svg",
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
      useProxy: "alibabaUseProxy",
      proxyUrl: "alibabaProxyUrl",
    },
  },
  MoonshotAI: {
    id: "moonshotai",
    name: "MoonshotAI",
    modelProvider: "MoonshotAI",
    iconUrl: "https://models.dev/logos/moonshot.svg",
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
      useProxy: "moonshotUseProxy",
      proxyUrl: "moonshotProxyUrl",
    },
  },
  XAI: {
    id: "xai",
    name: "xAI",
    modelProvider: "XAI",
    iconUrl: "https://models.dev/logos/xai.svg",
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
      useProxy: "xaiUseProxy",
      proxyUrl: "xaiProxyUrl",
    },
  },
  DeepSeek: {
    id: "deepseek",
    name: "DeepSeek",
    modelProvider: "DeepSeek",
    iconUrl: "https://models.dev/logos/deepseek.svg",
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
      useProxy: "deepseekUseProxy",
      proxyUrl: "deepseekProxyUrl",
    },
  },
  SiliconFlow: {
    id: "siliconflow",
    name: "SiliconFlow",
    modelProvider: "SiliconFlow",
    iconUrl: "https://models.dev/logos/siliconflow.svg",
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
      useProxy: "siliconflowUseProxy",
      proxyUrl: "siliconflowProxyUrl",
    },
  },
  OllamaCloud: {
    id: "ollama-cloud",
    name: "Ollama Cloud",
    modelProvider: "OllamaCloud",
    iconUrl: "https://models.dev/logos/ollama.svg",
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
    iconUrl: "https://models.dev/logos/zai.svg",
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
      useProxy: "zaiUseProxy",
      proxyUrl: "zaiProxyUrl",
    },
  },
  Ollama: {
    id: "ollama",
    name: "Ollama",
    modelProvider: "Ollama",
    iconUrl: "https://models.dev/logos/ollama.svg",
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
  default: "2021-09",
  "gpt-4-turbo": "2023-12",
  "gpt-4-turbo-2024-04-09": "2023-12",
  "gpt-4-turbo-preview": "2023-12",
  "gpt-4.1": "2024-06",
  "gpt-4.1-2025-04-14": "2024-06",
  "gpt-4.1-mini": "2024-06",
  "gpt-4.1-mini-2025-04-14": "2024-06",
  "gpt-4.1-nano": "2024-06",
  "gpt-4.1-nano-2025-04-14": "2024-06",
  "gpt-4.5-preview": "2023-10",
  "gpt-4.5-preview-2025-02-27": "2023-10",
  "gpt-4o": "2023-10",
  "gpt-4o-2024-05-13": "2023-10",
  "gpt-4o-2024-08-06": "2023-10",
  "gpt-4o-2024-11-20": "2023-10",
  "chatgpt-4o-latest": "2023-10",
  "gpt-4o-mini": "2023-10",
  "gpt-4o-mini-2024-07-18": "2023-10",
  "gpt-5": "2024-08",
  "gpt-5-mini": "2024-08",
  "gpt-5-nano": "2024-08",
  "gpt-5-chat": "2024-08",
  "gpt-5.1": "2025-03",
  "gpt-5.1-instant": "2025-03",
  "gpt-5.1-thinking": "2025-03",
  "gpt-5.1-pro": "2025-03",
  "gpt-5.1-codex-max": "2025-03",
  "gpt-5.2": "2025-06",
  "gpt-5.2-instant": "2025-06",
  "gpt-5.2-thinking": "2025-06",
  "gpt-5.2-pro": "2025-06",
  "gpt-4-vision-preview": "2023-04",
  "o1-mini-2024-09-12": "2023-10",
  "o1-mini": "2023-10",
  "o1-preview-2024-09-12": "2023-10",
  "o1-preview": "2023-10",
  "o1-2024-12-17": "2023-10",
  o1: "2023-10",
  "o3-mini-2025-01-31": "2023-10",
  "o3-mini": "2023-10",
  "gpt-oss-120b": "2023-10",
  "gpt-oss-20b": "2023-10",
  // After improvements,
  // it's now easier to add "KnowledgeCutOffDate" instead of stupid hardcoding it, as was done previously.
  "gemini-pro": "2023-12",
  "gemini-pro-vision": "2023-12",
  "gemini-1.5-pro": "2024-05",
  "gemini-1.5-flash": "2024-05",
  "gemini-2.0-flash": "2024-08",
  "gemini-2.5-pro": "2024-11",
  "gemini-2.5-flash": "2024-11",
  "gemini-3-pro": "2025-06",
  "gemini-3-flash": "2025-06",
  "gemini-3-nano": "2025-06",
  "learnlm-1.5-pro-experimental": "2024-05",
  "claude-3-opus-20240229": "2023-08",
  "claude-3-haiku-20240307": "2023-08",
  "claude-3-5-sonnet-20240620": "2024-04",
  "claude-3-5-sonnet-20241022": "2024-04",
  "claude-3-5-haiku-20241022": "2024-07",
  "claude-3-7-sonnet-20250219": "2024-11",
  "claude-sonnet-4-20250514": "2025-01",
  "claude-opus-4-20250514": "2025-01",
  "claude-opus-4-1-20250805": "2025-03",
  "claude-opus-4-5": "2025-08",
  "claude-opus-4-5-20251125": "2025-08",
  "claude-sonnet-4-5": "2025-08",
  "claude-sonnet-4-5-20251121": "2025-08",
  "deepseek-chat": "2024-07",
  "deepseek-coder": "2024-07",
  "deepseek-reasoner": "2024-12",
  "doubao-1-5-pro-32k-250115": "2024-10",
  "doubao-1-5-thinking-pro-m": "2024-10",
  "doubao-pro-32k-241215": "2024-10",
  "kimi-k2": "2024-10",
  "kimi-latest": "2024-10",
  "kimi-thinking-preview": "2024-10",
  "qwen-max": "2024-09",
  "qwen-plus": "2024-09",
  "qwen2.5-72b-instruct": "2024-06",
  "qwen3-235b-a22b": "2024-12",
  "qwq-32b-preview": "2024-06",
  "qvq-32b": "2024-06",
  "grok-2-1212": "2024-10",
  "grok-3": "2024-12",
  "grok-3-fast": "2024-12",
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

export const VISION_MODEL_REGEXES = [
  /vision/,
  /gpt-5/,
  /gpt-4o/,
  /gpt-4\.1/,
  /gpt-4-turbo(?!.*preview)/,
  /claude.*[34]/,
  /claude-3-[57]/,
  /claude-[45]/,
  /gemini-1\.5/,
  /gemini-2\.[05]/,
  /gemini-3/,
  /gemini-exp/,
  /learnlm/,
  /qwen.*vl/,
  /qwen2\.5-vl/,
  /doubao.*vision/,
  /doubao-1-5-vision/,
  /doubao-1-5-thinking-vision/,
  /deepseek-vl/,
  /grok.*vision/,
  /grok-2-vision/,
  /grok-3/,
  /^dall-e/,
  /glm-4v/,
  /vl/i,
  /o1-2024-12-17/,
  /o3/,
  /o4-mini/,
  /qvq/,
];

export const EXCLUDE_VISION_MODEL_REGEXES = [/claude-3-5-haiku-20241022/];

const openaiModels = [
  // As of July 2024, gpt-4o-mini should be used in place of gpt-3.5-turbo,
  // as it is cheaper, more capable, multimodal, and just as fast. gpt-3.5-turbo is still available for use in the API.
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-instruct",
  "gpt-4",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0613",
  "gpt-4-turbo",
  "gpt-4-turbo-preview",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-1106-preview",
  "gpt-4-0125-preview",
  "gpt-4-vision-preview",
  "gpt-4.1",
  "gpt-4.1-2025-04-14",
  "gpt-4.1-mini",
  "gpt-4.1-mini-2025-04-14",
  "gpt-4.1-nano",
  "gpt-4.1-nano-2025-04-14",
  "gpt-4.5-preview",
  "gpt-4.5-preview-2025-02-27",
  "gpt-4o",
  "gpt-4o-2024-05-13",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-11-20",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4o-mini-search-preview",
  "chatgpt-4o-latest",
  // GPT-5 系列
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5-chat",
  "gpt-5.1",
  "gpt-5.1-instant",
  "gpt-5.1-thinking",
  "gpt-5.1-pro",
  "gpt-5.1-codex-max",
  "gpt-5.2",
  "gpt-5.2-instant",
  "gpt-5.2-thinking",
  "gpt-5.2-pro",
  // 推理模型系列
  "o1-2024-12-17",
  "o1-preview",
  "o1-mini",
  "o3",
  "o3-mini",
  "o3-mini-high",
  "o4-mini",
  // OSS 模型系列
  "gpt-oss-120b",
  "gpt-oss-20b",
  // 嵌入模型
  "text-embedding-3-large",
  "text-embedding-3-small",
  "text-embedding-ada-002",
  // 图像生成
  "dall-e-3",
  "dall-e-2",
  "gpt-image-1",
];

const googleModels = [
  // Gemini 3 系列
  "gemini-3-pro",
  "gemini-3-pro-001",
  "gemini-3-flash",
  "gemini-3-nano",
  // Gemini 2.5 系列
  "gemini-2.5-pro-exp-03-25",
  "gemini-2.5-pro-preview-03-25",
  "gemini-2.5-pro-preview-06-05",
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.5-pro",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash-preview-05-20-nothink",
  "gemini-2.5-flash",
  "gemini-2.5-flash-image-preview",
  // Gemini 2.0 系列
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-exp",
  // LearnLM 系列
  "learnlm-1.5-pro-experimental",
  // Gemini 1.5 系列
  "gemini-1.5-pro",
  "gemini-1.5-pro-002",
  "gemini-1.5-pro-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-8b",
  // Gemini Pro 系列
  "gemini-pro",
  // Gemma 系列
  "gemma-2-27b-it",
  "gemma-2-9b-it",
  "gemma-3-27b",
];

const anthropicModels = [
  // Claude 4.5 系列
  "claude-opus-4-5",
  "claude-opus-4-5-20251125",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20251121",
  // Claude 4.1 系列
  "claude-opus-4-1-20250805",
  // Claude 4 系列
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
  // Claude 3.7 系列
  "claude-3-7-sonnet-20250219",
  "claude-3-7-sonnet-20250219-thinking",
  // Claude 3.5 系列
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-5-sonnet-20240620",
  // Claude 3 系列
  "claude-3-opus-20240229",
  "claude-3-haiku-20240307",
];

const alibabaModes = [
  // Qwen 3 系列
  "qwen3-235b-a22b",
  "qwen3-235b-a22b-fp8",
  "qwen3-32b-fp8",
  "qwen3-30b-a3b-fp8",
  "qwen3-8b",
  // Qwen 2.5 系列
  "qwen2.5-72b-instruct",
  "qwen2.5-32b-instruct",
  "qwen2.5-14b-instruct",
  "qwen2.5-7b-instruct",
  "qwen2.5-coder-32b-instruct",
  // Qwen 2 系列
  "qwen2-72b-instruct",
  "qwen2-vl-72b-instruct",
  "qwen2-vl-7b-instruct",
  // 视觉模型
  "qwen2.5-vl-72b-instruct",
  "qwen-vl-plus",
  // 推理模型
  "qwq-32b-preview",
  "qwq-32b",
  "qvq-32b",
  // 服务版本 (DashScope)
  "qwen-max",
  "qwen-plus",
  "qwen-turbo",
  "qwen-coder-plus",
  "qwen3-coder-plus",
  // 嵌入模型
  "text-embedding-v2",
  "qwen3-embedding-8b",
  "qwen3-reranker-8b",
];

const moonshotModes = [
  // Kimi K2 系列
  "kimi-k2",
  "kimi-latest",
  "kimi-thinking-preview",
  // 经典版本
  "moonshot-v1-auto",
];

const deepseekModels = [
  // 官方模型
  "deepseek-chat",
  "deepseek-reasoner",
];

const xAIModes = [
  // Grok 3 系列
  "grok-3",
  "grok-3-fast",
  "grok-3-mini",
  "grok-3-mini-fast",
  // Grok 2 系列
  "grok-2-vision-1212",
  "grok-2-1212",
  "grok-vision-beta",
];

const siliconflowModels = [
  // DeepSeek 系列
  "deepseek-ai/DeepSeek-R1",
  "deepseek-ai/DeepSeek-V3",
  // Qwen 系列
  "Qwen/Qwen2.5-7B-Instruct",
  "Qwen/Qwen3-8B",
  // 嵌入模型
  "BAAI/bge-m3",
  // 图像生成
  "Kwai-Kolors/Kolors",
];

let seq = 1000; // 内置的模型序号生成器从1000开始
export const DEFAULT_MODELS = [
  ...openaiModels.map((name) => ({
    name,
    available: true,
    sorted: seq++, // Global sequence sort(index)
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.OpenAI.id,
      providerName: ServiceProvider.OpenAI.name,
      providerType: ServiceProvider.OpenAI.id,
      sorted: 1, // 这里是固定的，确保顺序与之前内置的版本一致
    },
  })),
  ...openaiModels.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.Azure.id,
      providerName: ServiceProvider.Azure.name,
      providerType: ServiceProvider.Azure.id,
      sorted: 2,
    },
  })),
  ...googleModels.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.Google.id,
      providerName: ServiceProvider.Google.name,
      providerType: ServiceProvider.Google.id,
      sorted: 3,
    },
  })),
  ...anthropicModels.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.Anthropic.id,
      providerName: ServiceProvider.Anthropic.name,
      providerType: ServiceProvider.Anthropic.id,
      sorted: 4,
    },
  })),
  ...alibabaModes.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.Alibaba.id,
      providerName: ServiceProvider.Alibaba.name,
      providerType: ServiceProvider.Alibaba.id,
      sorted: 5,
    },
  })),
  ...moonshotModes.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.MoonshotAI.id,
      providerName: ServiceProvider.MoonshotAI.name,
      providerType: ServiceProvider.MoonshotAI.id,
      sorted: 6,
    },
  })),
  ...xAIModes.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.XAI.id,
      providerName: ServiceProvider.XAI.name,
      providerType: ServiceProvider.XAI.id,
      sorted: 7,
    },
  })),
  ...deepseekModels.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.DeepSeek.id,
      providerName: ServiceProvider.DeepSeek.name,
      providerType: ServiceProvider.DeepSeek.id,
      sorted: 8,
    },
  })),
  ...siliconflowModels.map((name) => ({
    name,
    available: true,
    sorted: seq++,
    contextTokens: getModelContextTokens(name)?.contextTokens,
    provider: {
      id: ServiceProvider.SiliconFlow.id,
      providerName: ServiceProvider.SiliconFlow.name,
      providerType: ServiceProvider.SiliconFlow.id,
      sorted: 9,
    },
  })),
] as const;

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
