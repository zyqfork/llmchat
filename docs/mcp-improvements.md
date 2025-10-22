# MCP 服务改进说明

## 改进概述

本次改进完善了 MCP (Model Context Protocol) 服务的相关逻辑，主要增强了对远程 MCP 服务器的支持，特别是添加了对 **SSE (Server-Sent Events)** 和 **Streamable HTTP** 两种传输协议的完整支持。

## 主要改进

### 1. 类型系统增强

**文件**: `app/mcp/types.ts`

- 添加了 `StreamableHTTPTransportConfig` 类型定义
- 新增 `TRANSPORT_TYPE_LABELS` 和 `TRANSPORT_TYPE_DESCRIPTIONS` 常量，用于 UI 显示
- 完善了 `ServerConfig` 接口的注释说明
- 统一了两种传输协议的配置结构

**改进内容**:
```typescript
// 传输类型显示名称映射
export const TRANSPORT_TYPE_LABELS: Record<MCPTransportType, string> = {
  sse: "SSE (Server-Sent Events)",
  streamableHttp: "Streamable HTTP",
};

// 传输类型描述
export const TRANSPORT_TYPE_DESCRIPTIONS: Record<MCPTransportType, string> = {
  sse: "基于 Server-Sent Events 的单向流式传输，适合服务器主动推送数据",
  streamableHttp: "基于 HTTP 的双向流式传输，支持请求-响应模式",
};
```

### 2. 手动添加服务器界面改进

**文件**: `app/components/mcp-market.tsx`

- 添加了传输类型选择下拉框
- 根据选择的传输类型动态显示相应的说明文字
- 根据传输类型自动设置合适的默认 headers
- 改进了 URL 输入框的占位符文本

**改进内容**:
- 新增 `manualTransportType` 状态，默认为 `streamableHttp`
- 添加传输类型选择器，支持在 SSE 和 Streamable HTTP 之间切换
- 根据传输类型动态调整 Base URL 的提示信息
- 自动为不同传输类型设置合适的默认 headers

### 3. 验证逻辑优化

**文件**: `app/mcp/actions.client.ts`

- 增强了 URL 格式验证
- 针对不同传输类型使用不同的验证策略
- 改进了错误消息，提供更清晰的问题诊断
- 添加了 CORS 错误的特殊处理

**改进内容**:
```typescript
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

// 针对不同传输类型的验证
if (config.type === "sse") {
  // 检查 Content-Type 是否为 text/event-stream
}

if (config.type === "streamableHttp") {
  // 检查 Content-Type 是否为 application/json
}
```

### 4. 文档完善

创建了三个详细的文档文件：

#### `docs/mcp-sse-testing.md`
- 传输类型对比说明
- 使用 curl 测试 SSE 和 Streamable HTTP 端点的方法
- 在应用中添加服务器的步骤
- 验证逻辑说明
- 常见问题和调试技巧
- 示例配置

#### `docs/mcp-server-development.md`
- MCP 服务器开发完整指南
- SSE 和 Streamable HTTP 服务器的实现示例（Node.js 和 Python）
- 必须实现的 MCP 方法说明
- 部署建议（HTTPS、CORS、认证、错误处理、日志）
- 测试方法
- 参考资源

#### `docs/mcp-improvements.md`（本文件）
- 改进概述和详细说明

## 使用方法

### 添加 SSE 服务器

1. 打开 MCP Market 页面
2. 点击"添加服务器"按钮
3. 填写以下信息：
   - Server ID: `my-sse-server`
   - 名称: `My SSE Server`
   - 传输类型: 选择 `SSE (Server-Sent Events)`
   - Base URL: `https://example.com/mcp/sse`
   - 请求头（可选）: 添加认证 token 等
4. 点击"添加"按钮

### 添加 Streamable HTTP 服务器

1. 打开 MCP Market 页面
2. 点击"添加服务器"按钮
3. 填写以下信息：
   - Server ID: `my-http-server`
   - 名称: `My HTTP Server`
   - 传输类型: 选择 `Streamable HTTP`（默认）
   - Base URL: `https://example.com/mcp`
   - 请求头（可选）: 添加认证 token 等
4. 点击"添加"按钮

## 技术细节

### SSE 传输

- **Content-Type**: `text/event-stream`
- **连接方式**: 长连接，持续接收事件流
- **默认 Headers**:
  ```json
  {
    "Accept": "text/event-stream",
    "Cache-Control": "no-cache"
  }
  ```

### Streamable HTTP 传输

- **Content-Type**: `application/json`
- **连接方式**: 标准 HTTP 请求-响应
- **默认 Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
  ```

## 兼容性

- 完全向后兼容现有的 MCP 服务器配置
- 现有的内置服务器（Context7、EdgeOne Pages MCP）继续正常工作
- 手动添加的服务器会自动标记 `addedAt` 时间戳，用于排序显示

## 测试建议

1. **使用 curl 测试服务器端点**
   ```bash
   # SSE
   curl -N -H "Accept: text/event-stream" https://example.com/mcp/sse
   
   # Streamable HTTP
   curl -H "Accept: application/json" https://example.com/mcp
   ```

2. **在应用中测试**
   - 添加服务器时会自动进行连接验证
   - 验证成功后可以查看服务器提供的工具列表
   - 可以启动/停止/移除服务器

3. **查看日志**
   - 打开浏览器开发者工具
   - 查看 Console 标签中的 MCP 相关日志
   - 查看 Network 标签中的请求详情

## 未来改进方向

1. **增强的错误处理**
   - 更详细的错误分类
   - 自动重连机制
   - 连接状态监控

2. **性能优化**
   - 连接池管理
   - 请求缓存
   - 批量请求支持

3. **UI 改进**
   - 服务器配置导入/导出
   - 批量管理服务器
   - 更丰富的服务器统计信息

4. **安全增强**
   - 证书验证
   - 更多认证方式支持
   - 请求签名

## 相关文件

- `app/mcp/types.ts` - 类型定义
- `app/mcp/transport-factory.ts` - 传输层工厂
- `app/mcp/actions.client.ts` - 客户端操作
- `app/components/mcp-market.tsx` - UI 组件
- `docs/mcp-sse-testing.md` - 测试指南
- `docs/mcp-server-development.md` - 开发指南

## 总结

本次改进大幅提升了 MCP 服务的灵活性和易用性，使得用户可以轻松添加和管理不同类型的远程 MCP 服务器。通过完善的类型系统、直观的 UI 界面和详细的文档，降低了使用门槛，提高了开发效率。
