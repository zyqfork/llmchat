import {
  getModelCompressThreshold,
  isModelContextConfigured,
  LEGACY_SILENT_COMPRESS_THRESHOLD,
} from "./model-config";
import { getCompactionPolicy } from "../core/compaction/policy";

/**
 * 验证自定义模型 qwen3.8-27b（用户称上下文 256k）在不同配置下的压缩触发行为。
 */
describe("qwen3.8-27b context compaction behavior", () => {
  const model = "qwen3.8-27b";

  afterEach(() => {
    window.localStorage.clear();
  });

  const evaluate = (contextTokens: number, fixedThreshold: number) =>
    getCompactionPolicy().evaluate({
      contextTokens,
      fixedThreshold,
      model,
      ratio: 0.9,
      userMessageCount: 10,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

  test("未配置上下文：不再静默 8192，也不自动压缩", () => {
    expect(isModelContextConfigured(model)).toBe(false);
    expect(getModelCompressThreshold(model, 0.9)).toBeNull();

    // 历史上这里会在 9k 就触发压缩
    const d = evaluate(9000, LEGACY_SILENT_COMPRESS_THRESHOLD);
    expect(d.contextTokensKnown).toBe(false);
    expect(d.dynamicThreshold).toBeNull();
    expect(d.shouldCompress).toBe(false);
  });

  test("配置 256k 后：9k 不压缩，陈旧 8192 固定阈值被忽略", () => {
    window.localStorage.setItem(
      `model_context_tokens_${model}`,
      JSON.stringify({ contextTokens: 256000 }),
    );

    expect(isModelContextConfigured(model)).toBe(true);
    // 256k*0.9=230400，已去掉 128k 硬上限
    expect(getModelCompressThreshold(model, 0.9)).toBe(230400);

    const early = evaluate(9000, LEGACY_SILENT_COMPRESS_THRESHOLD);
    expect(early.contextTokensKnown).toBe(true);
    expect(early.dynamicThreshold).toBe(230400);
    expect(early.reachedFixedThreshold).toBe(false);
    expect(early.reachedDynamicThreshold).toBe(false);
    expect(early.shouldCompress).toBe(false);
  });

  test("配置 256k 后：超过动态阈值 230400 才自动压缩", () => {
    window.localStorage.setItem(
      `model_context_tokens_${model}`,
      JSON.stringify({ contextTokens: 256000 }),
    );

    const under = evaluate(200000, 0);
    expect(under.shouldCompress).toBe(false);

    const over = evaluate(240000, 0);
    expect(over.reachedDynamicThreshold).toBe(true);
    expect(over.shouldCompress).toBe(true);
  });

  test("配置 256k 后：用户自定义固定阈值仍然生效", () => {
    window.localStorage.setItem(
      `model_context_tokens_${model}`,
      JSON.stringify({ contextTokens: 256000 }),
    );

    const d = evaluate(45000, 40000);
    expect(d.reachedFixedThreshold).toBe(true);
    expect(d.shouldCompress).toBe(true);
  });

  test("目录内模型 gpt-4o-mini 行为保持正常", () => {
    // generated config: context 128000, ratio 0.5 → 64000
    expect(getModelCompressThreshold("gpt-4o-mini", 0.5)).toBe(64000);

    const under = getCompactionPolicy().evaluate({
      contextTokens: 20000,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.5,
      userMessageCount: 3,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });
    // fixed=8000 < 20000，且 8000 只有在 dynamic 也 >8192 时才当陈旧值
    // dynamic=64000 > 8192，fixed=8000 !== 8192 → 仍按固定阈值触发
    expect(under.reachedFixedThreshold).toBe(true);
    expect(under.shouldCompress).toBe(true);

    const stale = getCompactionPolicy().evaluate({
      contextTokens: 20000,
      fixedThreshold: LEGACY_SILENT_COMPRESS_THRESHOLD,
      model: "gpt-4o-mini",
      ratio: 0.5,
      userMessageCount: 3,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });
    expect(stale.shouldCompress).toBe(false);
  });
});
