import {
  getModelCompressThreshold,
  getModelContextTokens,
  isStaleSilentCompressThreshold,
} from "@/app/config/model-config";

export interface CompressionPolicyInput {
  contextTokens: number;
  fixedThreshold: number;
  model: string;
  ratio?: number;
  userMessageCount: number;
  summaryMinUserMessages: number;
  sendMemory: boolean;
}

export interface CompressionPolicyDecision {
  contextWindow: number;
  reserveTokens: number;
  keepRecentTokens: number;
  /** 上下文未知或动态关闭（ratio=0）时为 null */
  dynamicThreshold: number | null;
  /** 模型上下文窗口是否已配置 */
  contextTokensKnown: boolean;
  reachedFixedThreshold: boolean;
  reachedDynamicThreshold: boolean;
  shouldCompress: boolean;
  approachingThreshold: boolean;
  /** 本次生效的压缩阈值（用于日志/UI） */
  effectiveThreshold: number | null;
}

export interface CompactionPolicy {
  evaluate(input: CompressionPolicyInput): CompressionPolicyDecision;
}

class DefaultCompactionPolicy implements CompactionPolicy {
  evaluate(input: CompressionPolicyInput): CompressionPolicyDecision {
    const contextConfig = getModelContextTokens(input.model);
    const modelContextWindow = contextConfig?.contextTokens || 0;
    const contextTokensKnown = modelContextWindow > 0;
    // 上下文未知或 ratio=0（关闭动态）时不返回动态阈值
    const dynamicThreshold = contextTokensKnown
      ? getModelCompressThreshold(input.model, input.ratio)
      : null;

    const rawFixed = Math.max(0, input.fixedThreshold || 0);
    // 陈旧静默默认 8192：上下文已知且动态阈值更高时忽略
    const staleSilentFixed = isStaleSilentCompressThreshold(
      rawFixed,
      dynamicThreshold,
    );
    const effectiveFixedThreshold = staleSilentFixed ? 0 : rawFixed;

    const contextWindow = Math.max(
      modelContextWindow,
      dynamicThreshold ?? 0,
      effectiveFixedThreshold,
      8192,
    );
    const reserveTokens = Math.max(1024, Math.floor(contextWindow * 0.2));
    const keepRecentTokens = Math.max(4000, Math.floor(contextWindow * 0.15));

    const reachedFixedThreshold =
      effectiveFixedThreshold > 0 &&
      input.contextTokens >= effectiveFixedThreshold;
    const reachedDynamicThreshold =
      dynamicThreshold != null && input.contextTokens >= dynamicThreshold;
    const meetsMessageRequirement =
      input.userMessageCount >= input.summaryMinUserMessages;

    // 生效阈值：动态优先展示；有有效固定阈值时取二者较小者（OR 语义）
    const thresholds = [effectiveFixedThreshold, dynamicThreshold].filter(
      (t): t is number => typeof t === "number" && t > 0,
    );
    const effectiveThreshold =
      thresholds.length > 0 ? Math.min(...thresholds) : null;
    const earliestThreshold = effectiveThreshold ?? Number.POSITIVE_INFINITY;

    // 自定义模型查不到上下文时：不自动压缩
    // ratio=0 且无有效固定阈值：不自动压缩（仅手动/溢出）
    const shouldCompress = contextTokensKnown
      ? (reachedFixedThreshold || reachedDynamicThreshold) &&
        meetsMessageRequirement &&
        input.sendMemory
      : false;

    return {
      contextWindow,
      reserveTokens,
      keepRecentTokens,
      dynamicThreshold,
      contextTokensKnown,
      reachedFixedThreshold,
      reachedDynamicThreshold,
      shouldCompress,
      effectiveThreshold,
      approachingThreshold:
        contextTokensKnown &&
        Number.isFinite(earliestThreshold) &&
        input.contextTokens >= earliestThreshold * 0.8 &&
        input.contextTokens < earliestThreshold &&
        meetsMessageRequirement &&
        input.sendMemory,
    };
  }
}

const defaultCompactionPolicy = new DefaultCompactionPolicy();

export function getCompactionPolicy(): CompactionPolicy {
  return defaultCompactionPolicy;
}
