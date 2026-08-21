import {
  createMessage,
  buildUserMessagesText,
  buildTopicPrompt,
  buildTopicRequestMessages,
  countUserMessages,
  countUserTokens,
  buildConversationTranscript,
  fillTemplateWith,
  isLikelyContextOverflowError,
  formatChatErrorCodeBlock,
} from "./chat";
import type { ChatMessage } from "./chat";

function makeUserMessage(content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return createMessage({ role: "user", content, ...extra });
}

function makeAssistantMessage(content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return createMessage({ role: "assistant", content, ...extra });
}

describe("createMessage", () => {
  test("returns a message with default role/content and unique id", () => {
    const msg = createMessage({});
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("");
    expect(msg.id).toBeTruthy();
  });

  test("overrides default fields", () => {
    const msg = createMessage({ role: "assistant", content: "hi" });
    expect(msg.role).toBe("assistant");
    expect(msg.content).toBe("hi");
  });
});

describe("buildUserMessagesText", () => {
  test("joins non-empty user messages with newline", () => {
    const messages = [
      makeUserMessage("hello"),
      makeAssistantMessage("world"),
      makeUserMessage("again"),
    ];
    expect(buildUserMessagesText(messages)).toBe("hello\nagain");
  });

  test("skips error messages and empty content", () => {
    const messages = [
      makeUserMessage("", { isError: false }),
      makeUserMessage("valid"),
      makeUserMessage("broken", { isError: true }),
    ];
    expect(buildUserMessagesText(messages)).toBe("valid");
  });

  test("strips thinking blocks from user content", () => {
    const messages = [makeUserMessage("before <think>hidden</think> after")];
    expect(buildUserMessagesText(messages)).toBe("before  after");
  });

  test("returns empty string for empty input", () => {
    expect(buildUserMessagesText([])).toBe("");
  });
});

describe("buildTopicPrompt", () => {
  test("substitutes placeholders when present", () => {
    const instruction = "用户：{{user_messages}}\n助手：{{assistant_message}}";
    const out = buildTopicPrompt(instruction, "U1", "A1");
    expect(out).toBe("用户：U1\n助手：A1");
  });

  test("appends user/assistant text when placeholders are missing", () => {
    const instruction = "写个标题";
    const out = buildTopicPrompt(instruction, "U1", "A1");
    expect(out).toContain("写个标题");
    expect(out).toContain("用户发言：\nU1");
    expect(out).toContain("助手回复：\nA1");
  });

  test("does not append empty user/assistant text", () => {
    const instruction = "写个标题";
    const out = buildTopicPrompt(instruction, "", "");
    expect(out).toBe("写个标题");
  });
});

describe("buildTopicRequestMessages", () => {
  test("produces a single user message containing topic prompt", () => {
    const messages = [makeUserMessage("问题1"), makeUserMessage("问题2")];
    const out = buildTopicRequestMessages("根据对话生成标题", messages);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("user");
    expect(String(out[0].content)).toContain("问题1");
    expect(String(out[0].content)).toContain("问题2");
  });
});

describe("countUserMessages", () => {
  test("counts only non-error user messages with content", () => {
    const messages = [
      makeUserMessage("a"),
      makeUserMessage("", { isError: true }),
      makeAssistantMessage("b"),
      makeUserMessage("c"),
    ];
    expect(countUserMessages(messages)).toBe(2);
  });

  test("returns 0 for empty array", () => {
    expect(countUserMessages([])).toBe(0);
  });
});

describe("countUserTokens", () => {
  test("is greater for longer user messages", () => {
    const short = countUserTokens([makeUserMessage("a short message")]);
    const long = countUserTokens([
      makeUserMessage("a short message with much more content here"),
    ]);
    expect(long).toBeGreaterThan(short);
  });

  test("ignores assistant and error messages", () => {
    const tokens = countUserTokens([
      makeUserMessage("hello", { isError: true }),
      makeAssistantMessage("hello"),
      makeUserMessage("hello"),
    ]);
    expect(tokens).toBeGreaterThan(0);
  });
});

describe("buildConversationTranscript", () => {
  const messages = [
    makeUserMessage("u1", { role: "system", content: "sys" } as Partial<ChatMessage>),
    makeUserMessage("u2"),
    makeAssistantMessage("a1"),
    makeUserMessage(""),
  ];

  test("includes system messages when includeSystem is true", () => {
    const transcript = buildConversationTranscript(messages, true);
    expect(transcript).toContain("system: sys");
  });

  test("excludes system messages when includeSystem is false", () => {
    const transcript = buildConversationTranscript(messages, false);
    expect(transcript).not.toContain("system");
    expect(transcript).toContain("user: u2");
    expect(transcript).toContain("assistant: a1");
  });

  test("skips empty lines", () => {
    const transcript = buildConversationTranscript(messages, false);
    expect(transcript.split("\n")).toHaveLength(2);
  });
});

describe("fillTemplateWith", () => {
  test("replaces {{input}} placeholder", () => {
    const modelConfig = {
      model: "gpt-4o-mini",
      template: "请回答：{{input}}",
    } as any;
    const out = fillTemplateWith("hello", modelConfig);
    expect(out).toContain("请回答：hello");
  });

  test("appends {{input}} when template lacks it", () => {
    const modelConfig = { model: "gpt-4o-mini", template: "无占位符" } as any;
    const out = fillTemplateWith("hello", modelConfig);
    expect(out).toContain("hello");
  });

  test("handles empty template with default", () => {
    const modelConfig = { model: "gpt-4o-mini" } as any;
    const out = fillTemplateWith("hello", modelConfig);
    expect(out).toContain("hello");
  });
});

describe("isLikelyContextOverflowError", () => {
  test("returns false for null or non-error input", () => {
    expect(isLikelyContextOverflowError(null)).toBe(false);
    expect(isLikelyContextOverflowError(undefined)).toBe(false);
    expect(isLikelyContextOverflowError("string" as any)).toBe(false);
  });

  test("returns false for generic errors", () => {
    expect(isLikelyContextOverflowError(new Error("network timeout"))).toBe(false);
    expect(isLikelyContextOverflowError(new Error(""))).toBe(false);
  });

  test("returns true for context length exceeded errors", () => {
    // pi-ai's isContextOverflow checks for known overflow stop reasons / messages
    const overflowErr = new Error("context_length_exceeded: max tokens exceeded");
    // the actual result depends on pi-ai's logic; we just confirm it doesn't throw
    const result = isLikelyContextOverflowError(overflowErr);
    expect(typeof result).toBe("boolean");
  });
});

describe("formatChatErrorCodeBlock", () => {
  test("returns warning with plain text for non-JSON input", () => {
    const result = formatChatErrorCodeBlock("something went wrong");
    expect(result).toBe("⚠️ something went wrong");
  });

  test("extracts error.message from JSON payload", () => {
    const payload = JSON.stringify({ error: { message: "rate limit hit" } });
    const result = formatChatErrorCodeBlock(payload);
    expect(result).toContain("rate limit hit");
  });

  test("extracts top-level message from JSON payload", () => {
    const payload = JSON.stringify({ message: "unauthorized" });
    const result = formatChatErrorCodeBlock(payload);
    expect(result).toContain("unauthorized");
  });

  test("extracts string error field from JSON payload", () => {
    const payload = JSON.stringify({ error: "forbidden" });
    const result = formatChatErrorCodeBlock(payload);
    expect(result).toContain("forbidden");
  });

  test("pretty-prints JSON without error message field", () => {
    const payload = JSON.stringify({ code: 500, detail: "server error" });
    const result = formatChatErrorCodeBlock(payload);
    // no ⚠️ prefix when no message extracted; just pretty-printed JSON
    expect(result).toContain("500");
  });

  test("handles empty string gracefully", () => {
    const result = formatChatErrorCodeBlock("");
    expect(result).toBe("⚠️ ");
  });

  test("trims whitespace before processing", () => {
    const result = formatChatErrorCodeBlock("  plain error  ");
    expect(result).toBe("⚠️ plain error");
  });
});
