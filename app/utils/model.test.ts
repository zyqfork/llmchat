import { getModelProvider, isGPT4Model } from "./model";

describe("getModelProvider", () => {
  test("splits on the last @ for model@provider format", () => {
    expect(getModelProvider("gpt-4@OpenAI")).toEqual(["gpt-4", "OpenAI"]);
  });

  test("handles model names that contain @ (uses last @)", () => {
    // e.g. "claude-3-5-sonnet@20240620@Google"
    expect(getModelProvider("claude-3-5-sonnet@20240620@Google")).toEqual([
      "claude-3-5-sonnet@20240620",
      "Google",
    ]);
  });

  test("returns undefined provider when no @ present", () => {
    expect(getModelProvider("gpt-4")).toEqual(["gpt-4", undefined]);
  });

  test("handles empty string", () => {
    const [model, provider] = getModelProvider("");
    expect(model).toBe("");
    expect(provider).toBeUndefined();
  });
});

describe("isGPT4Model", () => {
  test("gpt-4 is a GPT-4 model", () => {
    expect(isGPT4Model("gpt-4")).toBe(true);
  });

  test("gpt-4-turbo is a GPT-4 model", () => {
    expect(isGPT4Model("gpt-4-turbo")).toBe(true);
  });

  test("gpt-4o is a GPT-4 model", () => {
    expect(isGPT4Model("gpt-4o")).toBe(true);
  });

  test("gpt-4o-mini is NOT a GPT-4 model (excluded)", () => {
    expect(isGPT4Model("gpt-4o-mini")).toBe(false);
  });

  test("chatgpt-4o-latest is a GPT-4 model", () => {
    expect(isGPT4Model("chatgpt-4o-latest")).toBe(true);
  });

  test("o1 is a GPT-4 model", () => {
    expect(isGPT4Model("o1")).toBe(true);
  });

  test("o1-mini is a GPT-4 model", () => {
    expect(isGPT4Model("o1-mini")).toBe(true);
  });

  test("gpt-3.5-turbo is NOT a GPT-4 model", () => {
    expect(isGPT4Model("gpt-3.5-turbo")).toBe(false);
  });

  test("claude-3 is NOT a GPT-4 model", () => {
    expect(isGPT4Model("claude-3-sonnet")).toBe(false);
  });

  test("empty string is NOT a GPT-4 model", () => {
    expect(isGPT4Model("")).toBe(false);
  });
});
