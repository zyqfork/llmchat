import { synthesizeDebugResponseBody } from "./api";

describe("synthesizeDebugResponseBody", () => {
  test("rebuilds a readable body when raw HTTP body is missing", () => {
    const body = synthesizeDebugResponseBody(
      "resp_123",
      {
        model: "gpt-4o",
        provider: "openai",
        api: "openai-responses",
        stopReason: "stop",
        usage: { input: 10, output: 20 },
        content: [{ type: "text", text: "hello world" }],
      },
      "hello world",
    );

    expect(body.id).toBe("resp_123");
    expect(body.model).toBe("gpt-4o");
    expect(body.output_text).toBe("hello world");
    expect(body.choices?.[0]?.message?.content).toBe("hello world");
    expect(body.usage).toEqual({ input: 10, output: 20 });
    expect(body._debug_note).toContain("Reconstructed");
  });

  test("falls back to content blocks when resultText is absent", () => {
    const body = synthesizeDebugResponseBody(undefined, {
      content: [{ type: "text", text: "from blocks" }],
    });
    expect(body.output_text).toBe("from blocks");
    expect(body.id).toBeUndefined();
  });
});
