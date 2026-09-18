import {
  getModelCompressThreshold,
  getModelThinkingOptions,
  isModelContextConfigured,
} from "./model-config";

describe("getModelCompressThreshold", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test("returns null instead of silent 8192 when context is unknown", () => {
    expect(isModelContextConfigured("qwen3.8-27b-local")).toBe(false);
    expect(getModelCompressThreshold("qwen3.8-27b-local", 0.9)).toBeNull();
  });

  test("computes threshold from custom context tokens without hard cap", () => {
    window.localStorage.setItem(
      "model_context_tokens_qwen3.8-27b",
      JSON.stringify({ contextTokens: 256000 }),
    );
    expect(isModelContextConfigured("qwen3.8-27b")).toBe(true);
    // 256000 * 0.9 = 230400（不再封顶 128000）
    expect(getModelCompressThreshold("qwen3.8-27b", 0.9)).toBe(230400);
    expect(getModelCompressThreshold("qwen3.8-27b", 0.5)).toBe(128000);
  });

  test("computes threshold for catalog models with known context", () => {
    expect(getModelCompressThreshold("gpt-4o-mini", 0.5)).toBe(64000);
  });
});

describe("getModelThinkingOptions", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test("returns generic controls for a non-Gemini reasoning model", () => {
    expect(getModelThinkingOptions("o1-pro", "openai")).toEqual([
      { level: "dynamic", value: -1 },
      { level: "off", value: 0 },
      { level: "low", value: 1024 },
      { level: "medium", value: 4096 },
      { level: "high", value: 8192 },
    ]);
  });

  test("does not return controls for a non-reasoning model", () => {
    expect(getModelThinkingOptions("gpt-4", "openai")).toEqual([]);
  });

  test("supports a custom model whose reasoning capability is enabled manually", () => {
    window.localStorage.setItem(
      "model_capabilities_custom-reasoner",
      JSON.stringify({ reasoning: true }),
    );

    expect(
      getModelThinkingOptions("custom-reasoner", "custom_local"),
    ).toContainEqual({ level: "off", value: 0 });
  });

  test("applies an unsaved capability override in the model config modal", () => {
    expect(
      getModelThinkingOptions("new-custom-model", "custom_local", true),
    ).not.toHaveLength(0);
    expect(
      getModelThinkingOptions("o1-pro", "openai", false),
    ).toHaveLength(0);
  });
});
