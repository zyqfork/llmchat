# MCP 工具调用修复说明

## 问题描述

用户添加了 MCP 服务器后，在聊天中询问问题时，AI 生成了错误格式的工具调用：

```
```json:mcp:search
{"method": "tools/call","params": {"name": "search","arguments": {"query": "今日新闻 2024","limit": 10,"engines": ["bing", "baidu"]}}}
```
```

问题：
1. 使用了工具名 `search` 而不是服务器 ID（如 `smithery-websearch`）
2. 导致工具调用无法被正确识别和执行

## 根本原因

AI 混淆了两个概念：
- **Server ID (clientId)**: MCP 服务器的唯一标识符（如 `smithery-websearch`, `filesystem`）
- **Tool Name**: 工具的名称（如 `search`, `write_file`）

正确的格式应该是：
```
```json:mcp:{SERVER_ID}
{
  "method": "tools/call",
  "params": {
    "name": "{TOOL_NAME}",
    "arguments": {...}
  }
}
```
```

## 解决方案

### 1. 改进工具列表模板

**修改前**:
```typescript
export const MCP_TOOLS_TEMPLATE = `
### {{ clientId }} Tools
Available tools from {{ clientId }}:
{{ tools }}
`;
```

**修改后**:
```typescript
export const MCP_TOOLS_TEMPLATE = `
### MCP Server: {{ clientId }}
**Server ID (clientId)**: {{ clientId }}
**Available Tools**:
{{ tools }}

**IMPORTANT**: When calling these tools, you MUST use the Server ID "{{ clientId }}" in the code block format:
\`\`\`json:mcp:{{ clientId }}
{
  "method": "tools/call",
  "params": {
    "name": "tool_name_here",
    "arguments": {...}
  }
}
\`\`\`
`;
```

### 2. 改进系统提示词

**关键改进**:
- 明确说明 `{clientId}` 是服务器 ID，不是工具名
- 添加具体示例，展示正确和错误的用法
- 强调使用服务器 ID 的重要性

**新增内容**:
```
**CRITICAL**: {clientId} is the MCP Server ID (e.g., "smithery-websearch", "filesystem"), NOT the tool name!

Example: If using "search" tool from "smithery-websearch" server, use ```json:mcp:smithery-websearch```
```

### 3. 改进示例

**新增对比示例**:

✅ **正确示例** - 使用 "search" 工具从 "smithery-websearch" 服务器:
```
```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "today's news",
      "limit": 10
    }
  }
}
```
```

❌ **错误示例** - 使用工具名而不是服务器 ID:
```
```json:mcp:search  <-- WRONG!
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {...}
  }
}
```
```

## 使用指南

### 对于用户

1. **添加 MCP 服务器**
   - 给服务器一个清晰的 ID（如 `smithery-websearch`）
   - 记住这个 ID，它会在工具调用中使用

2. **在聊天中使用**
   - 直接提出需求（如"搜索今天的新闻"）
   - AI 会自动调用相应的工具
   - 等待工具执行结果

3. **如果工具调用失败**
   - 检查浏览器控制台的错误信息
   - 确认服务器状态为"Running"
   - 尝试重新提问

### 对于 AI

当用户请求需要使用工具时：

1. **识别需要的工具**
   - 查看可用的 MCP 服务器和工具
   - 选择最合适的工具

2. **构建正确的调用格式**
   ```
   ```json:mcp:{SERVER_ID}
   {
     "method": "tools/call",
     "params": {
       "name": "{TOOL_NAME}",
       "arguments": {
         // 工具参数
       }
     }
   }
   ```
   ```

3. **关键点**
   - 使用服务器 ID（如 `smithery-websearch`），不是工具名（如 `search`）
   - 始终使用 `"method": "tools/call"`
   - 工具名放在 `params.name` 中
   - 工具参数放在 `params.arguments` 中

## 工具调用流程

```
用户提问
    ↓
AI 识别需要使用工具
    ↓
AI 生成工具调用 JSON
    ↓
系统解析 JSON
    ↓
提取 clientId 和工具调用参数
    ↓
调用 MCP 服务器
    ↓
返回结果给 AI
    ↓
AI 解释结果给用户
```

## 示例对话

### 示例 1: 搜索新闻

**用户**: 搜索今天的新闻

**AI**: 我来帮你搜索今天的新闻。

```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "今日新闻 2024",
      "limit": 10
    }
  }
}
```

**系统**: [返回搜索结果]

**AI**: 以下是今天的主要新闻：
1. ...
2. ...

### 示例 2: 创建文件

**用户**: 创建一个文件保存这些信息

**AI**: 我来为你创建文件。

```json:mcp:filesystem
{
  "method": "tools/call",
  "params": {
    "name": "write_file",
    "arguments": {
      "path": "/path/to/news.txt",
      "content": "今日新闻摘要..."
    }
  }
}
```

**系统**: [返回创建结果]

**AI**: 文件已成功创建在 /path/to/news.txt

## 常见错误

### 错误 1: 使用工具名作为 clientId

❌ 错误:
```
```json:mcp:search
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {...}
  }
}
```
```

✅ 正确:
```
```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {...}
  }
}
```
```

### 错误 2: 直接使用工具名作为 method

❌ 错误:
```
```json:mcp:smithery-websearch
{
  "method": "search",
  "params": {...}
}
```
```

✅ 正确:
```
```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {...}
  }
}
```
```

### 错误 3: 缺少代码块格式

❌ 错误:
```
{
  "method": "tools/call",
  "params": {...}
}
```

✅ 正确:
```
```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {...}
}
```
```

## 调试技巧

### 1. 检查工具列表

在聊天设置中查看可用的 MCP 工具：
- 服务器 ID 是什么？
- 有哪些工具可用？
- 每个工具需要什么参数？

### 2. 查看浏览器控制台

打开浏览器开发者工具（F12）：
- 查看是否有 MCP 相关的错误
- 检查工具调用是否被正确解析
- 查看服务器响应

### 3. 测试工具调用

可以手动构造工具调用来测试：
```
```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "test",
      "limit": 5
    }
  }
}
```
```

发送这条消息，看是否能正确执行。

## 相关文件

- `app/constant.ts` - 系统提示词和模板
- `app/store/chat.ts` - 聊天逻辑和 MCP 集成
- `app/mcp/utils.ts` - MCP JSON 解析
- `app/mcp/actions.client.ts` - MCP 操作执行

## 总结

通过以下改进，AI 现在应该能够正确生成 MCP 工具调用：

1. ✅ 明确区分服务器 ID 和工具名
2. ✅ 提供清晰的示例和对比
3. ✅ 强调关键点和常见错误
4. ✅ 改进工具列表的展示格式

用户现在可以：
- 成功添加 MCP 服务器
- 在聊天中使用 MCP 工具
- 获得工具执行结果
- 享受完整的 MCP 功能！
