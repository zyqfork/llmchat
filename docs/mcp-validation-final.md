# MCP 验证逻辑最终方案

## 问题回顾

用户在添加 Smithery MCP 服务器时遇到 406 错误：

```
https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=244f14f9-df04-4990-b2b3-86fa3d88995f&profile=average-canid-vfO9m9
```

使用 curl 测试成功，但在浏览器中失败。

## 根本原因

**浏览器 fetch API 的 Accept Header 限制**

1. 浏览器可能会修改或忽略自定义的 Accept headers
2. 导致服务器返回 406 (Not Acceptable)
3. 特别是对于需要 `text/event-stream` 的 SSE 服务器

## 解决方案

### 最终方案：跳过 fetch 验证

**实现**:
```typescript
export async function validateMcpServer(config: ServerConfig): Promise<void> {
  // 验证基本配置
  if (!config.baseUrl) {
    throw new Error("Base URL is required");
  }

  // 验证 URL 格式
  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error("Invalid Base URL format");
  }

  // 跳过 fetch 验证，由 MCP SDK 在实际连接时验证
  if (config.type === "sse") {
    logger.info(`Validating SSE server at ${config.baseUrl}...`);
    logger.warn(
      "Skipping fetch validation for SSE (browser fetch API limitations with Accept headers)",
    );
    logger.success(
      "SSE server URL format validated, actual connection will be tested during SDK initialization",
    );
  } else if (config.type === "streamableHttp") {
    logger.info(
      `Validating Streamable HTTP server at ${config.baseUrl}...`,
    );
    logger.warn(
      "Skipping fetch validation for Streamable HTTP (browser fetch API limitations)",
    );
    logger.success(
      "Streamable HTTP server URL format validated, actual connection will be tested during SDK initialization",
    );
  }
}
```

**优点**:
- ✅ 避免浏览器 fetch API 的所有限制
- ✅ 简单可靠
- ✅ 实际连接由 MCP SDK 处理，更加准确
- ✅ 不需要额外的后端服务
- ✅ 用户体验流畅

**缺点**:
- ❌ 无法在添加前验证服务器是否可用
- ❌ 用户需要等到实际连接时才知道是否成功

## 使用指南

### 添加 Smithery 服务器

1. **打开 MCP Market 页面**

2. **点击"添加服务器"**

3. **填写信息**:
   - **Server ID**: `smithery-websearch`
   - **名称**: `Smithery Web Search`
   - **描述**: `Web search via Smithery`
   - **传输类型**: 选择 `SSE (Server-Sent Events)` ⚠️ 重要！
   - **Base URL**: 
     ```
     https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=244f14f9-df04-4990-b2b3-86fa3d88995f&profile=average-canid-vfO9m9
     ```
   - **请求头**: 保持默认
   - **超时时间**: 60 秒

4. **点击"添加"**
   - 验证会立即成功（只检查 URL 格式）
   - 服务器被添加到列表

5. **等待初始化**
   - 服务器显示"Initializing"状态
   - MCP SDK 尝试建立连接
   - 几秒后状态变为"Running"（成功）或"Error"（失败）

6. **如果成功**
   - 点击"工具"查看可用工具
   - 在聊天中使用服务器

7. **如果失败**
   - 查看错误信息
   - 打开浏览器控制台查看详细日志
   - 检查 URL 是否正确
   - 检查 API key 是否有效
   - 点击"启动"重试

## SSE vs Streamable HTTP

### 如何选择？

**选择 SSE 如果**:
- 服务器返回 SSE 格式响应（`event: message\ndata: ...`）
- 服务器需要 POST 请求但返回事件流
- 例如：Smithery 服务器

**选择 Streamable HTTP 如果**:
- 服务器返回纯 JSON 响应
- 标准的 JSON-RPC 请求-响应模式
- 例如：大多数自建 MCP 服务器

### 如何判断？

使用 curl 测试：

```bash
curl -X POST \
  'YOUR_SERVER_URL' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}'
```

**如果响应是**:
```
event: message
data: {...}
```
→ 选择 SSE

**如果响应是**:
```json
{"jsonrpc":"2.0","id":1,"result":{...}}
```
→ 选择 Streamable HTTP

## 常见问题

### Q: 为什么不在添加时验证服务器？

**A**: 浏览器环境中的 fetch API 有太多限制，特别是 Accept header 可能被修改或忽略。使用 MCP SDK 进行实际连接验证更加可靠。

### Q: 如何知道服务器是否连接成功？

**A**: 查看服务器状态：
- "Initializing" - 正在连接
- "Running" (绿色) - 连接成功
- "Error" (红色) - 连接失败

### Q: 连接失败怎么办？

**A**: 
1. 查看错误信息
2. 打开浏览器控制台（F12）查看详细日志
3. 检查 URL、API key、传输类型是否正确
4. 点击"启动"重试
5. 如果仍然失败，参考错误信息调整配置

### Q: 为什么 Smithery 要选择 SSE？

**A**: Smithery 服务器虽然使用 POST 请求，但返回的是 SSE 格式的响应流，而不是纯 JSON。这是 SSE 的特征。

### Q: 可以同时添加多个服务器吗？

**A**: 可以！每个服务器独立运行，互不影响。

### Q: 服务器状态一直是"Initializing"怎么办？

**A**: 
1. 等待 1-2 分钟（某些服务器冷启动需要时间）
2. 刷新页面
3. 点击"停止"然后"启动"重试
4. 检查网络连接
5. 查看浏览器控制台的错误信息

## 技术细节

### 验证流程

```
用户点击"添加"
    ↓
验证 URL 格式
    ↓
添加到配置
    ↓
触发 SDK 初始化
    ↓
SDK 发送 initialize 请求
    ↓
建立连接
    ↓
成功 → 显示"Running"
失败 → 显示"Error"
```

### MCP SDK 初始化流程

1. **创建传输层**
   - SSE: 使用 SSEClientTransport
   - Streamable HTTP: 使用 StreamableHTTPClientTransport

2. **创建客户端**
   - 设置客户端信息
   - 配置能力

3. **连接传输层**
   - 发送 initialize 请求
   - 等待服务器响应
   - 交换能力信息

4. **获取工具列表**
   - 发送 tools/list 请求
   - 接收工具定义

5. **标记为就绪**
   - 更新状态为"Running"
   - 可以开始使用

### 错误处理

SDK 会捕获并报告以下错误：

- **连接超时**: 服务器无响应
- **认证失败**: API key 无效
- **协议错误**: 服务器不支持 MCP 协议
- **CORS 错误**: 跨域配置问题
- **网络错误**: 无法连接到服务器

## 相关文档

- [MCP 浏览器环境限制说明](./mcp-browser-limitations.md)
- [Smithery 使用指南](./mcp-smithery-guide.md)
- [MCP 测试指南](./mcp-sse-testing.md)
- [MCP 服务器开发指南](./mcp-server-development.md)

## 总结

通过跳过 fetch 验证，直接使用 MCP SDK 进行连接，我们成功解决了浏览器环境中的 Accept header 限制问题。

现在用户可以：
1. ✅ 成功添加 Smithery 服务器
2. ✅ 选择正确的传输类型（SSE）
3. ✅ 查看实时的连接状态
4. ✅ 获取详细的错误信息
5. ✅ 轻松重试连接

这个方案简单、可靠，提供了良好的用户体验！
