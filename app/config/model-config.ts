/**
 * 模型配置统一管理
 * 基于 models-config.ts 提供统一的模型能力和上下文配置接口
 */

// 尝试导入生成的配置
let MODELS_DEV_CONFIG: Record<string, any> = {};

try {
  const generatedConfig = require("./generated/models-config");
  MODELS_DEV_CONFIG = generatedConfig.MODELS_DEV_CONFIG || {};
} catch (error) {
  console.warn("Generated models config not found");
}

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 模型能力接口
 */
export interface ModelCapabilities {
  vision?: boolean; // 视觉能力
  web?: boolean; // 联网能力
  reasoning?: boolean; // 推理能力
  tools?: boolean; // 工具调用能力
  embedding?: boolean; // 嵌入能力
  thinkingType?: "gemini" | "claude"; // thinking实现类型
  reasoningField?: string; // 推理字段名
}

/**
 * 模型上下文配置接口
 */
export interface ModelContextConfig {
  contextTokens: number; // 上下文窗口大小（输入+输出）
  maxOutputTokens?: number; // 最大输出Token数
  description?: string; // 模型描述
}

// ============================================================================
// 内部辅助函数
// ============================================================================

/**
 * 从配置中查找模型数据
 *
 * 配置结构：
 * MODELS_DEV_CONFIG = {
 *   [providerId]: {           // 厂商ID，如 "openai", "zai"
 *     id: string,
 *     name: string,
 *     models: {
 *       [modelId]: {          // 模型ID，如 "gpt-4", "glm-4.7"
 *         id: string,
 *         name: string,
 *         reasoning: boolean,  // 是否支持推理
 *         tool_call: boolean,  // 是否支持工具调用
 *         modalities: {
 *           input: string[],   // 输入模态，如 ["text", "image", "video"]
 *           output: string[]
 *         },
 *         interleaved: {
 *           field: string      // 思考内容字段名，如 "reasoning_content"
 *         },
 *         limit: {
 *           context: number,   // 上下文窗口大小
 *           output: number     // 最大输出Token数
 *         },
 *         ...
 *       }
 *     }
 *   }
 * }
 *
 * @param modelId 模型ID
 * @param providerId 可选的厂商ID，如果提供则优先在该厂商下查找
 * @returns 模型配置对象或 null
 */
function findModelInConfig(modelId: string, providerId?: string): any | null {
  // 如果提供了厂商ID，优先在该厂商下查找
  if (providerId) {
    const provider = MODELS_DEV_CONFIG[providerId.toLowerCase()];
    if (
      provider &&
      typeof provider === "object" &&
      "models" in provider &&
      provider.models &&
      provider.models[modelId]
    ) {
      return provider.models[modelId];
    }
  }

  // 如果没有提供厂商ID，或在指定厂商下没找到，则遍历所有厂商查找
  for (const provider of Object.values(MODELS_DEV_CONFIG)) {
    if (
      provider &&
      typeof provider === "object" &&
      "models" in provider &&
      provider.models &&
      provider.models[modelId]
    ) {
      return provider.models[modelId];
    }
  }

  return null;
}

// ============================================================================
// 模型能力相关函数
// ============================================================================

/**
 * 获取增强的模型能力（包含基于正则的检测）
 * 用于配置中不存在的模型
 */
export function getEnhancedModelCapabilities(
  modelName: string,
): ModelCapabilities {
  const capabilities: ModelCapabilities = {};

  // 视觉能力检测
  if (/vision|vl|gpt-4o|claude-3|gemini|qwen.*vl|dall-e/i.test(modelName)) {
    capabilities.vision = true;
  }

  // 推理能力检测
  const isClaude37Or4 = /claude-3-7|claude-4|claude-opus-4/i.test(modelName);

  if (
    /o1|o3|o4|reasoning|thinking|qwq|qvq|deepseek-r1|gemini-2\.5/i.test(
      modelName,
    ) ||
    isClaude37Or4
  ) {
    if (!/image/i.test(modelName)) {
      capabilities.reasoning = true;

      // 设置thinking实现类型
      if (/gemini/i.test(modelName)) {
        capabilities.thinkingType = "gemini";
      } else if (/claude/i.test(modelName)) {
        capabilities.thinkingType = "claude";
      }
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

/**
 * 获取模型能力（基于生成的配置）
 * @param modelName 模型名称
 * @param providerName 可选的厂商名称，如果提供则优先在该厂商下查找
 */
export function getModelCapabilities(
  modelName: string,
  providerName?: string,
): ModelCapabilities {
  const model = findModelInConfig(modelName, providerName);

  if (!model) {
    // 如果配置中没有，使用启发式检测
    return getEnhancedModelCapabilities(modelName);
  }

  const capabilities: ModelCapabilities = {
    vision: false,
    reasoning: false,
    tools: false,
    embedding: false,
  };

  // 视觉能力：检查 modalities.input 是否包含 "image"
  if (
    model.modalities?.input &&
    Array.isArray(model.modalities.input) &&
    model.modalities.input.includes("image")
  ) {
    capabilities.vision = true;
  }

  // 推理能力：检查 reasoning 字段
  if (model.reasoning === true) {
    capabilities.reasoning = true;

    // 设置 thinking 类型
    if (/gemini/i.test(modelName)) {
      capabilities.thinkingType = "gemini";
    } else if (/claude/i.test(modelName)) {
      capabilities.thinkingType = "claude";
    }
  }

  // 工具调用能力：检查 tool_call 字段
  if (model.tool_call === true) {
    capabilities.tools = true;
  }

  // 嵌入能力：检查 family 是否包含 "embedding"
  if (model.family && /embedding/i.test(model.family)) {
    capabilities.embedding = true;
  }

  // 推理字段名：检查 interleaved.field
  if (model.interleaved?.field) {
    capabilities.reasoningField = model.interleaved.field;
  }

  // 检查是否有自定义配置
  if (typeof window !== "undefined" && window.localStorage) {
    const customKey = `model_capabilities_${modelName}`;
    try {
      const stored = window.localStorage.getItem(customKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ModelCapabilities>;
        return { ...capabilities, ...parsed };
      }
    } catch {
      // 静默处理解析错误
    }
  }

  return capabilities;
}

/**
 * 检查模型是否有特定能力
 */
export function hasCapability(
  modelName: string,
  capability: keyof ModelCapabilities,
): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities[capability] === true;
}

/**
 * Gemini 搜索模型正则表达式
 */
export const GEMINI_SEARCH_REGEX = new RegExp("gemini-(2\\.|1\\.5)", "i");

/**
 * 检测模型是否支持网络搜索
 */
export function isWebSearchModel(modelName: string): boolean {
  // Gemini 2.x 系列模型支持内置搜索
  if (GEMINI_SEARCH_REGEX.test(modelName)) {
    return true;
  }

  // 特定的 Gemini 搜索模型
  const geminiSearchModels = [
    "gemini-2.0-flash-search",
    "gemini-2.0-flash-exp-search",
    "gemini-2.0-pro-exp-02-05-search",
  ];

  if (geminiSearchModels.includes(modelName)) {
    return true;
  }

  return false;
}

// ============================================================================
// 模型上下文相关函数
// ============================================================================

/**
 * 获取模型上下文Token数配置
 * @param modelName 模型名称
 * @param providerName 可选的厂商名称，如果提供则优先在该厂商下查找
 */
export function getModelContextTokens(
  modelName: string,
  providerName?: string,
): ModelContextConfig | null {
  // 检查是否有自定义配置
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_context_tokens_${modelName}`;
    const customConfig = localStorage.getItem(customKey);
    if (customConfig) {
      try {
        const parsed = JSON.parse(customConfig);
        if (typeof parsed === "number") {
          return { contextTokens: parsed };
        } else if (parsed && typeof parsed.contextTokens === "number") {
          return parsed;
        }
      } catch (e) {
        // 静默处理解析错误
      }
    }
  }

  // 从配置中获取
  const model = findModelInConfig(modelName, providerName);
  if (!model || !model.limit) {
    return null;
  }

  const config: ModelContextConfig = {
    contextTokens: model.limit.context || 0,
  };

  if (model.limit.output) {
    config.maxOutputTokens = model.limit.output;
  }

  if (model.name) {
    config.description = model.name;
  }

  return config;
}

/**
 * 保存自定义上下文Token数配置
 */
export function saveCustomContextTokens(
  modelName: string,
  contextTokens: number,
): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_context_tokens_${modelName}`;
    const config: ModelContextConfig = { contextTokens };
    localStorage.setItem(customKey, JSON.stringify(config));
  }
}

/**
 * 删除自定义上下文Token数配置
 */
export function removeCustomContextTokens(modelName: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_context_tokens_${modelName}`;
    localStorage.removeItem(customKey);
  }
}

/**
 * 格式化Token数显示
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
}

/**
 * 根据模型的上下文Token数自动计算压缩阈值
 */
export function getModelCompressThreshold(modelName: string): number {
  const DEFAULT_THRESHOLD = 8000;

  const contextConfig = getModelContextTokens(modelName);
  if (!contextConfig?.contextTokens) {
    return DEFAULT_THRESHOLD;
  }

  // 使用上下文窗口的 15% 作为压缩阈值
  const threshold = Math.floor(contextConfig.contextTokens * 0.15);

  // 设置合理的上下限：最小8K，最大32K
  return Math.max(8000, Math.min(threshold, 32000));
}
