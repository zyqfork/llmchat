// 模型能力配置
export interface ModelCapabilities {
  vision?: boolean; // 视觉能力
  web?: boolean; // 联网能力
  reasoning?: boolean; // 推理能力
  tools?: boolean; // 工具调用能力
  embedding?: boolean; // 嵌入能力
  thinkingType?: "gemini" | "claude"; // thinking实现类型
}

// 基于模型名称的能力映射
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // OpenAI 模型
  // GPT-4 系列
  "gpt-4o": { vision: true, web: true, reasoning: false, tools: true },
  "gpt-4o-2024-11-20": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gpt-4o-2024-08-06": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gpt-4o-2024-05-13": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gpt-4o-mini": { vision: true, web: true, reasoning: false, tools: true },
  "gpt-4o-mini-search-preview": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gpt-4.5-preview": { vision: true, web: true, reasoning: false, tools: true },
  "gpt-4.1": { vision: true, web: true, reasoning: false, tools: true },
  "gpt-4.1-mini": { vision: true, web: true, reasoning: false, tools: true },
  "gpt-4-turbo": { vision: true, web: false, reasoning: false, tools: true },
  "gpt-4-turbo-2024-04-09": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-4-turbo-preview": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-4-0125-preview": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-4-1106-preview": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-4": { vision: true, web: false, reasoning: false, tools: true },
  "gpt-4-0613": { vision: true, web: false, reasoning: false, tools: true },
  "gpt-4-32k": { vision: false, web: false, reasoning: false, tools: true },
  "gpt-4-32k-0613": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "chatgpt-4o-latest": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },

  // 推理模型系列
  "o1-2024-12-17": { vision: true, web: false, reasoning: true, tools: false },
  "o1-preview": { vision: false, web: false, reasoning: true, tools: false },
  "o1-mini": { vision: false, web: false, reasoning: true, tools: false },
  o3: { vision: true, web: true, reasoning: true, tools: true },
  "o3-mini": { vision: true, web: true, reasoning: true, tools: true },
  "o3-mini-high": { vision: true, web: true, reasoning: true, tools: true },
  "o4-mini": { vision: true, web: true, reasoning: true, tools: true },

  // GPT-3.5 系列
  "gpt-3.5-turbo": { vision: false, web: false, reasoning: false, tools: true },
  "gpt-3.5-turbo-0125": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-3.5-turbo-1106": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-3.5-turbo-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
  },

  // 嵌入模型
  "text-embedding-3-large": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },
  "text-embedding-3-small": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },
  "text-embedding-ada-002": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },

  // 图像生成
  "dall-e-3": { vision: false, web: false, reasoning: false, tools: false },
  "dall-e-2": { vision: false, web: false, reasoning: false, tools: false },
  "gpt-image-1": { vision: false, web: false, reasoning: false, tools: false },

  // Google Gemini 模型
  // Gemini 2.5 系列
  "gemini-2.5-pro-exp-03-25": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-pro-preview-03-25": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-pro-preview-06-05": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-pro-preview-05-06": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-pro": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-flash-preview-05-20": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-flash-preview-05-20-nothink": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gemini-2.5-flash": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },
  "gemini-2.5-flash-lite": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "gemini",
  },

  // Gemini 2.0 系列
  "gemini-2.0-flash": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gemini-2.0-flash-001": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gemini-2.0-flash-lite": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "gemini-2.0-flash-exp": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },

  // LearnLM 系列
  "learnlm-1.5-pro-experimental": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },

  // Gemini 1.5 系列
  "gemini-1.5-pro": { vision: true, web: false, reasoning: false, tools: true },
  "gemini-1.5-pro-002": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gemini-1.5-pro-001": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gemini-1.5-flash": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gemini-1.5-flash-002": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gemini-1.5-flash-001": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gemini-1.5-flash-8b": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },

  // Gemini Pro 系列
  "gemini-pro": { vision: true, web: false, reasoning: false, tools: true },

  // Gemma 系列
  "gemma-2-27b-it": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
  },
  "gemma-2-9b-it": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
  },
  "gemma-3-27b": { vision: true, web: false, reasoning: false, tools: false },

  // Anthropic Claude 模型
  // Claude 4 系列
  "claude-sonnet-4-20250514": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "claude",
  },
  "claude-opus-4-20250514": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "claude",
  },

  // Claude 3.7 系列
  "claude-3-7-sonnet-20250219": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "claude",
  },
  "claude-3-7-sonnet-20250219-thinking": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
    thinkingType: "claude",
  },

  // Claude 3.5 系列
  "claude-3-5-sonnet-20241022": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "claude-3-5-haiku-20241022": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "claude-3-5-sonnet-20240620": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },

  // Claude 3 系列
  "claude-3-opus-20240229": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "claude-3-haiku-20240307": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },

  // 字节跳动 Doubao 模型
  // Doubao 1.5 系列
  "doubao-1-5-vision-pro-32k-250115": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-1-5-pro-32k-250115": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-1-5-pro-32k-character-250228": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-1-5-pro-256k-250115": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-1-5-lite-32k-250115": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-1-5-thinking-pro-m": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "doubao-1-5-thinking-vision-pro": {
    vision: true,
    web: false,
    reasoning: true,
    tools: false,
  },

  // Doubao Pro 系列
  "doubao-pro-32k-241215": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-pro-32k-functioncall-241028": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-pro-32k-character-241215": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-pro-256k-241115": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },

  // Doubao Lite 系列
  "doubao-lite-4k-character-240828": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-lite-32k-240828": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-lite-32k-character-241015": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "doubao-lite-128k-240828": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },

  // 视觉模型
  "doubao-vision-lite-32k-241015": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },

  // 嵌入模型
  "doubao-embedding-large-text-240915": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },
  "doubao-embedding-text-240715": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },
  "doubao-embedding-vision-241215": {
    vision: true,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },

  // DeepSeek 系列 (豆包平台)
  "deepseek-r1-250120": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-r1-distill-qwen-32b-250120": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-r1-distill-qwen-7b-250120": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-v3-250324": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },

  // 阿里云 Qwen 模型
  // Qwen 3 系列
  "qwen3-235b-a22b": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen3-235b-a22b-fp8": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen3-32b-fp8": { vision: false, web: false, reasoning: false, tools: true },
  "qwen3-30b-a3b-fp8": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen3-8b": { vision: false, web: false, reasoning: false, tools: true },

  // Qwen 2.5 系列
  "qwen2.5-72b-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen2.5-32b-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen2.5-14b-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen2.5-7b-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen2.5-coder-32b-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },

  // Qwen 2 系列
  "qwen2-72b-instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen2-vl-72b-instruct": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen2-vl-7b-instruct": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },

  // 视觉模型
  "qwen2.5-vl-72b-instruct": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen-vl-plus": { vision: true, web: false, reasoning: false, tools: true },

  // 推理模型
  "qwq-32b-preview": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "qwq-32b": { vision: false, web: false, reasoning: true, tools: false },
  "qvq-32b": { vision: true, web: false, reasoning: true, tools: false },

  // 服务版本 (DashScope)
  "qwen-max": { vision: false, web: false, reasoning: false, tools: true },
  "qwen-plus": { vision: false, web: false, reasoning: false, tools: true },
  "qwen-turbo": { vision: false, web: false, reasoning: false, tools: true },
  "qwen-coder-plus": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "qwen3-coder-plus": {
    vision: true,
    web: false,
    reasoning: false,
    tools: true,
  },

  // 嵌入模型
  "text-embedding-v2": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },
  "qwen3-embedding-8b": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },
  "qwen3-reranker-8b": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },

  // Moonshot Kimi 模型
  // Kimi K2 系列
  "kimi-k2": { vision: false, web: true, reasoning: false, tools: true },
  "kimi-latest": { vision: false, web: true, reasoning: false, tools: true },
  "kimi-thinking-preview": {
    vision: false,
    web: true,
    reasoning: true,
    tools: false,
  },

  // 经典版本
  "moonshot-v1-auto": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },

  // DeepSeek 模型
  // 官方模型
  "deepseek-chat": { vision: false, web: false, reasoning: false, tools: true },
  "deepseek-reasoner": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },

  // XAI Grok 模型
  // Grok 3 系列
  "grok-3": { vision: false, web: true, reasoning: false, tools: true },
  "grok-3-fast": { vision: false, web: true, reasoning: false, tools: true },
  "grok-3-mini": { vision: false, web: true, reasoning: false, tools: true },
  "grok-3-mini-fast": {
    vision: false,
    web: true,
    reasoning: false,
    tools: true,
  },

  // Grok 2 系列
  "grok-2-vision-1212": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },
  "grok-2-1212": { vision: false, web: true, reasoning: false, tools: true },
  "grok-vision-beta": {
    vision: true,
    web: true,
    reasoning: false,
    tools: true,
  },

  // SiliconFlow 模型
  // DeepSeek 系列
  "deepseek-ai/DeepSeek-R1": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-V3": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },

  // Qwen 系列
  "Qwen/Qwen2.5-7B-Instruct": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "Qwen/Qwen3-8B": { vision: false, web: false, reasoning: false, tools: true },

  // 嵌入模型
  "BAAI/bge-m3": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
    embedding: true,
  },

  // 图像生成
  "Kwai-Kolors/Kolors": {
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
  },
};

// 获取模型能力的函数
export function getModelCapabilities(modelName: string): ModelCapabilities {
  return MODEL_CAPABILITIES[modelName] || {};
}

// 检查模型是否有特定能力
export function hasCapability(
  modelName: string,
  capability: keyof ModelCapabilities,
): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities[capability] === true;
}

// Gemini 搜索模型正则表达式（参考 Cherry Studio）
// 支持 gemini-2.x 和 gemini-1.5 系列
export const GEMINI_SEARCH_REGEX = new RegExp("gemini-(2\\.|1\\.5)", "i");

// 检测模型是否支持网络搜索
export function isWebSearchModel(modelName: string): boolean {
  console.log(
    "[ModelCapabilities] 🔍 Checking if model supports web search:",
    modelName,
  );

  // Gemini 2.x 系列模型支持内置搜索
  if (GEMINI_SEARCH_REGEX.test(modelName)) {
    console.log("[ModelCapabilities] ✅ Model matches Gemini 2.x regex");
    return true;
  }

  // 特定的 Gemini 搜索模型
  const geminiSearchModels = [
    "gemini-2.0-flash-search",
    "gemini-2.0-flash-exp-search",
    "gemini-2.0-pro-exp-02-05-search",
  ];

  if (geminiSearchModels.includes(modelName)) {
    console.log(
      "[ModelCapabilities] ✅ Model is in specific search models list",
    );
    return true;
  }

  console.log("[ModelCapabilities] ❌ Model does not support web search");
  // 其他支持搜索的模型可以在这里添加
  return false;
}

// 获取增强的模型能力（包含基于正则的检测）
export function getEnhancedModelCapabilities(
  modelName: string,
): ModelCapabilities {
  const configuredCapabilities = getModelCapabilities(modelName);

  // 如果已有配置，直接返回
  if (Object.keys(configuredCapabilities).length > 0) {
    return configuredCapabilities;
  }

  // 基于模型名称的启发式检测
  const capabilities: ModelCapabilities = {};

  // 视觉能力检测
  if (/vision|vl|gpt-4o|claude-3|gemini|qwen.*vl|dall-e/i.test(modelName)) {
    capabilities.vision = true;
  }

  // 网络搜索能力检测
  if (isWebSearchModel(modelName)) {
    capabilities.web = true;
  }

  // 推理能力检测
  if (
    /o1|o3|o4|reasoning|thinking|qwq|qvq|deepseek-r1|gemini-2\.5/i.test(
      modelName,
    )
  ) {
    capabilities.reasoning = true;

    // 设置thinking实现类型
    if (/gemini/i.test(modelName)) {
      capabilities.thinkingType = "gemini";
    } else if (/claude/i.test(modelName)) {
      capabilities.thinkingType = "claude";
    }
  }

  // 联网能力检测
  if (/search|web|grok|gemini|claude-4|claude-3-7/i.test(modelName)) {
    capabilities.web = true;
  }

  // 工具调用能力检测（大部分现代模型都支持）
  if (!/embedding|dall-e|o1|o3-mini(?!-high)|instruct/i.test(modelName)) {
    capabilities.tools = true;
  }

  // 嵌入能力检测
  if (/embedding|embed/i.test(modelName)) {
    capabilities.embedding = true;
  }

  return capabilities;
}

// 获取模型能力（包含自定义配置）
export function getModelCapabilitiesWithCustomConfig(
  modelName: string,
): ModelCapabilities {
  // 先获取默认能力
  const defaultCapabilities = getEnhancedModelCapabilities(modelName);

  // 尝试从本地存储获取自定义配置
  const capabilitiesKey = `model_capabilities_${modelName}`;

  // 检查是否在浏览器环境中
  if (typeof window !== "undefined" && window.localStorage) {
    const customCapabilities = localStorage.getItem(capabilitiesKey);

    if (customCapabilities) {
      try {
        return JSON.parse(customCapabilities);
      } catch (e) {
        console.warn("[ModelCapabilities] 解析自定义能力配置失败:", e);
      }
    }
  }

  return defaultCapabilities;
}
