import { executeMcpAction } from "../mcp/actions.client";

function parseMcpToolMeta(toolName: string, allTools: any[]) {
  const byMeta = allTools.find((t) => t?.function?.name === toolName)?._mcpMeta;
  if (byMeta?.clientId && byMeta?.toolName) return byMeta;

  if (!toolName.startsWith("mcp_")) return null;
  const rest = toolName.slice(4);
  const splitIdx = rest.indexOf("_");
  if (splitIdx <= 0) return null;
  return {
    clientId: rest.slice(0, splitIdx),
    toolName: rest.slice(splitIdx + 1),
  };
}

export async function executeMcpToolCall(toolCall: any, allTools: any[]) {
  const meta = parseMcpToolMeta(toolCall.name, allTools);
  if (!meta) {
    return {
      isError: true,
      content: `Unsupported tool: ${toolCall.name}`,
    };
  }

  try {
    const parsedArguments =
      typeof toolCall.arguments === "string"
        ? JSON.parse(toolCall.arguments || "{}")
        : toolCall.arguments || {};

    const result = await executeMcpAction(meta.clientId, {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: meta.toolName,
        arguments: parsedArguments,
      },
    } as any);
    return {
      isError: false,
      content:
        typeof result === "string"
          ? result
          : JSON.stringify(result ?? {}, null, 2),
    };
  } catch (error) {
    return {
      isError: true,
      content: error instanceof Error ? error.message : String(error),
    };
  }
}
