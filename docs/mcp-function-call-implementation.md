# MCP Function Call 模式实现总结

## 实现的功能

### 1. 配置界面

在 MCP Market 底部添加了配置区域，包括：

- **调用模式选择器**：用户可以选择 "提示词模式" 或 "函数调用模式"
- **系统提示词编辑器**：在提示词模式下可以查看和编辑自定义提示词
- **保存配置按钮**：保存用户的选择

### 2. 数据模型

#### McpConfigData 扩展
```typescript
export interface McpConfigData {
  mcpServers: Record<string, ServerConfig>;
  customSystemPrompt?: string;
  customToolsPrompt?: string;
  callMode?: McpCallMode; // 新增：调用模式
}
```

#### 调用模式类型
```typescript
export type McpCallMode = "prompt" | "function_call";
```

### 3. 核心功能

#### 工具定义转换
- `getMcpToolsForFunctionCall()`: 将 MCP 工具转换为 OpenAI Function Call 格式
- 工具命名规则：`mcp_{clientId}_{toolName}`
- 保留元数据 `_mcpMeta` 用于调用路由

#### 工具调用处理
- `executeMcpRequest()`: 执行 MCP 工具调用
- `registerMcpToolFunctions()`: 为每个 MCP 工具注册处理函数
- 自动处理工具调用的参数和返回值

#### 系统提示词控制
- `getMcpSystemPrompt()`: 根据调用模式决定是否注入系统提示词
- Function Call 模式下不注入提示词，避免冲突

### 4. API 集成

#### ChatOptions 扩展
```typescript
export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  tools?: any[]; // 新增：MCP 工具定义
  // ... 其他字段
}
```

#### 平台支持
已在以下平台实现 Function Call 支持：
- OpenAI
- Azure OpenAI
- DeepSeek
- Moonshot
- XAI
- ByteDance (Doubao)
- Alibaba (Qwen)
- Siliconflow
- Anthropic (Claude)

### 5. 用户体验

#### UI 改进
- 清晰的模式选择界面
- 详细的模式说明
- 实时配置保存
- 状态指示器

#### 配置持久化
- 使用 localStorage 保存配置
- 自动加载用户的选择
- 支持配置导入导出

## 文件修改清单

### 核心文件
1. `app/mcp/types.ts` - 添加调用模式类型定义
2. `app/mcp/actions.client.ts` - 添加工具转换和执行函数
3. `app/store/chat.ts` - 添加工具获取和传递逻辑
4. `app/client/api.ts` - 扩展 ChatOptions 接口
5. `app/utils/chat.ts` - 添加工具函数注册逻辑

### UI 文件
6. `app/components/mcp-market.tsx` - 添加配置界面
7. `app/components/mcp-market.module.scss` - 添加样式

### 平台文件
8. `app/client/platforms/openai.ts`
9. `app/client/platforms/deepseek.ts`
10. `app/client/platforms/xai.ts`
11. `app/client/platforms/moonshot.ts`
12. `app/client/platforms/bytedance.ts`
13. `app/client/platforms/alibaba.ts`
14. `app/client/platforms/siliconflow.ts`
15. `app/client/platforms/anthropic.ts`

### 文档文件
16. `docs/mcp-call-modes.md` - 使用指南
17. `docs/mcp-function-call-implementation.md` - 实现总结

## 工作流程

### Prompt 模式（默认）
```
用户输入
  ↓
获取消息历史
  ↓
注入 MCP 系统提示词
  ↓
发送到 API（无 tools 参数）
  ↓
模型生成代码块格式的工具调用
  ↓
解析代码块并执行 MCP 请求
  ↓
返回结果
```

### Function Call 模式
```
用户输入
  ↓
获取消息历史
  ↓
获取 MCP 工具定义
  ↓
发送到 API（带 tools 参数）
  ↓
模型返回 tool_calls
  ↓
registerMcpToolFunctions 处理
  ↓
executeMcpRequest 执行
  ↓
返回结果给模型
  ↓
模型生成最终回复
```

## 关键代码片段

### 工具定义转换
```typescript
export async function getMcpToolsForFunctionCall() {
  const tools: any[] = [];
  
  for (const [clientId, status] of clientsMap.entries()) {
    status.tools.tools.forEach((tool: any) => {
      tools.push({
        type: "function",
        function: {
          name: `mcp_${clientId}_${tool.name}`,
          description: tool.description,
          parameters: tool.inputSchema,
        },
        _mcpMeta: { clientId, toolName: tool.name },
      });
    });
  }
  
  return tools;
}
```

### 工具调用处理
```typescript
export function registerMcpToolFunctions(
  tools: any[],
  funcs: Record<string, Function>,
) {
  tools.forEach((tool: any) => {
    if (tool._mcpMeta) {
      const { clientId, toolName } = tool._mcpMeta;
      funcs[tool.function.name] = async (args: any) => {
        const { executeMcpRequest } = await import("@/app/mcp/actions.client");
        const result = await executeMcpRequest(clientId, {
          method: "tools/call",
          params: { name: toolName, arguments: args },
        });
        return { status: 200, data: result };
      };
    }
  });
}
```

### 系统提示词控制
```typescript
async function getMcpSystemPrompt(
  mcpEnabled: boolean = false,
  enabledClients?: Record<string, boolean>,
): Promise<string> {
  if (!mcpEnabled) return "";
  
  const config = await getMcpConfigFromFile();
  
  // Function Call 模式下不注入提示词
  if (config.callMode === "function_call") {
    return "";
  }
  
  // Prompt 模式下注入提示词
  // ...
}
```

## 测试建议

### 功能测试
1. 切换调用模式并保存
2. 验证配置持久化
3. 测试工具调用是否正常
4. 检查错误处理

### 兼容性测试
1. 测试不同模型的支持情况
2. 验证不同平台的工具调用
3. 测试工具调用失败的处理

### 性能测试
1. 测试大量工具的性能
2. 验证工具调用的响应时间
3. 检查内存使用情况

## 已知限制

1. **模型支持**：不是所有模型都支持 Function Call
2. **工具数量**：过多工具可能影响性能
3. **错误处理**：需要更完善的错误提示
4. **日志记录**：缺少详细的调用日志

## 后续优化方向

1. **混合模式**：允许部分工具使用 Function Call，部分使用 Prompt
2. **工具分组**：按类别组织工具，提高可读性
3. **权限控制**：添加工具调用的权限管理
4. **性能优化**：缓存工具定义，减少重复转换
5. **监控统计**：添加工具调用的统计和分析
6. **错误恢复**：自动重试失败的工具调用
7. **调试工具**：提供工具调用的调试界面
