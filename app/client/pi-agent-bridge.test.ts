import {
  agentEventToUnifiedPart,
  lastAssistantMessage,
  toAgentTools,
} from "./pi-agent-bridge";

const TOOL = {
  type: "function",
  function: {
    name: "weather",
    description: "Get weather",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
};

describe("pi agent bridge", () => {
  test("converts OpenAI MCP tools and preserves execution metadata", async () => {
    const executeMcp = jest.fn(async () => ({
      content: "sunny",
      isError: false,
      mcpPayload: { method: "tools/call" },
      mcpMeta: { clientId: "demo", toolName: "weather" },
    }));
    const [tool] = toAgentTools([TOOL], executeMcp as any);

    const result = await tool.execute(
      "call-1",
      { city: "Shanghai" },
      new AbortController().signal,
    );

    expect(executeMcp).toHaveBeenCalledWith(
      { id: "call-1", name: "weather", arguments: { city: "Shanghai" } },
      [TOOL],
    );
    expect(result.content).toEqual([{ type: "text", text: "sunny" }]);
    expect(result.details).toMatchObject({
      args: { city: "Shanghai" },
      mcpMeta: { clientId: "demo", toolName: "weather" },
    });
  });

  test("turns MCP failures into agent tool errors", async () => {
    const [tool] = toAgentTools(
      [TOOL],
      (async () => ({ content: "failed", isError: true })) as any,
    );
    await expect(
      tool.execute("call-2", {}, new AbortController().signal),
    ).rejects.toThrow("failed");
  });

  test("maps Pi agent streaming and tool events to chat events", () => {
    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "hello" },
      }),
    ).toEqual({ type: "text-delta", text: "hello" });

    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: { type: "thinking_delta", delta: "reason" },
      }),
    ).toEqual({ type: "reasoning-delta", delta: "reason" });

    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: {
          type: "error",
          reason: "error",
          error: { errorMessage: "provider failed" },
        },
      }),
    ).toEqual({
      type: "error",
      reason: "error",
      error: { errorMessage: "provider failed" },
    });

    expect(
      agentEventToUnifiedPart({
        type: "tool_execution_end",
        toolCallId: "call-3",
        toolName: "weather",
        result: {
          content: [{ type: "text", text: "rain" }],
          details: { args: { city: "Beijing" } },
        },
      }),
    ).toMatchObject({
      type: "tool-result",
      result: "rain",
      isError: false,
      toolCall: {
        id: "call-3",
        name: "weather",
        arguments: { city: "Beijing" },
      },
    });
  });

  test("returns the latest assistant message", () => {
    const latest = { role: "assistant", content: "second" };
    expect(
      lastAssistantMessage([
        { role: "assistant", content: "first" },
        { role: "user", content: "next" },
        latest,
      ]),
    ).toBe(latest);
  });
});
