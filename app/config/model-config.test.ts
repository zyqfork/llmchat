import { getModelThinkingOptions } from "./model-config";

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
