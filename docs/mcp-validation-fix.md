# MCP 验证逻辑修复说明

## 问题描述

用户在添加 Smithery MCP 服务器时遇到 406 (Not Acceptable) 错误。

### 原始问题

Smithery 服务器 URL:
```
https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=244f14f9-df04-4990-b2b3-86fa3d88995f&profile=average-canid-vfO9m9
```

使用 curl 测试成功：
```bash
curl -X POST \
  'https://server.smithery.ai/@Aas-ee/open-websearch/mcp?...' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",...}'
```

响应（SSE 格式）：
```
event: message
data: {"result":{"protocolVersion":"2024-11-05",...},"jsonrpc":"2.0","id":1}
```

但在应用中添加时报错 406。

## 根本原因

1. **Accept 头不正确**: 原验证逻辑只发送 `Accept: application/json`，但 Smithery 服务器返回的是 SSE 格式，需要 `Accept: text/event-stream`

2. **传输类型选择错误**: Smithery 服务器实际上是 SSE 类型，但用户可能选择了 Streamable HTTP

3. **验证方法不当**: 
   - 对于 SSE，原来使用 GET 请求
   - 但 Smithery 需要 POST 请求 + JSON-RPC 消息

## 解决方案

### 1. 改进 Accept 头

**修改前**:
```typescript
// SSE
Accept: "text/event-stream"

// Streamable HTTP
Accept: "application/json"
```

**修改后**:
```typescript
// SSE
Accept: "text/event-stream, application/json"

// Streamable HTTP
Accept: "application/json, text/event-stream"
```

这样可以支持两种响应格式，提高兼容性。

### 2. 改进 SSE 验证方法

**修改前**:
```typescript
// 使用 GET 请求
const response = await fetch(config.baseUrl, {
  method: "GET",
  headers: {
    Accept: "text/event-stream",
  },
});
```

**修改后**:
```typescript
// 使用 POST 请求 + initialize 消息
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {
      roots: { listChanged: true }
    },
    clientInfo: {
      name: "nextchat-mcp-client",
      version: "1.0.0"
    }
  }
};

const response = await fetch(config.baseUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "text/event-stream, application/json",
  },
  body: JSON.stringify(initRequest),
});
```

### 3. 移除不必要的 GET 回退

**修改前**:
```typescript
if (!response.ok) {
  // 尝试 GET 请求作为回退
  const getResponse = await fetch(...);
}
```

**修改后**:
```typescript
if (!response.ok) {
  throw new Error(`服务器响应错误: ${response.status}`);
}
```

简化逻辑，直接报错，让用户选择跳过验证。

### 4. 改进 Content-Type 检查

**修改前**:
```typescript
// 只检查一种类型
if (!contentType?.includes("text/event-stream")) {
  logger.warn("Unexpected content-type");
}
```

**修改后**:
```typescript
// 支持两种类型
if (
  contentType &&
  !contentType.includes("text/event-stream") &&
  !contentType.includes("application/json")
) {
  logger.warn("Unexpected content-type");
}
```

## 使用指南

### 添加 Smithery 服务器的正确方法

1. **选择正确的传输类型**: `SSE (Server-Sent Events)`
2. **填写完整 URL**: 包含 api_key 和 profile 参数
3. **保持默认 Headers**: 应用会自动设置正确的 Accept 头
4. **设置合理超时**: 建议 60 秒

### 为什么 Smithery 是 SSE 而不是 Streamable HTTP？

虽然 Smithery 使用 POST 请求，但它返回的是 SSE 格式的响应流：

```
event: message
data: {...}
```

这是典型的 SSE 格式，而不是纯 JSON 响应。

### SSE vs Streamable HTTP 的区别

| 特性 | SSE | Streamable HTTP |
|------|-----|-----------------|
| 请求方法 | POST (带 JSON-RPC) | POST (带 JSON-RPC) |
| 响应格式 | `event: ...\ndata: ...` | 纯 JSON |
| Content-Type | `text/event-stream` | `application/json` |
| 连接方式 | 长连接，持续接收事件 | 请求-响应 |
| 适用场景 | 服务器推送更新 | 标准 RPC 调用 |

## 测试验证

### 测试 Smithery 服务器

```bash
# 正确的测试命令
curl -X POST \
  'https://server.smithery.ai/@Aas-ee/open-websearch/mcp?api_key=YOUR_KEY&profile=YOUR_PROFILE' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {
        "roots": {"listChanged": true}
      },
      "clientInfo": {
        "name": "test",
        "version": "1.0.0"
      }
    }
  }'
```

### 预期结果

**成功响应** (200 OK):
```
event: message
data: {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"web-search","version":"1.1.5"}},"jsonrpc":"2.0","id":1}
```

**错误响应** (406 Not Acceptable):
- 原因：Accept 头不包含 `text/event-stream`
- 解决：添加正确的 Accept 头

## 相关文件

- `app/mcp/actions.client.ts` - 验证逻辑实现
- `docs/mcp-smithery-guide.md` - Smithery 使用指南
- `docs/mcp-sse-testing.md` - SSE 测试指南

## 总结

通过以下改进，现在可以正确验证和添加 Smithery 服务器：

1. ✅ 使用 POST 请求进行 SSE 验证
2. ✅ 设置正确的 Accept 头（支持两种格式）
3. ✅ 发送完整的 initialize JSON-RPC 消息
4. ✅ 简化验证逻辑，移除不必要的回退
5. ✅ 提供跳过验证选项（针对特殊服务器）

用户现在可以成功添加 Smithery 和其他类似的 SSE MCP 服务器了！
