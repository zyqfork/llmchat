import { executeMcpAction } from "../mcp/actions.client";

export function parseMcpToolMeta(toolName: string, allTools: any[]) {
  const tool = allTools.find((t) => t?.function?.name === toolName);
  const byMeta = tool?._mcpMeta;
  if (byMeta?.clientId && byMeta?.toolName) {
    return byMeta;
  }
  return null;
}

export async function executeMcpToolCall(
  toolCall: any,
  allTools: any[],
  executeAction: typeof executeMcpAction = executeMcpAction,
) {
  const meta = parseMcpToolMeta(toolCall.name, allTools);
  if (!meta) {
    return {
      isError: true,
      content: `Unsupported tool: ${toolCall.name}`,
      mcpPayload: null,
    };
  }

  try {
    const parsedArguments =
      typeof toolCall.arguments === "string"
        ? JSON.parse(toolCall.arguments || "{}")
        : toolCall.arguments || {};

    const mcpPayload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: meta.toolName,
        arguments: parsedArguments,
      },
    } as any;
    const result = await executeAction(meta.clientId, mcpPayload);
    return {
      isError: false,
      content:
        typeof result === "string"
          ? result
          : JSON.stringify(result ?? {}, null, 2),
      mcpPayload,
      mcpMeta: {
        clientId: meta.clientId,
        toolName: meta.toolName,
      },
    };
  } catch (error) {
    return {
      isError: true,
      content: error instanceof Error ? error.message : String(error),
      mcpPayload: null,
    };
  }
}
