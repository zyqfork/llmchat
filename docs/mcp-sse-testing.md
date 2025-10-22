# MCP 远程服务器测试指南

本应用支持两种远程 MCP 传输协议：**SSE (Server-Sent Events)** 和 **Streamable HTTP**。

## 传输类型对比

### SSE (Server-Sent Events)

- **特点**: 单向流式传输，服务器主动推送数据
- **适用场景**: 需要服务器实时推送更新的场景
- **Content-Type**: `text/event-stream`
- **连接方式**: 长连接，持续接收事件流

### Streamable HTTP

- **特点**: 双向流式传输，支持请求-响应模式
- **适用场景**: 标准的 MCP 服务，支持完整的 JSON-RPC 协议
- **Content-Type**: `application/json`
- **连接方式**: 标准 HTTP 请求-响应

## 使用 curl 测试

### 测试 SSE 端点

```bash
# 基本 SSE 连接测试
curl -N -H "Accept: text/event-stream" http://localhost:3000/sse

# 带认证的 SSE 连接
curl -N -H "Accept: text/event-stream" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/sse
```

**参数说明**:
- `-N` 或 `--no-buffer`: 禁用缓冲，实时显示 SSE 事件
- `-H "Accept: text/event-stream"`: 设置正确的 Accept 头

**预期响应**:
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"jsonrpc":"2.0","method":"..."}

data: {"jsonrpc":"2.0","method":"..."}
```

### 测试 Streamable HTTP 端点

```bash
# 基本 HTTP 连接测试
curl -X GET \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     http://localhost:3000/mcp

# 发送 MCP 请求
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
     http://localhost:3000/mcp
```

**预期响应**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

## 在应用中添加服务器

### 方法 1: 使用内置服务器

应用内置了一些常用的 MCP 服务器，可以直接点击"添加"按钮使用。

### 方法 2: 手动添加服务器

1. 点击"添加服务器"按钮
2. 填写以下信息：
   - **Server ID**: 唯一标识符（必填）
   - **名称**: 显示名称（可选）
   - **描述**: 简要说明（可选）
   - **传输类型**: 选择 SSE 或 Streamable HTTP
   - **Base URL**: 服务器地址（必填）
   - **请求头**: 自定义 HTTP 头（可选）
   - **超时时间**: 连接超时时间，单位秒（可选，默认 30 秒）

3. 点击"添加"按钮，系统会自动验证连接

## 验证逻辑

**重要更新**: 由于浏览器环境中 fetch API 的限制（特别是 Accept header 可能被修改或忽略），我们已经简化了验证逻辑。

### 当前验证方式

1. **URL 格式验证**: 检查 URL 是否有效
2. **跳过网络请求**: 不再使用 fetch 进行实际的网络验证
3. **SDK 验证**: 实际的连接验证在 MCP SDK 初始化时进行

### 为什么改变验证方式？

浏览器环境中的 fetch API 有以下限制：

1. **Accept Header 限制**
   - 浏览器可能会修改或忽略自定义的 Accept headers
   - 导致服务器返回 406 (Not Acceptable) 错误
   - 特别是对于需要 `text/event-stream` 的 SSE 服务器

2. **CORS 预检请求**
   - 浏览器会发送 OPTIONS 预检请求
   - 某些服务器可能不支持或配置不正确

3. **EventSource API 限制**
   - 只支持 GET 请求
   - 无法自定义 headers
   - 无法用于需要 POST 的 SSE 服务器

详细说明请参考：[MCP 浏览器环境限制说明](./mcp-browser-limitations.md)

### 用户体验

1. **添加服务器**:
   - 填写服务器信息
   - 点击"添加"
   - 立即成功（只要 URL 格式正确）

2. **查看状态**:
   - 服务器显示"Initializing"状态
   - MCP SDK 尝试建立连接
   - 成功：显示"Running"（绿色）
   - 失败：显示"Error"（红色）及错误信息

3. **处理错误**:
   - 点击服务器查看详细错误
   - 打开浏览器控制台查看日志
   - 根据错误信息调整配置
   - 点击"启动"重试连接

## 常见问题

### 1. 连接超时
- 检查服务器地址是否正确
- 确认服务器正在运行
- 检查防火墙设置
- 尝试增加超时时间

### 2. CORS 错误
- 确保服务器配置了正确的 CORS 头
- 检查 `Access-Control-Allow-Origin` 是否包含你的域名
- 对于开发环境，可以配置服务器允许所有来源

### 3. 认证失败 (401/403)
- 检查认证 token 是否正确
- 确认 Authorization header 格式正确
- 验证 token 是否过期

### 4. Content-Type 不匹配
- **SSE**: 服务器应返回 `Content-Type: text/event-stream`
- **Streamable HTTP**: 服务器应返回 `Content-Type: application/json`
- 如果返回其他类型，可能不是有效的 MCP 端点

### 5. 连接成功但无法获取工具列表
- 检查服务器是否正确实现了 MCP 协议
- 查看浏览器控制台的错误信息
- 确认服务器支持 `tools/list` 方法

### 6. 验证失败但服务器实际可用
- 某些服务器（如 Smithery）需要特殊的会话管理或初始化流程
- 验证失败时，可以选择跳过验证直接添加
- 服务器会在实际连接时进行完整的初始化
- 如果添加后服务器状态显示错误，检查浏览器控制台的详细错误信息

## 调试技巧

1. **使用浏览器开发者工具**
   - 打开 Network 标签查看请求详情
   - 检查请求头和响应头
   - 查看响应内容

2. **查看应用日志**
   - 打开浏览器控制台
   - 查找 MCP 相关的日志信息
   - 注意错误和警告信息

3. **测试服务器端点**
   - 使用 curl 或 Postman 独立测试
   - 验证服务器是否正常响应
   - 检查返回的数据格式

## 示例配置

### SSE 服务器示例

```json
{
  "type": "sse",
  "baseUrl": "https://example.com/mcp/sse",
  "headers": {
    "Accept": "text/event-stream",
    "Authorization": "Bearer YOUR_TOKEN"
  },
  "timeout": 30
}
```

### Streamable HTTP 服务器示例

```json
{
  "type": "streamableHttp",
  "baseUrl": "https://example.com/mcp",
  "headers": {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  },
  "timeout": 30
}
```
