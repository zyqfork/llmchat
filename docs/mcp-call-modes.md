# MCP 工具调用模式

## 概述

MCP (Model Context Protocol) 支持两种工具调用模式：

1. **提示词模式 (Prompt-based)** - 默认模式
2. **函数调用模式 (Function Call)** - 需要模型支持

## 调用模式对比

### 提示词模式 (Prompt-based)

**工作原理：**
- 通过系统提示词注入工具信息
- AI 生成特定格式的代码块来调用工具
- 格式：```json:mcp:{SERVER_ID}```

**优点：**
- ✅ 兼容性好，适用于所有支持对话的模型
- ✅ 可以自定义提示词模板
- ✅ 灵活性高，可以调整提示词来优化行为

**缺点：**
- ❌ 依赖模型理解和遵循提示词
- ❌ 可能出现格式错误
- ❌ 需要更多的 token 来描述工具

**适用场景：**
- 使用不支持 Function Call 的模型
- 需要自定义工具调用行为
- 对工具调用格式有特殊要求

### 函数调用模式 (Function Call)

**工作原理：**
- 使用 OpenAI Function Calling API
- 将 MCP 工具转换为 OpenAI 函数格式
- 模型直接返回结构化的函数调用

**优点：**
- ✅ 更精确，减少格式错误
- ✅ 原生支持，无需额外提示词
- ✅ 节省 token，提高效率

**缺点：**
- ❌ 需要模型支持 Function Calling
- ❌ 灵活性较低，受 API 限制
- ❌ 不是所有模型都支持

**适用场景：**
- 使用 OpenAI GPT-4/GPT-3.5 等支持 Function Call 的模型
- 需要精确的工具调用
- 希望节省 token 成本

## 支持的模型

### Function Call 模式支持的模型

- ✅ OpenAI GPT-4 系列
- ✅ OpenAI GPT-3.5-turbo
- ✅ OpenAI GPT-4o 系列
- ✅ Azure OpenAI (对应模型)
- ✅ 部分兼容 OpenAI API 的第三方模型

### Prompt 模式支持的模型

- ✅ 所有支持对话的模型

## 配置方法

### 在 MCP Market 中配置

1. 打开 MCP Market 页面
2. 滚动到底部的 "MCP 配置区域"
3. 选择调用模式：
   - **提示词模式** - 使用系统提示词
   - **函数调用模式** - 使用 Function Call API
4. 点击 "保存配置"

### 提示词模式的自定义

在提示词模式下，你可以：

1. 点击 "查看" 按钮查看当前使用的提示词模板
2. 点击 "编辑" 按钮自定义提示词：
   - **工具模板 (MCP_TOOLS_TEMPLATE)** - 格式化每个服务器的工具列表
   - **系统模板 (MCP_SYSTEM_TEMPLATE)** - 生成完整的系统提示词

支持的变量：
- `{{ clientId }}` - MCP 服务器 ID
- `{{ tools }}` - 工具列表 JSON
- `{{ MCP_TOOLS }}` - 所有工具的格式化输出

## 工具格式转换

### Prompt 模式格式

```json:mcp:smithery-websearch
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "AI news",
      "limit": 10
    }
  }
}
```

### Function Call 模式格式

```json
{
  "name": "mcp_smithery-websearch_search",
  "arguments": {
    "query": "AI news",
    "limit": 10
  }
}
```

## 最佳实践

1. **默认使用提示词模式**
   - 兼容性最好
   - 适合大多数场景

2. **在以下情况切换到 Function Call 模式**
   - 使用 OpenAI 模型
   - 需要更精确的工具调用
   - 希望节省 token 成本

3. **自定义提示词**
   - 根据实际使用情况优化提示词
   - 添加特定的使用说明
   - 强调重要的工具使用规则

4. **测试和验证**
   - 切换模式后测试工具调用是否正常
   - 观察模型的响应质量
   - 根据需要调整配置

## 故障排除

### 提示词模式问题

**问题：AI 不调用工具**
- 检查系统提示词是否正确注入
- 尝试强化提示词，明确要求使用工具
- 确认工具描述清晰易懂

**问题：工具调用格式错误**
- 在提示词中添加更多格式示例
- 强调格式要求
- 考虑切换到 Function Call 模式

### Function Call 模式问题

**问题：模型不支持 Function Call**
- 切换回提示词模式
- 使用支持 Function Call 的模型

**问题：工具调用失败**
- 检查工具定义是否正确转换
- 查看错误日志
- 验证 MCP 服务器状态

## 技术实现

### 配置存储

配置保存在 `localStorage` 中：
```typescript
{
  "mcpServers": {...},
  "callMode": "prompt" | "function_call",
  "customSystemPrompt": "...",
  "customToolsPrompt": "..."
}
```

### 工具转换逻辑

Function Call 模式下，MCP 工具会被转换为：
```typescript
{
  type: "function",
  function: {
    name: `mcp_${clientId}_${toolName}`,
    description: tool.description,
    parameters: tool.inputSchema
  }
}
```

## 使用步骤

### 切换到 Function Call 模式

1. 打开 MCP Market 页面
2. 滚动到底部的 "MCP 配置区域"
3. 选择 "函数调用模式 (Function Call)"
4. 点击 "保存配置"
5. 确保你的 MCP 服务器已启用并正常运行
6. 在对话中，模型将自动使用 Function Call 方式调用 MCP 工具

### 验证配置

1. 在对话中询问需要使用工具的问题
2. 观察模型是否正确调用工具
3. 检查工具调用结果是否正确返回

### 调试

如果工具调用失败：

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误信息
3. 检查 Network 标签页的请求详情
4. 确认 MCP 服务器状态为 "Running"
5. 尝试重启 MCP 服务器

## 技术细节

### Function Call 模式的实现

1. **工具定义转换**
   - MCP 工具的 `inputSchema` 被转换为 OpenAI 的 `parameters`
   - 工具名称格式：`mcp_{clientId}_{toolName}`
   - 保留 `_mcpMeta` 元数据用于调用时的路由

2. **工具调用流程**
   ```
   用户输入 → API 请求（带 tools 参数）
   → 模型返回 tool_calls
   → registerMcpToolFunctions 处理调用
   → executeMcpRequest 执行 MCP 请求
   → 返回结果给模型
   → 模型生成最终回复
   ```

3. **支持的平台**
   - OpenAI
   - Azure OpenAI
   - DeepSeek
   - Moonshot
   - XAI
   - ByteDance (Doubao)
   - Alibaba (Qwen)
   - Siliconflow
   - Anthropic (Claude)

## 未来计划

- [ ] 支持更多模型的 Function Call
- [ ] 提供更多预设提示词模板
- [ ] 添加工具调用统计和分析
- [ ] 支持混合模式（部分工具用 Function Call，部分用 Prompt）
- [ ] 添加工具调用日志和历史记录
- [ ] 支持工具调用的权限控制
