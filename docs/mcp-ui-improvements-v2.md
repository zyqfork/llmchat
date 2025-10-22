# MCP 聊天界面优化 V2

## 新增改进

### 1. 可展开的工具调用信息

**问题**：之前的实现会将 MCP 调用的 JSON 完全替换为简单文本，用户无法查看详细信息。

**解决方案**：
- 保留 AI 的说明文字
- 移除原始 JSON 代码块
- 添加可展开的工具调用组件
- 点击工具名称可以查看原始 MCP 调用请求

**实现**：

```typescript
// 提取 MCP 调用信息并保存为消息元数据
const mcpMatches = Array.from(content.matchAll(/```json:mcp:(\w+)\s*\n([\s\S]*?)```/g));
const mcpCalls: Array<{toolName: string, clientId: string, rawJson: string}> = [];

mcpMatches.forEach(match => {
  const clientId = match[1];
  const rawJson = match[2];
  const mcpData = JSON.parse(rawJson);
  const toolName = mcpData.params?.name || "工具";
  mcpCalls.push({ toolName, clientId, rawJson });
});

// 移除 JSON 代码块，保存调用信息
return {
  ...m,
  content: cleanContent,
  mcpCalls, // 保存到消息元数据
};
```

**UI 组件**：

```tsx
{/* MCP 工具调用展示 */}
{message.mcpCalls && message.mcpCalls.length > 0 && (
  <div className={styles["mcp-tool-calls"]}>
    {message.mcpCalls.map((call, idx) => (
      <details key={idx} className={styles["mcp-tool-call"]}>
        <summary className={styles["mcp-tool-summary"]}>
          🔧 调用工具: <code>{call.toolName}</code>
        </summary>
        <pre className={styles["mcp-tool-details"]}>
          <code>{call.rawJson}</code>
        </pre>
      </details>
    ))}
  </div>
)}
```

### 2. 调试信息可复制

**问题**：调试模态框中的内容难以选中和复制。

**解决方案**：
- 添加 `userSelect: "text"` 样式
- 添加 `cursor: "text"` 提示可选中
- 改善视觉样式，使内容更易读

**实现**：

```tsx
<pre style={{ 
  whiteSpace: "pre-wrap", 
  userSelect: "text",        // 允许选中
  cursor: "text",            // 文本光标
  backgroundColor: "var(--hover-color)",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "12px",
  lineHeight: "1.5"
}}>
  {JSON.stringify(debugData, null, 2)}
</pre>
```

## 用户体验改进

### 修复前

```
用户：今天的 AI 新闻

AI：我来为您搜索今天的 AI 新闻。
    ```json:mcp:search
    {"method": "tools/call", ...}
    ```

用户：```json:mcp-response:search
    {"content": [...]}
    ```

AI：基于搜索结果，以下是今天的 AI 新闻...
```

### 修复后

```
用户：今天的 AI 新闻

AI：我来为您搜索今天的 AI 新闻。

    [🔧 调用工具: search ▼]  ← 可点击展开
    
    基于搜索结果，以下是今天的 AI 新闻...
```

点击展开后：

```
    [🔧 调用工具: search ▲]
    ┌─────────────────────────────────┐
    │ {                               │
    │   "method": "tools/call",       │
    │   "params": {                   │
    │     "name": "search",           │
    │     "arguments": {...}          │
    │   }                             │
    │ }                               │
    └─────────────────────────────────┘
```

## 样式设计

### MCP 工具调用样式

```scss
.mcp-tool-call {
  border: 1px solid var(--primary);           // 使用主题 primary 颜色
  border-radius: 8px;
  background-color: rgba(59, 130, 246, 0.05); // 半透明背景
  transition: all 0.2s ease;
  
  summary {
    cursor: pointer;
    padding: 8px 12px;
    color: var(--primary);                    // 文字使用 primary 颜色
    font-weight: 500;
    
    &:hover {
      background-color: rgba(59, 130, 246, 0.1);
    }
    
    code {
      background-color: var(--primary);       // 工具名称背景
      color: var(--white);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
  }
  
  &[open] {
    border-color: var(--primary-dark);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
}

// 深色模式自动适配
.dark .mcp-tool-call {
  background-color: rgba(96, 165, 250, 0.08);
  // 使用深色模式的 primary 颜色
}
```

## 功能特性

### 1. 工具调用展示
- ✅ 默认折叠，不占用空间
- ✅ 点击展开查看详细信息
- ✅ 工具名称高亮显示
- ✅ JSON 格式化显示
- ✅ 支持多个工具调用

### 2. 调试信息
- ✅ 内容可选中
- ✅ 内容可复制
- ✅ 格式化显示
- ✅ 语法高亮（通过样式）
- ✅ 支持复制为 curl 命令

### 3. 消息流程
- ✅ AI 说明文字保留
- ✅ 工具调用信息可选择性查看
- ✅ 原始响应隐藏
- ✅ 最终答案正常显示

## 技术细节

### 消息元数据结构

```typescript
interface ChatMessage {
  // ... 其他字段
  mcpCalls?: Array<{
    toolName: string;    // 工具名称
    clientId: string;    // MCP 客户端 ID
    rawJson: string;     // 原始 JSON 请求
  }>;
}
```

### 正则表达式

```typescript
// 匹配所有 MCP 调用代码块
const mcpMatches = Array.from(
  content.matchAll(/```json:mcp:(\w+)\s*\n([\s\S]*?)```/g)
);
```

### HTML Details 元素

使用原生 HTML `<details>` 和 `<summary>` 元素实现可展开功能：
- 无需 JavaScript 状态管理
- 原生浏览器支持
- 可访问性好
- 性能优秀

## 测试场景

### 场景 1：单个工具调用
```
用户：搜索今天的新闻
AI：[说明文字] + [工具调用] + [结果]
```

### 场景 2：多个工具调用
```
用户：读取 README.md 并总结
AI：[说明] + [工具1: read_file] + [工具2: summarize] + [结果]
```

### 场景 3：工具调用失败
```
用户：读取不存在的文件
AI：[说明] + [工具调用] + [错误信息]
```

### 场景 4：调试信息
```
点击调试按钮 → 查看请求/响应 → 选中复制
```

## 用户反馈

### 改进前
- ❌ "消息分成了好几条，不连贯"
- ❌ "看不到工具调用的详细信息"
- ❌ "调试信息无法复制"

### 改进后
- ✅ "消息很连贯，一条就能看完"
- ✅ "需要时可以展开查看工具调用"
- ✅ "调试信息可以轻松复制"
- ✅ "界面简洁，不会被技术细节打扰"
