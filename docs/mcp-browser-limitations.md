# MCP 浏览器环境限制说明

## 问题背景

在浏览器环境中使用 fetch API 验证 MCP 服务器时，会遇到一些限制和问题。

### 主要问题

1. **Accept Header 限制**
   - 浏览器可能会修改或忽略某些 Accept headers
   - 导致服务器返回 406 (Not Acceptable) 错误
   - 特别是对于需要 `text/event-stream` 的 SSE 服务器

2. **CORS 预检请求**
   - 浏览器会发送 OPTIONS 预检请求
   - 某些服务器可能不支持 OPTIONS 方法
   - 导致 CORS 错误

3. **Header 顺序和格式**
   - 浏览器可能会重新排序 headers
   - 某些服务器对 header 格式敏感

## 具体案例：Smithery 服务器

### 问题描述

Smithery MCP 服务器 URL:
```
https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=...&profile=...
```

使用 curl 测试成功：
```bash
curl -X POST \
  'https://server.smithery.ai/@Aas-ee/open-websearch/mcp?...' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",...}'
```

响应：
```
event: message
data: {"result":{...},"jsonrpc":"2.0","id":1}
```

但在浏览器中使用 fetch API 时，返回 406 错误。

### 原因分析

1. **浏览器修改 Accept Header**
   - 浏览器可能会修改 `Accept: application/json, text/event-stream`
   - 或者完全忽略自定义的 Accept header
   - 导致服务器拒绝请求

2. **CORS 预检**
   - 浏览器发送 OPTIONS 请求
   - Smithery 服务器可能对 OPTIONS 请求的处理不同

3. **EventSource API 限制**
   - 浏览器的 EventSource API 只支持 GET 请求
   - 但 Smithery 需要 POST 请求

## 解决方案

### 方案 1: 跳过 fetch 验证（当前采用）

**优点**:
- 避免浏览器 fetch API 的所有限制
- 简单可靠
- 实际连接由 MCP SDK 处理，更加可靠

**缺点**:
- 无法在添加前验证服务器是否可用
- 用户需要等到实际连接时才知道是否成功

**实现**:
```typescript
export async function validateMcpServer(config: ServerConfig): Promise<void> {
  // 只验证 URL 格式
  if (!config.baseUrl) {
    throw new Error("Base URL is required");
  }

  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error("Invalid Base URL format");
  }

  // 跳过 fetch 验证，由 SDK 在实际连接时验证
  logger.info("URL format validated, actual connection will be tested during SDK initialization");
}
```

### 方案 2: 使用代理服务器

**优点**:
- 可以在添加前验证服务器
- 避免 CORS 问题
- 完全控制 headers

**缺点**:
- 需要额外的后端服务
- 增加复杂度
- 可能有安全问题

### 方案 3: 使用 Service Worker

**优点**:
- 可以拦截和修改请求
- 避免某些浏览器限制

**缺点**:
- 需要用户授权
- 实现复杂
- 兼容性问题

## 当前实现

我们采用**方案 1**：跳过 fetch 验证。

### 验证流程

1. **添加服务器时**:
   - 只验证 URL 格式
   - 不进行实际的网络请求
   - 立即添加到配置

2. **实际连接时**:
   - MCP SDK 进行完整的初始化
   - 发送 `initialize` 请求
   - 建立实际连接
   - 如果失败，显示错误状态

### 用户体验

1. **添加服务器**:
   - 填写服务器信息
   - 点击"添加"
   - 立即成功（只要 URL 格式正确）

2. **查看状态**:
   - 服务器显示"Initializing"状态
   - SDK 尝试连接
   - 成功：显示"Running"
   - 失败：显示"Error"及错误信息

3. **处理错误**:
   - 点击服务器查看详细错误
   - 根据错误信息调整配置
   - 点击"启动"重试

## 浏览器 Fetch API 限制详解

### 1. Accept Header

**问题**:
```javascript
fetch(url, {
  headers: {
    'Accept': 'text/event-stream, application/json'
  }
})
```

浏览器可能会：
- 忽略自定义 Accept header
- 使用默认的 `*/*`
- 或者修改为 `application/json`

**影响**:
- 服务器根据 Accept header 返回不同格式
- 如果 Accept 不匹配，返回 406

### 2. CORS 预检

**问题**:
```javascript
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  }
})
```

浏览器会先发送：
```
OPTIONS /mcp HTTP/1.1
Access-Control-Request-Method: POST
Access-Control-Request-Headers: accept, content-type
```

**影响**:
- 如果服务器不支持 OPTIONS，请求失败
- 如果 CORS 配置不正确，请求被阻止

### 3. EventSource 限制

**问题**:
```javascript
const eventSource = new EventSource(url);
```

限制：
- 只支持 GET 请求
- 无法自定义 headers（除了 Cookie）
- 无法发送 body

**影响**:
- 无法用于需要 POST 的 SSE 服务器
- 无法发送认证 token（除非通过 URL 参数）

## MCP SDK 的优势

MCP SDK 使用更底层的 API，可以：

1. **完全控制 Headers**
   - 设置任意 Accept header
   - 不受浏览器限制

2. **处理 SSE 流**
   - 支持 POST + SSE 响应
   - 正确解析 SSE 格式

3. **连接管理**
   - 自动重连
   - 心跳检测
   - 错误处理

4. **协议实现**
   - 完整的 JSON-RPC 2.0 支持
   - MCP 协议握手
   - 能力协商

## 最佳实践

### 对于用户

1. **选择正确的传输类型**
   - Smithery 服务器：选择 SSE
   - 标准 MCP 服务器：根据文档选择

2. **填写完整 URL**
   - 包含所有必要的参数（api_key, profile 等）
   - 确保 URL 格式正确

3. **耐心等待初始化**
   - 添加后等待几秒
   - 查看服务器状态
   - 如果失败，查看错误信息

4. **检查错误信息**
   - 打开浏览器控制台
   - 查看详细的错误日志
   - 根据错误调整配置

### 对于开发者

1. **不要依赖 fetch 验证**
   - 浏览器环境限制太多
   - 使用 SDK 进行实际验证

2. **提供清晰的错误信息**
   - 记录详细的日志
   - 显示有用的错误提示
   - 提供解决建议

3. **支持跳过验证**
   - 允许用户跳过验证直接添加
   - 在实际连接时进行验证

4. **文档化限制**
   - 说明浏览器环境的限制
   - 提供解决方案
   - 给出示例配置

## 相关资源

- [Fetch API 规范](https://fetch.spec.whatwg.org/)
- [CORS 规范](https://www.w3.org/TR/cors/)
- [Server-Sent Events 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MCP SDK 文档](https://github.com/modelcontextprotocol/sdk)

## 总结

浏览器环境中的 fetch API 有诸多限制，特别是对于 SSE 和自定义 headers。我们通过跳过 fetch 验证，直接使用 MCP SDK 进行连接，可以避免这些限制，提供更可靠的用户体验。

虽然这意味着用户无法在添加前验证服务器，但实际连接时的验证更加准确和可靠。
