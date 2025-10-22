# MCP 聊天界面优化

## 问题描述

在使用 MCP 工具时，聊天界面会显示 MCP 调用的技术细节，包括：

1. AI 发送的 MCP 调用请求（JSON 格式）
2. 系统返回的 MCP 响应（`json:mcp-response` 代码块）

这些技术细节对用户来说是不必要的，应该被隐藏，只显示 AI 处理后的最终结果。

### 示例问题

**修复前的聊天界面：**

```
用户：今天的热点新闻

AI：我来为您搜索今天的热点新闻。
```json:mcp:mymcp
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "今天热点新闻 最新资讯",
      "engines": ["bing", "baidu"],
      "limit": 15
    }
  }
}
```

用户：```json:mcp-response:mymcp
{"content":[{"type":"text","text":"...搜索结果..."}]}
```

AI：根据搜索结果，以下是今天的主要热点新闻：...
```

**修复后的聊天界面：**

```
用户：今天的热点新闻

AI：根据搜索结果，以下是今天的主要热点新闻：...
```

## 解决方案

### 1. 消息过滤机制

在 `app/components/chat.tsx` 中添加了 `filterMcpMessages` 函数，用于过滤掉：

- 标记为 `isMcpResponse: true` 的消息（MCP 工具响应）
- 包含 `json:mcp:` 代码块的 AI 消息（MCP 工具调用请求）

```typescript
const filterMcpMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.filter((m) => {
    // 隐藏 MCP 响应消息
    if (m.isMcpResponse) return false;
    
    // 隐藏包含 MCP 调用请求的 AI 消息
    const content = typeof m.content === "string" 
      ? m.content 
      : Array.isArray(m.content) 
        ? m.content.map(c => c.type === "text" ? c.text : "").join("")
        : "";
    
    // 检查是否包含 MCP 调用代码块
    if (content.includes("```json:mcp:") && m.role === "assistant") {
      return false;
    }
    
    return true;
  });
};
```

### 2. 应用过滤

在以下位置应用了消息过滤：

1. **消息渲染列表** (`renderMessages`)：过滤掉 MCP 相关消息，只显示用户和 AI 的正常对话
2. **消息数量显示**：使用过滤后的消息数量，准确反映可见消息数

### 3. 现有基础设施

代码利用了已有的基础设施：

- `ChatMessage` 类型中已经定义了 `isMcpResponse?: boolean` 字段
- `onUserInput` 函数已经支持 `isMcpResponse` 参数
- MCP 响应消息创建时已经传递了 `isMcpResponse: true` 标记

## 技术细节

### 消息流程

1. **用户发送问题** → 正常显示
2. **AI 决定使用 MCP 工具** → 发送包含 `json:mcp:` 的消息 → **被过滤，不显示**
3. **系统执行 MCP 工具** → 创建 `isMcpResponse: true` 的消息 → **被过滤，不显示**
4. **AI 处理 MCP 响应** → 生成最终答案 → 正常显示

### 代码修改位置

- `app/components/chat.tsx`
  - 添加 `filterMcpMessages` 函数
  - 更新 `renderMessages` 使用过滤函数
  - 更新消息数量显示使用过滤后的数量

## 测试建议

1. 启用 MCP 工具（如 web search）
2. 发送需要使用 MCP 工具的问题
3. 验证聊天界面只显示用户问题和 AI 的最终答案
4. 验证消息数量正确（不包含隐藏的 MCP 消息）
5. 验证其他功能正常（复制、重试、删除等）

## 注意事项

- MCP 调用过程对用户完全透明，用户只看到最终结果
- MCP 消息仍然存储在会话中，并会被发送到 AI 模型（AI 需要这些信息来生成答案）
- MCP 消息只是在用户界面上被隐藏，不影响 AI 的功能
- 调试时如需查看 MCP 调用细节，可以使用浏览器开发者工具查看控制台日志
- 消息历史和导出功能仍会包含所有消息（包括隐藏的 MCP 消息），这是为了保持数据完整性

## 工作原理

### 消息流程详解

```
用户输入 → AI 分析 → 决定使用 MCP 工具
                ↓
        生成 MCP 调用请求（包含 json:mcp: 代码块）
                ↓
        [存储但不显示在 UI]
                ↓
        系统执行 MCP 工具
                ↓
        创建 MCP 响应消息（isMcpResponse: true）
                ↓
        [存储但不显示在 UI]
                ↓
        将 MCP 响应发送给 AI
                ↓
        AI 处理并生成最终答案
                ↓
        [显示在 UI]
```

### 为什么 MCP 消息需要保留？

1. **AI 需要上下文**：AI 需要看到 MCP 工具的响应才能生成有意义的答案
2. **会话连续性**：保留完整的消息历史确保会话上下文完整
3. **调试和审计**：完整的消息历史有助于调试和问题追踪
4. **导出功能**：用户导出对话时可以看到完整的交互过程（如果需要）
