/**
 * 过滤和处理 MCP 相关消息（合并/隐藏提示词模式下的“工具声明”消息）
 */
import type { ChatMessage } from "@/app/store";

export function filterMcpMessages(messages: ChatMessage[]): ChatMessage[] {
  // 1) 先过滤掉 isMcpResponse（原始工具响应）
  const visible = messages.filter((m) => !m.isMcpResponse);

  // 2) 逐条处理，抽取 ```json:mcp:<clientId> ... ``` 代码块，必要时把它们合并到下一条助手消息
  const result: ChatMessage[] = [];

  for (let i = 0; i < visible.length; i++) {
    const m = visible[i];

    // 压缩上下文消息直接透传，避免被 MCP 清洗逻辑误处理
    if (m.isCompressedContextPrompt) {
      result.push(m);
      continue;
    }

    // 仅处理助手消息
    if (m.role !== "assistant") {
      result.push(m);
      continue;
    }

    // 读取纯文本内容
    const content =
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
        ? m.content.map((c) => (c.type === "text" ? c.text : "")).join("")
        : "";

    // 无 mcp 代码块，直接保留
    if (!content.includes("```json:mcp:")) {
      result.push(m);
      continue;
    }

    // 提取 MCP 调用信息
    const mcpMatches = Array.from(
      content.matchAll(/```json:mcp:(\w+)\s*\n([\s\S]*?)```/g),
    );
    let mcpCalls: Array<{
      toolName: string;
      clientId: string;
      rawJson: string;
    }> = [];
    mcpMatches.forEach((match) => {
      try {
        const clientId = match[1];
        const rawJson = match[2];
        const mcpData = JSON.parse(rawJson);
        const toolName = mcpData.params?.name || "工具";
        mcpCalls.push({ toolName, clientId, rawJson });
      } catch (e) {
        // ignore parse error
      }
    });
    // 去重：防止同一流式回复多次出现相同的 MCP 调用块
    const seen = new Set<string>();
    mcpCalls = mcpCalls.filter((c) => {
      const key = `${c.clientId}|${c.toolName}|${c.rawJson}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 移除代码块，保留其余内容
    const cleanContent = content.replace(/```json:mcp:[\s\S]*?```/g, "").trim();

    // 如果当前这条消息在提示词模式下纯粹是“调用工具声明”（清理后没有内容），
    // 则将 mcpCalls 合并到下一条助手消息的 mcpCalls 中，并丢弃本条，避免出现两条消息。
    if (!cleanContent) {
      // 向后查找下一条助手消息
      let merged = false;
      for (let j = i + 1; j < visible.length; j++) {
        const next = visible[j];
        if (next.role === "assistant") {
          const nextAny: any = next as any;
          const exist = Array.isArray(nextAny.mcpCalls) ? nextAny.mcpCalls : [];
          // 合并并去重
          const combined = [...exist, ...mcpCalls];
          const seen2 = new Set<string>();
          nextAny.mcpCalls = combined.filter((c: any) => {
            const key = `${c.clientId}|${c.toolName}|${c.rawJson}`;
            if (seen2.has(key)) return false;
            seen2.add(key);
            return true;
          });
          merged = true;
          break;
        }
      }
      if (!merged) {
        // 若没有下一条助手消息，则把本条保留为“空内容+mcpCalls”，但前端将仅通过左上角徽标显示
        result.push({ ...(m as any), content: "", mcpCalls } as any);
      }
      continue;
    }

    // 否则，保留本条消息，内容为清理后文本，并附带 mcpCalls
    result.push({ ...(m as any), content: cleanContent, mcpCalls } as any);
  }

  return result;
}
