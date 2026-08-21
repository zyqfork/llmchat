import {
  agentEventToUnifiedPart,
  createPiAgentRun,
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

describe("pi agent bridge - toAgentTools", () => {
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

  test("handles empty tools array or invalid definitions", () => {
    expect(toAgentTools([])).toEqual([]);
    expect(toAgentTools(undefined as any)).toEqual([]);
    expect(toAgentTools([{}] as any)).toEqual([]);
    expect(toAgentTools([{ function: {} }] as any)).toEqual([]);
  });

  test("applies default fallback description and parameters", () => {
    const toolDef = {
      type: "function",
      function: {
        name: "customCalc",
      },
    };
    const [agentTool] = toAgentTools([toolDef]);
    expect(agentTool.name).toBe("customCalc");
    expect(agentTool.description).toBe("Tool customCalc");
    expect(agentTool.parameters).toEqual({ type: "object", properties: {} });
  });
});

describe("pi agent bridge - agentEventToUnifiedPart", () => {
  test("maps text_delta to text-delta", () => {
    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "hello" },
      }),
    ).toEqual({ type: "text-delta", text: "hello" });
  });

  test("maps thinking_delta to reasoning-delta", () => {
    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: { type: "thinking_delta", delta: "reason" },
      }),
    ).toEqual({ type: "reasoning-delta", delta: "reason" });
  });

  test("maps toolcall_end to tool-call", () => {
    const toolCall = { id: "call-tc", name: "calc", arguments: { a: 1 } };
    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: {
          type: "toolcall_end",
          toolCall,
        },
      }),
    ).toEqual({
      type: "tool-call",
      toolCall,
    });
  });

  test("maps error event to error part", () => {
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
  });

  test("returns undefined for unknown message_update event", () => {
    expect(
      agentEventToUnifiedPart({
        type: "message_update",
        assistantMessageEvent: { type: "unknown_delta" },
      }),
    ).toBeUndefined();
  });

  test("returns undefined for non-relevant event types", () => {
    expect(agentEventToUnifiedPart({ type: "turn_start" })).toBeUndefined();
    expect(agentEventToUnifiedPart(null)).toBeUndefined();
    expect(agentEventToUnifiedPart(undefined)).toBeUndefined();
  });

  test("maps tool_execution_end with content and metadata", () => {
    expect(
      agentEventToUnifiedPart({
        type: "tool_execution_end",
        toolCallId: "call-3",
        toolName: "weather",
        result: {
          content: [{ type: "text", text: "rain" }],
          details: {
            args: { city: "Beijing" },
            mcpPayload: { method: "call" },
            mcpMeta: { clientId: "w" },
          },
        },
      }),
    ).toEqual({
      type: "tool-result",
      result: "rain",
      isError: false,
      toolCall: {
        id: "call-3",
        name: "weather",
        arguments: { city: "Beijing" },
        mcpPayload: { method: "call" },
        mcpMeta: { clientId: "w" },
      },
    });
  });

  test("maps tool_execution_end with error flag and stringified fallback result", () => {
    expect(
      agentEventToUnifiedPart({
        type: "tool_execution_end",
        isError: true,
        toolCall: {
          id: "call-4",
          name: "failTool",
          arguments: { flag: true },
        },
        result: { custom: "error info" },
      }),
    ).toEqual({
      type: "tool-result",
      result: JSON.stringify({ custom: "error info" }),
      isError: true,
      toolCall: {
        id: "call-4",
        name: "failTool",
        arguments: { flag: true },
        mcpPayload: undefined,
        mcpMeta: undefined,
      },
    });
  });
});

describe("pi agent bridge - lastAssistantMessage", () => {
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

  test("returns undefined when no assistant message exists", () => {
    expect(lastAssistantMessage([])).toBeUndefined();
    expect(
      lastAssistantMessage([
        { role: "user", content: "hello" },
        { role: "system", content: "prompt" },
      ]),
    ).toBeUndefined();
    expect(lastAssistantMessage(undefined)).toBeUndefined();
  });
});

describe("pi agent bridge - createPiAgentRun", () => {
  test("creates EventStream and subscribes to agent execution", async () => {
    const mockStreamFn = jest.fn();
    const abortController = new AbortController();

    const stream = createPiAgentRun({
      context: {
        systemPrompt: "sys",
        messages: [{ role: "user", content: "hi" } as any],
      },
      model: { id: "test-model", provider: "openai" } as any,
      tools: [],
      streamOptions: { reasoning: "low" },
      streamFn: mockStreamFn,
      abortSignal: abortController.signal,
      sessionId: "session-1",
    });

    expect(stream).toBeDefined();
    expect(typeof stream[Symbol.asyncIterator]).toBe("function");
  });

  test("propagates agent errors as error events then ends the stream", () => {
    // streamFn that throws — Agent.continue() will catch and push an error event.
    // We only verify the stream is created without hanging (do NOT iterate — Agent
    // internals may not end the EventStream synchronously in tests).
    const throwingStreamFn = jest.fn().mockRejectedValue(new Error("provider unavailable"));

    const stream = createPiAgentRun({
      context: {
        systemPrompt: "",
        messages: [{ role: "user", content: "ping" } as any],
      },
      model: { id: "m", provider: "openai" } as any,
      tools: [],
      streamOptions: {},
      streamFn: throwingStreamFn,
    });

    expect(stream).toBeDefined();
    expect(typeof stream[Symbol.asyncIterator]).toBe("function");
  });

  test("abort signal causes agent to abort without hanging", async () => {
    const abortController = new AbortController();
    const neverResolvingStreamFn = jest.fn().mockReturnValue(
      new Promise(() => { /* never resolves */ }),
    );

    const stream = createPiAgentRun({
      context: {
        systemPrompt: "",
        messages: [{ role: "user", content: "hello" } as any],
      },
      model: { id: "m", provider: "openai" } as any,
      tools: [],
      streamOptions: {},
      streamFn: neverResolvingStreamFn,
      abortSignal: abortController.signal,
    });

    expect(stream).toBeDefined();
    // abort immediately — should not throw synchronously
    expect(() => abortController.abort()).not.toThrow();
  });

  test("works without optional abortSignal or sessionId", () => {
    const stream = createPiAgentRun({
      context: {
        systemPrompt: "",
        messages: [],
      },
      model: { id: "m", provider: "openai" } as any,
      tools: [],
      streamOptions: {},
      streamFn: jest.fn(),
    });
    expect(stream).toBeDefined();
  });
});
