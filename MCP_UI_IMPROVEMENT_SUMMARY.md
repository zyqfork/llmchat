# MCP 聊天界面优化 - 修复总结

## 问题
使用 MCP 工具时，聊天界面显示了技术细节（MCP 调用请求和响应的 JSON 数据），影响用户体验。

## 解决方案
在 `app/components/chat.tsx` 中添加消息过滤机制，隐藏 MCP 相关的技术消息，只显示用户问题和 AI 的最终答案。

## 修改内容

### 1. 添加过滤函数
```typescript
const filterMcpMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.filter((m) => {
    if (m.isMcpResponse) return false;
    const content = typeof m.content === "string" ? m.content : ...;
    if (content.includes("```json:mcp:") && m.role === "assistant") {
      return false;
    }
    return true;
  });
};
```

### 2. 应用过滤
- 在 `renderMessages` 中过滤消息列表
- 在消息数量显示中使用过滤后的数量

## 效果对比

**修复前：**
```
用户：今天的热点新闻
AI：[显示 MCP 调用 JSON]
用户：[显示 MCP 响应 JSON]
AI：根据搜索结果...
```

**修复后：**
```
用户：今天的热点新闻
AI：根据搜索结果...
```

## 技术说明
- MCP 消息仍然存储在会话中（AI 需要这些信息）
- 只是在 UI 层面隐藏，不影响功能
- 消息历史和导出功能保持完整

详细文档：`docs/mcp-ui-fix.md`
