import { getCompactionPolicy } from "./policy";
import {
  getModelCompressThreshold,
  isModelContextConfigured,
} from "@/app/config/model-config";

describe("compaction policy", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("should compress when fixed threshold is reached", () => {
    const decision = getCompactionPolicy().evaluate({
      contextTokens: 9000,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.9,
      userMessageCount: 2,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

    expect(decision.contextTokensKnown).toBe(true);
    expect(decision.reachedFixedThreshold).toBe(true);
    expect(decision.shouldCompress).toBe(true);
  });

  it("should not compress when sendMemory is disabled", () => {
    const decision = getCompactionPolicy().evaluate({
      contextTokens: 9000,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.9,
      userMessageCount: 2,
      summaryMinUserMessages: 1,
      sendMemory: false,
    });

    expect(decision.reachedFixedThreshold).toBe(true);
    expect(decision.shouldCompress).toBe(false);
  });

  it("should mark approaching threshold near 80 percent", () => {
    const decision = getCompactionPolicy().evaluate({
      contextTokens: 7600,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.9,
      userMessageCount: 2,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

    expect(decision.reachedFixedThreshold).toBe(false);
    expect(decision.approachingThreshold).toBe(true);
  });

  it("should not auto-compress when custom model context is unknown", () => {
    const model = "qwen3.8-27b-custom-unknown";
    expect(isModelContextConfigured(model)).toBe(false);
    expect(getModelCompressThreshold(model, 0.9)).toBeNull();

    const decision = getCompactionPolicy().evaluate({
      contextTokens: 50000,
      fixedThreshold: 8192,
      model,
      ratio: 0.9,
      userMessageCount: 5,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

    expect(decision.contextTokensKnown).toBe(false);
    expect(decision.dynamicThreshold).toBeNull();
    expect(decision.shouldCompress).toBe(false);
    expect(decision.approachingThreshold).toBe(false);
  });

  it("should ignore stale silent 8192 fixed threshold when context is known", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );

    const model = "qwen3.8-27b";
    expect(isModelContextConfigured(model)).toBe(true);
    // 256k * 0.9 = 230400（无 128k 硬上限）
    expect(getModelCompressThreshold(model, 0.9)).toBe(230400);

    const early = getCompactionPolicy().evaluate({
      contextTokens: 9000,
      fixedThreshold: 8192,
      model,
      ratio: 0.9,
      userMessageCount: 3,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });
    expect(early.contextTokensKnown).toBe(true);
    expect(early.dynamicThreshold).toBe(230400);
    expect(early.shouldCompress).toBe(false);

    const atDynamic = getCompactionPolicy().evaluate({
      contextTokens: 240000,
      fixedThreshold: 8192,
      model,
      ratio: 0.9,
      userMessageCount: 3,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });
    expect(atDynamic.reachedDynamicThreshold).toBe(true);
    expect(atDynamic.shouldCompress).toBe(true);
  });

  it("should honor user-set custom fixed threshold after context is configured", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );

    const decision = getCompactionPolicy().evaluate({
      contextTokens: 50000,
      fixedThreshold: 40000,
      model: "qwen3.8-27b",
      ratio: 0.9,
      userMessageCount: 3,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

    expect(decision.reachedFixedThreshold).toBe(true);
    expect(decision.shouldCompress).toBe(true);
  });

  it("should not auto-compress when ratio is 0 (dynamic off) and no fixed threshold", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );

    const decision = getCompactionPolicy().evaluate({
      contextTokens: 250000,
      fixedThreshold: 0,
      model: "qwen3.8-27b",
      ratio: 0,
      userMessageCount: 5,
      summaryMinUserMessages: 3,
      sendMemory: true,
    });

    expect(decision.contextTokensKnown).toBe(true);
    expect(decision.dynamicThreshold).toBeNull();
    expect(decision.shouldCompress).toBe(false);
  });
});
