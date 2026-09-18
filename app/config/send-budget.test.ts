import {
  getModelCompressThreshold,
  resolveHistorySendBudget,
  resolveHistoryMessageCount,
  FALLBACK_HISTORY_SEND_BUDGET,
} from "./model-config";
import { estimateTokenLength } from "../utils/token";

describe("resolveHistorySendBudget", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("uses context window budget when model context is known", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000, maxOutputTokens: 8192 }),
    );
    const budget = resolveHistorySendBudget({
      model: "qwen3.8-27b",
      max_tokens: 8192,
    });
    // 256000 - 8192 - max(2048, 5%*256000=12800) ≈ 235008
    expect(budget).toBeGreaterThan(200000);
    expect(budget).toBeLessThan(256000);
  });

  it("falls back to max_tokens when context unknown", () => {
    expect(
      resolveHistorySendBudget({ model: "unknown-custom-xyz", max_tokens: 8192 }),
    ).toBe(8192);
    expect(resolveHistorySendBudget({ model: "unknown-custom-xyz" })).toBe(
      FALLBACK_HISTORY_SEND_BUDGET,
    );
  });

  it("resolveHistoryMessageCount ignores tight history limit when context known", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );
    expect(
      resolveHistoryMessageCount({ model: "qwen3.8-27b", historyMessageCount: 4 }),
    ).toBeGreaterThan(1000);
    expect(
      resolveHistoryMessageCount({
        model: "unknown-custom-xyz",
        historyMessageCount: 4,
      }),
    ).toBe(4);
  });
});

describe("compress threshold ratio / token estimate", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("supports ratio up to 0.95 without 128k cap", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );
    expect(getModelCompressThreshold("qwen3.8-27b", 0.95)).toBe(243200);
  });

  it("ratio 0 disables dynamic threshold", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );
    expect(getModelCompressThreshold("qwen3.8-27b", 0)).toBeNull();
  });

  it("Chinese token estimate uses ~1.7 per char", () => {
    const text = "你好世界"; // 4 chars
    const tokens = estimateTokenLength(text);
    expect(tokens).toBeGreaterThanOrEqual(6);
    expect(tokens).toBeLessThanOrEqual(8);
  });
});
