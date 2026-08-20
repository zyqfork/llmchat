import {
  getMcpSystemPrompt,
  isLikelyContextOverflowError,
  formatChatErrorCodeBlock,
} from "./chat";

// Mock MCP client module
jest.mock("../mcp/actions.client", () => ({
  getMcpConfigFromFile: jest.fn(),
  getAllTools: jest.fn(),
  executeMcpAction: jest.fn(),
}));

describe("getMcpSystemPrompt", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("returns empty string when MCP is disabled", async () => {
    const result = await getMcpSystemPrompt(false);
    expect(result).toBe("");
  });

  test("returns empty string in function_call mode", async () => {
    const { getMcpConfigFromFile } = require("../mcp/actions.client");
    (getMcpConfigFromFile as jest.Mock).mockResolvedValue({
      callMode: "function_call",
    });
    const result = await getMcpSystemPrompt(true);
    expect(result).toBe("");
  });

  test("builds system prompt with tools when MCP enabled in prompt mode", async () => {
    const { getMcpConfigFromFile, getAllTools } = require("../mcp/actions.client");
    (getMcpConfigFromFile as jest.Mock).mockResolvedValue({
      callMode: "prompt",
      customToolsPrompt: null,
      customSystemPrompt: null,
    });
    (getAllTools as jest.Mock).mockResolvedValue([
      {
        clientId: "demo",
        tools: {
          tools: [
            {
              name: "weather",
              description: "Get weather",
              inputSchema: {
                type: "object",
                properties: { city: { type: "string" } },
              },
            },
          ],
        },
      },
    ]);

    const result = await getMcpSystemPrompt(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("demo");
    expect(result).toContain("weather");
  });

  test("respects enabledClients filter", async () => {
    const { getMcpConfigFromFile, getAllTools } = require("../mcp/actions.client");
    (getMcpConfigFromFile as jest.Mock).mockResolvedValue({
      callMode: "prompt",
    });
    (getAllTools as jest.Mock).mockResolvedValue([
      {
        clientId: "demo",
        tools: { tools: [{ name: "weather" }] },
      },
      {
        clientId: "other",
        tools: { tools: [{ name: "search" }] },
      },
    ]);

    const result = await getMcpSystemPrompt(true, { demo: true, other: false });
    expect(result).toContain("demo");
    expect(result).not.toContain("other");
  });

  test("uses custom templates when provided", async () => {
    const { getMcpConfigFromFile, getAllTools } = require("../mcp/actions.client");
    (getMcpConfigFromFile as jest.Mock).mockResolvedValue({
      callMode: "prompt",
      customToolsPrompt: "Custom tools: {{ clientId }} / {{ tools }}",
      customSystemPrompt: "Custom system: {{ MCP_TOOLS }}",
    });
    (getAllTools as jest.Mock).mockResolvedValue([
      {
        clientId: "demo",
        tools: { tools: [{ name: "test" }] },
      },
    ]);

    const result = await getMcpSystemPrompt(true);
    expect(result).toContain("Custom tools:");
    expect(result).toContain("Custom system:");
  });

  test("handles empty tools gracefully", async () => {
    const { getMcpConfigFromFile, getAllTools } = require("../mcp/actions.client");
    (getMcpConfigFromFile as jest.Mock).mockResolvedValue({
      callMode: "prompt",
    });
    (getAllTools as jest.Mock).mockResolvedValue([]);

    const result = await getMcpSystemPrompt(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("isLikelyContextOverflowError", () => {
  test("matches OpenAI context window overflow", () => {
    expect(
      isLikelyContextOverflowError(
        new Error("exceeds the context window of this model"),
      ),
    ).toBe(true);
  });

  test("matches Anthropic prompt too long", () => {
    expect(
      isLikelyContextOverflowError(
        new Error("prompt is too long: 213462 tokens > 200000 maximum"),
      ),
    ).toBe(true);
  });

  test("matches generic token limit exceeded", () => {
    expect(
      isLikelyContextOverflowError(new Error("token limit exceeded")),
    ).toBe(true);
  });

  test("does not match unrelated errors", () => {
    expect(isLikelyContextOverflowError(new Error("network error"))).toBe(false);
    expect(
      isLikelyContextOverflowError(new Error("invalid API key")),
    ).toBe(false);
  });

  test("handles null and undefined", () => {
    expect(isLikelyContextOverflowError(null as any)).toBe(false);
    expect(isLikelyContextOverflowError(undefined as any)).toBe(false);
  });
});

describe("formatChatErrorCodeBlock", () => {
  test("returns warning prefix for plain text", () => {
    const result = formatChatErrorCodeBlock("context_overflow");
    expect(result).toBe("⚠️ context_overflow");
  });

  test("handles empty string", () => {
    const result = formatChatErrorCodeBlock("");
    expect(result).toBe("⚠️ ");
  });

  test("parses JSON error objects", () => {
    const result = formatChatErrorCodeBlock(
      JSON.stringify({ error: { message: "test error" } }),
    );
    expect(result).toContain("test error");
  });
});