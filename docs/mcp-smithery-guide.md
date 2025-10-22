# Smithery MCP 服务器使用指南

Smithery 是一个托管 MCP 服务器的平台，提供了许多预构建的 MCP 服务器。本指南介绍如何在应用中使用 Smithery 的 MCP 服务器。

## Smithery 服务器特点

1. **托管服务**: Smithery 提供完全托管的 MCP 服务器，无需自己部署
2. **SSE 协议**: Smithery 服务器使用 SSE (Server-Sent Events) 协议
3. **API Key 认证**: 通过 URL 参数传递 API key 进行认证
4. **Profile 系统**: 支持不同的配置 profile
5. **POST 请求**: 需要通过 POST 请求发送 JSON-RPC 消息

## 添加 Smithery 服务器

### 步骤 1: 获取服务器 URL

从 Smithery 获取完整的服务器 URL，格式通常为：
```
https://server.smithery.ai/@username/server-name/mcp?api_key=YOUR_API_KEY&profile=PROFILE_NAME
```

例如：
```
https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=244f14f9-df04-4990-b2b3-86fa3d88995f&profile=average-canid-vfO9m9
```

### 步骤 2: 在应用中添加

1. 打开 MCP Market 页面
2. 点击"添加服务器"按钮
3. 填写以下信息：
   - **Server ID**: 例如 `smithery-websearch`
   - **名称**: 例如 `Smithery Web Search`
   - **描述**: 例如 `Web search via Smithery`
   - **传输类型**: **重要！选择 `SSE (Server-Sent Events)`**
   - **Base URL**: 粘贴完整的 Smithery URL（包含 api_key 和 profile 参数）
   - **请求头**: 保持默认即可，或添加：
     ```
     Content-Type: application/json
     Accept: text/event-stream, application/json
     ```
   - **超时时间**: 建议设置为 60 秒（Smithery 服务器可能需要较长的初始化时间）

4. 点击"添加"按钮
5. 验证应该会成功！如果失败，可以选择跳过验证

### 步骤 3: 验证成功

使用正确的配置（SSE 传输类型 + 正确的 Accept 头），验证应该会成功。应用会：

1. 发送 POST 请求到服务器
2. 包含 `initialize` JSON-RPC 消息
3. 接收 SSE 格式的响应
4. 验证通过后添加服务器

### 步骤 4: 验证服务器状态

添加后，检查服务器状态：

1. 在 MCP Market 页面查看服务器状态
2. 如果显示"Running"（绿色），说明连接成功
3. 如果显示"Error"（红色），点击查看错误信息
4. 点击"工具"按钮查看可用的工具列表

## Smithery 服务器的工作原理

Smithery 服务器使用 SSE (Server-Sent Events) 协议：

1. **POST 请求**: 客户端通过 POST 请求发送 JSON-RPC 消息
2. **SSE 响应**: 服务器返回 SSE 格式的响应流
3. **Accept 头**: 必须包含 `text/event-stream` 或同时包含 `application/json`
4. **URL 参数**: API key 和 profile 通过 URL 参数传递

响应格式示例：
```
event: message
data: {"result":{"protocolVersion":"2024-11-05",...},"jsonrpc":"2.0","id":1}
```

我们的验证逻辑：
1. 发送 POST 请求，包含 `initialize` JSON-RPC 消息
2. 设置 `Accept: text/event-stream, application/json` 头
3. 检查响应状态码（应为 200）
4. 验证 Content-Type（应包含 `text/event-stream` 或 `application/json`）

## 常见问题

### Q: 为什么添加后显示"Error"状态？

**A**: 可能的原因：
1. API Key 无效或已过期
2. Profile 名称不正确
3. 网络连接问题
4. CORS 配置问题

**解决方法**:
- 检查 URL 中的 api_key 和 profile 参数是否正确
- 在浏览器控制台查看详细错误信息
- 尝试在浏览器中直接访问 URL，查看返回内容

### Q: 如何获取 API Key？

**A**: 
1. 访问 [Smithery 网站](https://smithery.ai)
2. 注册或登录账号
3. 在服务器页面获取 API Key
4. 复制完整的服务器 URL（包含 api_key 参数）

### Q: 可以修改已添加的服务器配置吗？

**A**: 
目前需要先移除服务器，然后重新添加。步骤：
1. 点击服务器的"停止"按钮
2. 点击"移除"按钮
3. 重新添加服务器，使用新的配置

### Q: 超时时间应该设置多少？

**A**: 
建议设置为 60 秒或更长。Smithery 服务器可能需要：
- 冷启动时间（如果服务器处于休眠状态）
- 初始化时间
- 网络延迟

### Q: 如何测试服务器是否正常工作？

**A**: 
1. 添加服务器后，等待状态变为"Running"
2. 点击"工具"按钮查看可用工具
3. 在聊天中尝试使用服务器提供的工具
4. 查看浏览器控制台的日志信息

## 使用 curl 测试 Smithery 服务器

正确的测试方法（包含正确的 Accept 头）：

```bash
# 正确的 POST 请求（包含 SSE Accept 头）
curl -X POST \
  'https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=YOUR_API_KEY&profile=YOUR_PROFILE' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "roots": {
          "listChanged": true
        }
      },
      "clientInfo": {
        "name": "test",
        "version": "1.0.0"
      }
    }
  }'
```

**预期响应**（SSE 格式）：
```
event: message
data: {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"web-search","version":"1.1.5"}},"jsonrpc":"2.0","id":1}
```

**错误示例**（缺少正确的 Accept 头）：
```bash
# 错误：只接受 application/json（会返回 406）
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  ...
```

## 最佳实践

1. **保存 URL**: 将完整的 Smithery URL 保存在安全的地方
2. **定期检查**: 定期检查服务器状态，确保 API Key 未过期
3. **合理超时**: 设置较长的超时时间（60 秒或更长）
4. **查看日志**: 遇到问题时，查看浏览器控制台的详细日志
5. **跳过验证**: 对于 Smithery 服务器，建议直接跳过验证

## 支持的 Smithery 服务器

Smithery 提供了许多预构建的 MCP 服务器，包括：

- **Web Search**: 网页搜索功能
- **GitHub**: GitHub 仓库操作
- **Database**: 数据库查询
- **File System**: 文件系统操作
- 更多服务器请访问 [Smithery 市场](https://smithery.ai/servers)

## 故障排除

### 问题: 添加后一直显示"Initializing"

**解决方法**:
1. 等待 1-2 分钟（冷启动可能需要时间）
2. 点击"停止"然后"启动"重试
3. 检查网络连接
4. 查看浏览器控制台错误

### 问题: 显示 CORS 错误

**解决方法**:
- Smithery 服务器应该已经配置了 CORS
- 如果仍然出现 CORS 错误，可能是浏览器扩展导致的
- 尝试在无痕模式下测试

### 问题: API Key 无效

**解决方法**:
1. 登录 Smithery 网站
2. 重新生成 API Key
3. 更新服务器 URL
4. 移除旧服务器，添加新服务器

## 相关资源

- [Smithery 官网](https://smithery.ai)
- [Smithery 文档](https://smithery.ai/docs)
- [MCP 协议规范](https://spec.modelcontextprotocol.io/)
- [本应用 MCP 测试指南](./mcp-sse-testing.md)
