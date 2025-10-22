# MCP 聊天界面优化示例

## 使用场景：搜索今日新闻

### 修复前的体验 ❌

```
用户：
今天的热点新闻

AI：
我来为您搜索今天的热点新闻。
```json:mcp:smithery-websearch
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

用户：
```json:mcp-response:smithery-websearch
{"content":[{"type":"text","text":"{\n  \"query\": \"今天热点新闻 最新资讯\",\n  \"totalResults\": 7,\n  \"results\": [...]}"}]}
```

AI：
根据搜索结果，以下是今天（2024年10月23日）的主要热点新闻：

1. 嫦娥六号月壤研究新发现...
2. 第138届广交会第二期即将举行...
3. ...
```

**问题：**
- 用户看到大量技术细节（JSON 数据）
- 对话流程被打断
- 用户体验差，难以理解发生了什么

---

### 修复后的体验 ✅

```
用户：
今天的热点新闻

AI：
我来为您搜索今天的热点新闻。

🔧 正在调用工具: search...

AI：
根据搜索结果，以下是今天（2024年10月23日）的主要热点新闻：

1. 嫦娥六号月壤研究新发现...
2. 第138届广交会第二期即将举行...
3. ...
```

**改进：**
- ✅ 保留了 AI 的说明文字（"我来为您搜索..."）
- ✅ 用友好的方式显示工具调用（"🔧 正在调用工具: search..."）
- ✅ 隐藏了用户看不懂的 JSON 数据
- ✅ 对话流程自然连贯
- ✅ 用户清楚知道 AI 在做什么

---

## 使用场景：文件操作

### 修复前 ❌

```
用户：
帮我创建一个 README.md 文件

AI：
好的，我来为您创建 README.md 文件。
```json:mcp:filesystem
{
  "method": "tools/call",
  "params": {
    "name": "write_file",
    "arguments": {
      "path": "README.md",
      "content": "# My Project\n\nThis is a sample project."
    }
  }
}
```

用户：
```json:mcp-response:filesystem
{"content":[{"type":"text","text":"File created successfully"}]}
```

AI：
README.md 文件已成功创建！
```

### 修复后 ✅

```
用户：
帮我创建一个 README.md 文件

AI：
好的，我来为您创建 README.md 文件。

🔧 正在调用工具: write_file...

AI：
README.md 文件已成功创建！
```

---

## 技术实现

### 消息转换逻辑

```typescript
// 检测到 MCP 调用代码块
if (content.includes("```json:mcp:")) {
  // 提取工具信息
  const mcpMatch = content.match(/```json:mcp:(\w+)\s*\n([\s\S]*?)```/);
  
  if (mcpMatch) {
    const mcpData = JSON.parse(mcpMatch[2]);
    const toolName = mcpData.params?.name || "工具";
    
    // 替换为友好提示
    const toolInfo = `\n\n🔧 *正在调用工具: ${toolName}...*\n`;
    const cleanContent = content.replace(/```json:mcp:[\s\S]*?```/g, toolInfo);
    
    return { ...message, content: cleanContent };
  }
}
```

### 显示效果

| 原始内容 | 转换后 |
|---------|--------|
| `{"method": "tools/call", "params": {"name": "search", ...}}` | 🔧 *正在调用工具: search...* |
| `{"method": "tools/call", "params": {"name": "write_file", ...}}` | 🔧 *正在调用工具: write_file...* |
| `{"method": "tools/call", "params": {"name": "read_file", ...}}` | 🔧 *正在调用工具: read_file...* |

---

## 用户反馈

### 修复前
- ❌ "这些 JSON 是什么？"
- ❌ "为什么我的消息变成了代码？"
- ❌ "看不懂这些技术细节"

### 修复后
- ✅ "很清楚 AI 在调用什么工具"
- ✅ "对话流程很自然"
- ✅ "不会被技术细节打扰"
