import {
  getFetchUrl,
  extractSystemPrompt,
  dataUrlToPiImageContent,
  toPiUserContent,
  toTextContent,
  isOpenAIProtocolSdk,
  resolvePiApiType,
  resolveCompat,
  shouldRouteThroughTauriFetch,
  assistantEventToUnifiedPart,
  assistantMessageToResult,
  assistantMessageToProviderMetadata,
  normalizeContentBlocks,
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

describe("shouldRouteThroughTauriFetch", () => {
  test("returns false for non-http URLs", () => {
    expect(shouldRouteThroughTauriFetch("file:///local/path")).toBe(false);
    expect(shouldRouteThroughTauriFetch("/relative")).toBe(false);
    expect(shouldRouteThroughTauriFetch("")).toBe(false);
  });

  test("returns false for http URLs not in tauriFetchBaseUrls", () => {
    // 默认 tauriFetchBaseUrls 为空（浏览器环境），所以任何 http URL 都返回 false
    expect(shouldRouteThroughTauriFetch("https://api.openai.com/v1")).toBe(false);
  });
});

describe("assistantEventToUnifiedPart", () => {
  test("maps text_delta to text-delta", () => {
    expect(assistantEventToUnifiedPart({ type: "text_delta", delta: "hello" })).toEqual(
      { type: "text-delta", text: "hello" },
    );
  });

  test("maps thinking_delta to reasoning-delta", () => {
    expect(
      assistantEventToUnifiedPart({ type: "thinking_delta", delta: "think" }),
    ).toEqual({ type: "reasoning-delta", delta: "think" });
  });

  test("maps toolcall_end to tool-call", () => {
    const toolCall = { id: "tc1", name: "calc", arguments: {} };
    expect(
      assistantEventToUnifiedPart({ type: "toolcall_end", toolCall }),
    ).toEqual({ type: "tool-call", toolCall });
  });

  test("returns undefined for unknown event type", () => {
    expect(assistantEventToUnifiedPart({ type: "unknown" })).toBeUndefined();
    expect(assistantEventToUnifiedPart(null)).toBeUndefined();
    expect(assistantEventToUnifiedPart(undefined)).toBeUndefined();
  });
});

describe("assistantMessageToProviderMetadata", () => {
  test("returns empty object for null/undefined message", () => {
    expect(assistantMessageToProviderMetadata(null)).toEqual({});
    expect(assistantMessageToProviderMetadata(undefined)).toEqual({});
  });

  test("includes responseId only when present", () => {
    const withId = assistantMessageToProviderMetadata({
      responseId: "resp-1",
      stopReason: "end",
      usage: { input: 10, output: 5 },
    }) as any;
    expect(withId.responseId).toBe("resp-1");
    expect(withId.stopReason).toBe("end");

    const withoutId = assistantMessageToProviderMetadata({ stopReason: "end" });
    expect(withoutId).not.toHaveProperty("responseId");
  });

  test("preserves api, provider, model fields", () => {
    const result = assistantMessageToProviderMetadata({
      api: "openai-completions",
      provider: "openai",
      model: "gpt-4o",
    }) as any;
    expect(result.api).toBe("openai-completions");
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o");
  });

  test("normalizes and dedupes identical text blocks in content", () => {
    const result = assistantMessageToProviderMetadata({
      api: "openai-completions",
      provider: "openai",
      model: "gpt-4o",
      content: [
        { type: "text", text: "君不见，黄河之水天上来" },
        { type: "text", text: "君不见，黄河之水天上来" },
      ],
    }) as any;
    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toBe("君不见，黄河之水天上来");
  });
});

describe("normalizeContentBlocks", () => {
  test("returns empty array for non-array inputs", () => {
    expect(normalizeContentBlocks(null as any)).toEqual([]);
    expect(normalizeContentBlocks(undefined as any)).toEqual([]);
    expect(normalizeContentBlocks([] as any)).toEqual([]);
  });

  test("deduplicates identical text blocks", () => {
    const blocks = [
      { type: "text", text: "Hello world" },
      { type: "text", text: "Hello world" },
    ];
    expect(normalizeContentBlocks(blocks)).toEqual([
      { type: "text", text: "Hello world" },
    ]);
  });

  test("preserves distinct text blocks", () => {
    const blocks = [
      { type: "text", text: "Part 1" },
      { type: "text", text: "Part 2" },
    ];
    expect(normalizeContentBlocks(blocks)).toHaveLength(2);
  });

  test("preserves thinking, toolCall, and image blocks", () => {
    const blocks = [
      { type: "thinking", thinking: "reasoning" },
      { type: "text", text: "answer" },
      { type: "toolCall", name: "search" },
    ];
    expect(normalizeContentBlocks(blocks)).toHaveLength(3);
  });
});

describe("assistantMessageToResult", () => {
  const emptyDebug = {};

  test("extracts text from content array", () => {
    const msg = {
      content: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
    };
    const result = assistantMessageToResult(msg, emptyDebug);
    expect(result.text).toBe("Hello world");
  });

  test("ignores non-text content blocks", () => {
    const msg = {
      content: [
        { type: "image", data: "abc" },
        { type: "text", text: "only me" },
      ],
    };
    expect(assistantMessageToResult(msg, emptyDebug).text).toBe("only me");
  });

  test("maps usage fields correctly", () => {
    const msg = {
      content: [],
      usage: {
        input: 100,
        output: 50,
        cacheRead: 20,
        cacheWrite: 10,
        totalTokens: 150,
        cost: { total: 0.01 },
      },
      stopReason: "end_turn",
    };
    const result = assistantMessageToResult(msg, emptyDebug);
    expect(result.usage.promptTokens).toBe(100);
    expect(result.usage.completionTokens).toBe(50);
    expect(result.usage.cacheReadTokens).toBe(20);
    expect(result.usage.cacheWriteTokens).toBe(10);
    expect(result.usage.totalTokens).toBe(150);
    expect(result.usage.cost).toEqual({ total: 0.01 });
    expect(result.finishReason).toBe("end_turn");
  });

  test("returns zero usage for missing fields", () => {
    const result = assistantMessageToResult({ content: [] }, emptyDebug);
    expect(result.usage.promptTokens).toBe(0);
    expect(result.usage.completionTokens).toBe(0);
    expect(result.usage.totalTokens).toBe(0);
  });

  test("attaches debug captures from debugCapture", () => {
    const debug = {
      request: { url: "https://api.example.com", method: "POST", body: {} },
      response: { status: 200, headers: {}, body: "ok" },
    };
    const result = assistantMessageToResult({ content: [] }, debug);
    expect(result.requestDebug).toBe(debug.request);
    expect(result.responseDebug).toBe(debug.response);
  });
});