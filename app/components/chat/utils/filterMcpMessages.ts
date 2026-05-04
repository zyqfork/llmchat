/**
 * 过滤和处理 MCP 相关消息（合并/隐藏提示词模式下的“工具声明”消息）
 */
import type { ChatMessage } from "@/app/store";

type ExtractedMcpCall = {
  toolName: string;
  clientId: string;
  contentOffset?: number;
  method?: string;
  args?: unknown;
  parsed?: unknown;
  rawJson: string;
};

type ParsedAssistantMcpMessage = {
  cleanContent: string;
  mcpCalls: ExtractedMcpCall[];
  hasMcp: boolean;
};

function getTextContent(message: ChatMessage): string {
  return typeof message.content === "string"
    ? message.content
    : Array.isArray(message.content)
      ? message.content.map((c) => (c.type === "text" ? c.text : "")).join("")
      : "";
}

function stripMcpBlocks(content: string): string {
  return content.replace(/```json:mcp:[\s\S]*?```/g, "").trim();
}

function dedupeMcpCalls(calls: ExtractedMcpCall[]) {
  const seen = new Set<string>();
  return calls.filter((c) => {
    const key = `${c.clientId}|${c.toolName}|${c.rawJson}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseAssistantMcpMessage(
  message: ChatMessage,
): ParsedAssistantMcpMessage {
  const content = getTextContent(message);

  if (!content.includes("```json:mcp:")) {
    return {
      cleanContent: content.trim(),
      mcpCalls: Array.isArray((message as any).mcpCalls)
        ? (message as any).mcpCalls
        : [],
      hasMcp: Array.isArray((message as any).mcpCalls)
        ? (message as any).mcpCalls.length > 0
        : false,
    };
  }

  const mcpMatches = Array.from(
    content.matchAll(/```json:mcp:([^\s]+)\s*\n([\s\S]*?)```/g),
  );
  const mcpCalls: ExtractedMcpCall[] = [];

  mcpMatches.forEach((match) => {
    try {
      const clientId = match[1];
      const rawJson = match[2];
      const mcpData = JSON.parse(rawJson);
      const toolName = mcpData.params?.name || "工具";
      const args = mcpData.params?.arguments ?? {};
      const contentBeforeCall = stripMcpBlocks(content.slice(0, match.index));
      mcpCalls.push({
        toolName,
        clientId,
        contentOffset: contentBeforeCall.length,
        method: mcpData.method,
        args,
        parsed: mcpData,
        rawJson,
      });
    } catch (e) {
      // ignore parse error
    }
  });

  return {
    cleanContent: stripMcpBlocks(content),
    mcpCalls: dedupeMcpCalls(mcpCalls),
    hasMcp: mcpCalls.length > 0,
  };
}

function joinAssistantContent(left: string, right: string) {
  if (!left.trim()) return right.trim();
  if (!right.trim()) return left.trim();
  return `${left.trim()}\n\n${right.trim()}`;
}

export function filterMcpMessages(messages: ChatMessage[]): ChatMessage[] {
  // 1) 先过滤掉 isMcpResponse（原始工具响应）
  const visible = messages.filter((m) => !m.isMcpResponse);

  // 2) 逐条处理，抽取 ```json:mcp:<clientId> ... ``` 代码块，并把提示词模式的一组 MCP 链路合并成同一条助手消息
  const result: ChatMessage[] = [];
  let pendingAssistant: ChatMessage | null = null;
  let pendingContent = "";
  let pendingMcpCalls: ExtractedMcpCall[] = [];

  const flushPendingAssistant = () => {
    if (!pendingAssistant) return;
    result.push({
      ...(pendingAssistant as any),
      content: pendingContent.trim(),
      mcpCalls: dedupeMcpCalls(pendingMcpCalls),
    } as any);
    pendingAssistant = null;
    pendingContent = "";
    pendingMcpCalls = [];
  };

  for (let i = 0; i < visible.length; i++) {
    const m = visible[i];

    // 压缩上下文消息直接透传，避免被 MCP 清洗逻辑误处理
    if (m.isCompressedContextPrompt) {
      flushPendingAssistant();
      result.push(m);
      continue;
    }

    // 仅处理助手消息
    if (m.role !== "assistant") {
      flushPendingAssistant();
      result.push(m);
      continue;
    }

    const parsed = parseAssistantMcpMessage(m);
    const shouldMergeIntoPending = !!pendingAssistant;

    // 无 MCP 且不在 MCP 链路中，直接保留普通助手消息
    if (!parsed.hasMcp && !shouldMergeIntoPending) {
      result.push(m);
      continue;
    }

    if (!pendingAssistant) {
      pendingAssistant = { ...(m as any), content: "" } as any;
    }

    const pendingLength = pendingContent.trim().length;
    pendingMcpCalls.push(
      ...parsed.mcpCalls.map((call) => ({
        ...call,
        contentOffset:
          pendingLength +
          (pendingLength > 0 && (call.contentOffset ?? 0) > 0 ? 2 : 0) +
          (call.contentOffset ?? 0),
      })),
    );
    pendingContent = joinAssistantContent(pendingContent, parsed.cleanContent);

    // 若当前 assistant 没有 MCP，说明这是工具链后的最终回答，合并后即可结束这一组链路。
    if (!parsed.hasMcp) {
      flushPendingAssistant();
    }
  }

  flushPendingAssistant();

  return result;
}
