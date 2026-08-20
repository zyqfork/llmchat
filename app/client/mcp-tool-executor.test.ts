import {
  executeMcpToolCall,
  parseMcpToolMeta,
} from "./mcp-tool-executor";

const tools = [
  {
    type: "function",
    function: { name: "mcp_demo_weather" },
    _mcpMeta: { clientId: "demo", toolName: "weather" },
  },
];

describe("MCP tool executor", () => {
  test("resolves MCP metadata", () => {
    expect(parseMcpToolMeta("mcp_demo_weather", tools)).toEqual({
      clientId: "demo",
      toolName: "weather",
    });
  });

  test("builds tools/call payload and normalizes object results", async () => {
    const execute = jest.fn(async () => ({ temperature: 21 }));
    const result = await executeMcpToolCall(
      {
        name: "mcp_demo_weather",
        arguments: JSON.stringify({ city: "Shanghai" }),
      },
      tools,
      execute as any,
    );

    expect(execute).toHaveBeenCalledWith(
      "demo",
      expect.objectContaining({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: "weather", arguments: { city: "Shanghai" } },
      }),
    );
    expect(result).toMatchObject({
      isError: false,
      mcpMeta: { clientId: "demo", toolName: "weather" },
    });
    expect(result.content).toContain('"temperature": 21');
  });

  test("rejects unknown tools without invoking MCP", async () => {
    const execute = jest.fn();
    const result = await executeMcpToolCall(
      { name: "unknown", arguments: {} },
      tools,
      execute as any,
    );
    expect(result).toMatchObject({ isError: true });
    expect(execute).not.toHaveBeenCalled();
  });

  test("returns malformed argument errors", async () => {
    const result = await executeMcpToolCall(
      { name: "mcp_demo_weather", arguments: "{" },
      tools,
      jest.fn() as any,
    );
    expect(result.isError).toBe(true);
    expect(result.content).toMatch(/JSON|position|Expected/i);
  });
});
