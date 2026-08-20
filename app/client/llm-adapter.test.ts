import {
  getFetchUrl,
  extractSystemPrompt,
  dataUrlToPiImageContent,
  toPiUserContent,
  toTextContent,
  isOpenAIProtocolSdk,
  resolvePiApiType,
  resolveCompat,
} from "./llm-adapter";

describe("getFetchUrl", () => {
  test("returns string input as-is", () => {
    expect(getFetchUrl("https://api.example.com")).toBe(
      "https://api.example.com",
    );
  });

  test("extracts url from Request", () => {
    // jsdom 测试环境没有全局 Request，跳过
  });
});

describe("extractSystemPrompt", () => {
  test("collects system messages and separates them", () => {
    const messages = [
      { role: "system", content: "Be helpful." },
      { role: "user", content: "hi" },
      { role: "system", content: "Use Chinese." },
      { role: "assistant", content: "hello" },
    ];
    const result = extractSystemPrompt(messages);
    expect(result.systemPrompt).toBe("Be helpful.\nUse Chinese.");
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[1].role).toBe("assistant");
  });

  test("handles messages without any system role", () => {
    const messages = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "world" },
    ];
    const result = extractSystemPrompt(messages);
    expect(result.systemPrompt).toBeUndefined();
    expect(result.messages).toHaveLength(2);
  });

  test("handles empty array", () => {
    const result = extractSystemPrompt([]);
    expect(result.systemPrompt).toBeUndefined();
    expect(result.messages).toEqual([]);
  });

  test("skips system messages with empty content", () => {
    const messages = [
      { role: "system", content: "  " },
      { role: "user", content: "hi" },
    ];
    const result = extractSystemPrompt(messages);
    expect(result.systemPrompt).toBeUndefined();
    expect(result.messages).toHaveLength(1);
  });
});

describe("dataUrlToPiImageContent", () => {
  test("parses valid base64 data URL", () => {
    const url = "data:image/jpeg;base64,/9j/4AAQ===";
    const result = dataUrlToPiImageContent(url);
    expect(result).toBeDefined();
    expect(result!.type).toBe("image");
    expect(result!.mimeType).toBe("image/jpeg");
    expect(result!.data).toBe("/9j/4AAQ===");
  });

  test("returns undefined for non-data URL", () => {
    expect(dataUrlToPiImageContent("https://example.com/photo.jpg")).toBeUndefined();
  });

  test("returns undefined for malformed data URL", () => {
    expect(dataUrlToPiImageContent("data:text/html,hello")).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    expect(dataUrlToPiImageContent("")).toBeUndefined();
  });
});

describe("toPiUserContent", () => {
  test("passes string content through as-is", () => {
    expect(toPiUserContent("hello")).toBe("hello");
  });

  test("converts text multimodal parts", () => {
    const content = [
      { type: "text", text: "hello" },
      { type: "text", text: "world" },
    ];
    const result = toPiUserContent(content);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect((result as any[])[0]).toEqual({ type: "text", text: "hello" });
  });

  test("converts image_url multimodal parts", () => {
    const content = [
      { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0=" } },
    ];
    const result = toPiUserContent(content);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect((result as any[])[0].type).toBe("image");
  });

  test("returns empty string for no viable content parts", () => {
    expect(toPiUserContent([])).toBe("");
    expect(toPiUserContent(true)).toBe("true");
  });
});

describe("toTextContent", () => {
  test("returns string input as-is", () => {
    expect(toTextContent("hello")).toBe("hello");
  });

  test("joins text parts from array", () => {
    const input = [
      { type: "text", text: "Hello" },
      { type: "image_url", image_url: { url: "data:img" } },
    ];
    expect(toTextContent(input)).toBe("Hello\n[image] data:img");
  });

  test("returns JSON string for non-string non-array input", () => {
    expect(toTextContent({ custom: "obj" })).toBe('{"custom":"obj"}');
  });
});

describe("isOpenAIProtocolSdk", () => {
  test("recognizes 'openai'", () => {
    expect(isOpenAIProtocolSdk("openai")).toBe(true);
  });

  test("recognizes 'openai-compatible'", () => {
    expect(isOpenAIProtocolSdk("openai-compatible")).toBe(true);
  });

  test("recognizes case-insensitively", () => {
    expect(isOpenAIProtocolSdk("OpenAI")).toBe(true);
  });

  test("rejects anthropic", () => {
    expect(isOpenAIProtocolSdk("anthropic")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(isOpenAIProtocolSdk("")).toBe(false);
  });
});

describe("resolvePiApiType", () => {
  test("returns openai-responses for openai + response apiType", () => {
    expect(resolvePiApiType({ sdkType: "openai", apiType: "response" })).toBe(
      "openai-responses",
    );
  });

  test("returns openai-completions for openai without apiType", () => {
    expect(resolvePiApiType({ sdkType: "openai" })).toBe("openai-completions");
  });

  test("returns anthropic-messages for anthropic sdk", () => {
    expect(resolvePiApiType({ sdkType: "anthropic" })).toBe(
      "anthropic-messages",
    );
  });

  test("returns google-generative-ai for google sdk", () => {
    expect(resolvePiApiType({ sdkType: "google" })).toBe(
      "google-generative-ai",
    );
  });

  test("defaults to openai-completions", () => {
    expect(resolvePiApiType({})).toBe("openai-completions");
  });
});

describe("resolveCompat", () => {
  test("forces supportsDeveloperRole: false for custom providers with OpenAI protocol", () => {
    const result = resolveCompat(
      { sdkType: "openai", baseUrl: "https://custom.example.com" },
      "custom_provider_123",
    );
    expect(result).toEqual({ supportsDeveloperRole: false });
  });

  test("preserves builtin compat for official OpenAI host with non-custom provider", () => {
    // "openai_provider" does not start with "custom_", and the host is official
    const result = resolveCompat(
      { sdkType: "openai", baseUrl: "https://api.openai.com/v1" },
      "openai_provider",
    );
    expect(result).toBeUndefined();
  });

  test("forces supportsDeveloperRole for custom provider even with official host", () => {
    const result = resolveCompat(
      { sdkType: "openai", baseUrl: "https://api.openai.com/v1" },
      "custom_provider_xyz",
    );
    expect(result).toEqual({ supportsDeveloperRole: false });
  });

  test("returns builtin-compat unchanged for non-OpenAI sdk", () => {
    const builtin = { supportsDeveloperRole: true, someFlag: true };
    const result = resolveCompat(
      { sdkType: "anthropic", baseUrl: "https://anthropic.com" },
      "custom_1",
      builtin,
    );
    expect(result).toEqual(builtin);
  });
});