import {
  getModelCompressThreshold,
  getModelContextTokens,
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
  dynamicThreshold: number;
  reachedFixedThreshold: boolean;
  reachedDynamicThreshold: boolean;
  shouldCompress: boolean;
  approachingThreshold: boolean;
}

export interface CompactionPolicy {
  evaluate(input: CompressionPolicyInput): CompressionPolicyDecision;
}

class DefaultCompactionPolicy implements CompactionPolicy {
  evaluate(input: CompressionPolicyInput): CompressionPolicyDecision {
    const dynamicThreshold = getModelCompressThreshold(
      input.model,
      input.ratio,
    );
    const fixedThreshold = Math.max(0, input.fixedThreshold || 0);
    const modelContextWindow =
      getModelContextTokens(input.model)?.contextTokens || 0;
    const contextWindow = Math.max(
      modelContextWindow,
      dynamicThreshold,
      fixedThreshold,
      8192,
    );
    const reserveTokens = Math.max(
      1024,
      Math.min(16384, Math.floor(contextWindow * 0.2)),
    );
    const keepRecentTokens = Math.max(
      4000,
      Math.min(20000, Math.floor(contextWindow * 0.1)),
    );
    const reachedFixedThreshold =
      fixedThreshold > 0 && input.contextTokens >= fixedThreshold;
    const reachedDynamicThreshold = input.contextTokens >= dynamicThreshold;
    const meetsMessageRequirement =
      input.userMessageCount >= input.summaryMinUserMessages;
    const hasValidFixed = fixedThreshold > 0;
    const earliestThreshold = hasValidFixed
      ? Math.min(fixedThreshold, dynamicThreshold)
      : dynamicThreshold;

    return {
      contextWindow,
      reserveTokens,
      keepRecentTokens,
      dynamicThreshold,
      reachedFixedThreshold,
      reachedDynamicThreshold,
      shouldCompress:
        (reachedFixedThreshold || reachedDynamicThreshold) &&
        meetsMessageRequirement &&
        input.sendMemory,
      approachingThreshold:
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
