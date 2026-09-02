import {
  extractAllMcpJson,
  extractMcpJson,
  isMcpJson,
} from "./utils";
import { getAssistantMessageTextForApi } from "../utils";

describe("mcp/utils", () => {
  const sampleBlock =
    '```json:mcp:demo-client\n{"method":"tools/call","params":{"name":"search","arguments":{"q":"test"}}}\n```';

  test("isMcpJson detects prompt-mode tool blocks", () => {
    expect(isMcpJson(sampleBlock)).toBeTruthy();
    expect(isMcpJson("plain text")).toBeFalsy();
  });

  test("extractMcpJson parses client id and payload", () => {
    const parsed = extractMcpJson(sampleBlock);
    expect(parsed?.clientId).toBe("demo-client");
    expect(parsed?.mcp).toEqual({
      method: "tools/call",
      params: { name: "search", arguments: { q: "test" } },
    });
  });

  test("extractAllMcpJson returns every block in message", () => {
    const content = `${sampleBlock}\n\n${sampleBlock.replace(
      "search",
      "fetch",
    )}`;
    const all = extractAllMcpJson(content);
    expect(all.length).toBe(2);
    expect(all[0].clientId).toBe("demo-client");
  });
});

describe("getAssistantMessageTextForApi", () => {
  test("preserves MCP blocks that only appear inside thinking tags", () => {
    const block =
      '```json:mcp:demo\n{"method":"tools/call","params":{"name":"t","arguments":{}}}\n```';
    const content = `<think>\nplanning...\n${block}\n</think>`;
    const result = getAssistantMessageTextForApi(content);
    expect(result).toContain("```json:mcp:demo");
    expect(result).not.toContain("planning");
  });
});
