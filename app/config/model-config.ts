import { formatTokenCount as formatPiWebUiTokenCount } from "../utils/pi-web-ui-compat";
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
  reasoning?: boolean; // 推理能力
  tools?: boolean; // 工具调用能力
  reasoningField?: string; // 推理内容字段名（从 interleaved.field 获取）
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
  if (
    /o1|o3|o4|reasoning|thinking|qwq|qvq|deepseek-r1|gemini-2\.5|claude-3-7|claude-4|claude-opus-4/i.test(
      modelName,
    )
  ) {
    if (!/image/i.test(modelName)) {
      capabilities.reasoning = true;
    }
  }

  // 工具调用能力检测（大部分现代模型都支持）
  if (!/dall-e|o1|o3-mini(?!-high)|instruct/i.test(modelName)) {
    capabilities.tools = true;
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

  let capabilities: ModelCapabilities;

  if (!model) {
    // 如果配置中没有，使用启发式检测作为基础
    capabilities = getEnhancedModelCapabilities(modelName);
  } else {
    capabilities = {
      vision: false,
      reasoning: false,
      tools: false,
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

      // 从 interleaved.field 获取推理内容字段名
      if (
        model.interleaved &&
        typeof model.interleaved === "object" &&
        "field" in model.interleaved &&
        typeof model.interleaved.field === "string"
      ) {
        capabilities.reasoningField = model.interleaved.field;
      }
    }

    // 工具调用能力：检查 tool_call 字段
    if (model.tool_call === true) {
      capabilities.tools = true;
    }
  }

  // 始终检查 localStorage 中的自定义配置，用户手动勾选的能力优先级最高
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
 * 检测模型是否支持网络搜索
 */
export function isWebSearchModel(modelName: string): boolean {
  // Gemini 2.x 系列模型支持内置搜索
  if (/gemini-(2\\.|1\\.5)/i.test(modelName)) {
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
  return formatPiWebUiTokenCount(tokens);
}

/**
 * 根据模型的上下文Token数自动计算压缩阈值
 */
export function getModelCompressThreshold(
  modelName: string,
  ratio: number = 0.5,
): number {
  const DEFAULT_THRESHOLD = 8192;

  const contextConfig = getModelContextTokens(modelName);
  if (!contextConfig?.contextTokens) {
    return DEFAULT_THRESHOLD;
  }

  const safeRatio = Math.min(0.9, Math.max(0.1, ratio || 0.5));
  const threshold = Math.floor(contextConfig.contextTokens * safeRatio);

  // 限制最大值为 128k，避免超大模型的压缩阈值过高
  // 移除最小值限制，允许用户设置较小的压缩阈值用于测试
  return Math.min(threshold, 128000);
}

/**
 * OpenAI 兼容 API 中常用的推理内容字段名
 * 当模型未在配置中指定 reasoningField 时，按顺序尝试这些字段以解析推理内容
 * - reasoning_content: DeepSeek R1、Kimi、部分国产推理模型
 * - reasoning: 通用简化字段名
 * - thinking: 部分厂商使用
 * - thinking_content: GLM、智谱等
 * - thought_content: 部分开源模型
 * - thought: 简化字段名
 */
export const REASONING_FIELD_CANDIDATES = [
  "reasoning_content",
  "reasoning",
  "thinking",
  "thinking_content",
  "thought_content",
  "thought",
] as const;

/**
 * 从流式响应中提取推理内容
 * @param part AI SDK 的流式响应部分
 * @param reasoningField 推理内容字段名（可选）。若未指定，则依次尝试 REASONING_FIELD_CANDIDATES 中的常用字段
 * @returns 推理内容的增量文本，如果没有则返回 null
 */
export function extractReasoningContent(
  part: any,
  reasoningField?: string,
): string | null {
  if (!part) {
    return null;
  }

  const fieldsToTry: string[] = reasoningField
    ? [reasoningField]
    : [...REASONING_FIELD_CANDIDATES];

  try {
    for (const field of fieldsToTry) {
      const result = extractFromField(part, field);
      if (result !== null) {
        return result;
      }
    }
  } catch (error) {
    // 静默处理错误，避免影响主流程
    console.warn("[Model Config] Failed to extract reasoning content:", error);
  }

  return null;
}

/**
 * 从指定字段提取推理内容
 */
function extractFromField(part: any, reasoningField: string): string | null {
  // 方法1: 从 experimental_providerMetadata.rawResponse 中提取
  // OpenAI 兼容格式：choices[0].delta[reasoningField]
  const rawResponse = part.experimental_providerMetadata?.rawResponse;
  if (rawResponse?.choices?.[0]?.delta) {
    const delta = rawResponse.choices[0].delta;
    if (reasoningField in delta && typeof delta[reasoningField] === "string") {
      return delta[reasoningField];
    }
  }

  // 方法2: 从 part.delta 直接提取（text-delta 时 delta 可能包含 reasoning_content）
  if (part.delta && reasoningField in part.delta) {
    const value = part.delta[reasoningField];
    if (typeof value === "string") {
      return value;
    }
  }

  // 方法3: 直接从 part 中提取（某些 SDK 可能直接暴露）
  if (part[reasoningField] && typeof part[reasoningField] === "string") {
    return part[reasoningField];
  }

  // 方法4: 从 rawPart 中提取（备用方案）
  if (part.rawPart?.delta) {
    const delta = part.rawPart.delta;
    if (reasoningField in delta && typeof delta[reasoningField] === "string") {
      return delta[reasoningField];
    }
  }

  return null;
}

/**
 * 保存自定义模型能力配置
 * @param modelName 模型名称
 * @param capabilities 模型能力配置
 */
export function saveCustomModelCapabilities(
  modelName: string,
  capabilities: Partial<ModelCapabilities>,
): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_capabilities_${modelName}`;
    localStorage.setItem(customKey, JSON.stringify(capabilities));
  }
}

/**
 * 删除自定义模型能力配置
 * @param modelName 模型名称
 */
export function removeCustomModelCapabilities(modelName: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_capabilities_${modelName}`;
    localStorage.removeItem(customKey);
  }
}
