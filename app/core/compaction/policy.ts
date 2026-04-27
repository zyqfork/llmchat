import { getModelCompressThreshold } from "@/app/config/model-config";

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
    const reachedFixedThreshold = input.contextTokens >= input.fixedThreshold;
    const reachedDynamicThreshold = input.contextTokens >= dynamicThreshold;
    const meetsMessageRequirement =
      input.userMessageCount >= input.summaryMinUserMessages;

    return {
      dynamicThreshold,
      reachedFixedThreshold,
      reachedDynamicThreshold,
      shouldCompress:
        (reachedFixedThreshold || reachedDynamicThreshold) &&
        meetsMessageRequirement &&
        input.sendMemory,
      approachingThreshold:
        ((input.contextTokens >= input.fixedThreshold * 0.8 &&
          input.contextTokens < input.fixedThreshold) ||
          (input.contextTokens >= dynamicThreshold * 0.8 &&
            input.contextTokens < dynamicThreshold)) &&
        meetsMessageRequirement &&
        input.sendMemory,
    };
  }
}

const defaultCompactionPolicy = new DefaultCompactionPolicy();

export function getCompactionPolicy(): CompactionPolicy {
  return defaultCompactionPolicy;
}
