const MCP_JSON_BLOCK_RE = /```json:mcp:([^\s`]+)\s*\n([\s\S]*?)```/g;

export function isMcpJson(content: string) {
  return MCP_JSON_BLOCK_RE.test(content);
}

export function extractMcpJson(content: string) {
  const match = content.match(/```json:mcp:([^\s`]+)\s*\n([\s\S]*?)```/);
  if (!match) return null;
  try {
    return { clientId: match[1], mcp: JSON.parse(match[2]) };
  } catch {
    return null;
  }
}

export function extractAllMcpJson(content: string) {
  const results: Array<{ clientId: string; mcp: unknown }> = [];
  for (const match of content.matchAll(
    /```json:mcp:([^\s`]+)\s*\n([\s\S]*?)```/g,
  )) {
    try {
      results.push({ clientId: match[1], mcp: JSON.parse(match[2]) });
    } catch {
      // ignore malformed blocks
    }
  }
  return results;
}
