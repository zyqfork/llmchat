# 模型代理地址配置功能

## 问题描述

之前的实现中，模型配置有"启用代理"选项，但存在以下问题：
1. 没有代理地址输入框，无法配置代理服务器地址
2. 代理请求没有使用配置的模型hosts和token

## 解决方案

### 1. 添加代理地址配置字段

在 `app/store/access.ts` 中为每个服务商添加了 `xxxProxyUrl` 字段：
- `openaiProxyUrl`
- `azureProxyUrl`
- `googleProxyUrl`
- `anthropicProxyUrl`
- `bytedanceProxyUrl`
- `alibabaProxyUrl`
- `moonshotProxyUrl`
- `deepseekProxyUrl`
- `xaiProxyUrl`
- `siliconflowProxyUrl`
- `ollamaProxyUrl`

### 2. 添加UI配置界面

在 `app/components/settings.tsx` 中为每个服务商添加了代理地址输入框：
- 当启用代理时，显示代理地址输入框
- 输入框默认提示 `http://localhost:port`
- 参考云同步的代理配置实现

### 3. 更新本地化文件

在 `app/locales/cn.ts` 和 `app/locales/en.ts` 中为所有服务商添加了 `ProxyUrl` 配置：
```typescript
ProxyUrl: {
  Title: "代理地址",
  SubTitle: "代理服务器地址，默认使用 localhost",
}
```

### 4. 修改客户端平台代码

在所有平台文件中更新了代理URL的构建逻辑：
- `app/client/platforms/openai.ts`
- `app/client/platforms/anthropic.ts`
- `app/client/platforms/alibaba.ts`
- `app/client/platforms/bytedance.ts`
- `app/client/platforms/deepseek.ts`
- `app/client/platforms/moonshot.ts`
- `app/client/platforms/xai.ts`
- `app/client/platforms/siliconflow.ts`
- `app/client/platforms/ollama.ts`

修改逻辑：
```typescript
const configuredProxyUrl = accessStore.xxxProxyUrl;
const proxyUrl = configuredProxyUrl && configuredProxyUrl.length > 0
  ? configuredProxyUrl
  : window.location.origin;
```

### 5. 修改代理API

在 `app/api/proxy.ts` 中修改了代理请求的处理逻辑：
- 从URL参数中读取 `endpoint` 参数
- `endpoint` 参数包含完整的API URL（包括配置的hosts和path）
- 直接使用 `endpoint` 作为目标URL发起请求
- 这样确保使用了用户配置的模型hosts和token

### 6. 修改所有服务商API handler

在所有服务商的API handler中添加了endpoint参数检查：
- `app/api/openai.ts`
- `app/api/azure.ts`
- `app/api/google.ts`
- `app/api/anthropic.ts`
- `app/api/alibaba.ts`
- `app/api/bytedance.ts`
- `app/api/deepseek.ts`
- `app/api/moonshot.ts`
- `app/api/xai.ts`
- `app/api/siliconflow.ts`

当检测到请求中有`endpoint`参数时，自动转发到代理handler处理，确保使用配置的hosts和token。

## 使用方法

1. 进入设置页面
2. 选择对应的模型服务商
3. 勾选"启用代理"选项
4. 输入代理服务器地址（例如：`http://localhost:8080`）
5. 如果不输入代理地址，默认使用当前页面的origin（`window.location.origin`）
6. 保存设置

启用后，所有该服务商的API请求都会通过配置的代理服务器发起，代理服务器会使用用户配置的hosts和token发起实际的API请求。

## 工作原理

1. 客户端构建代理URL：`proxyUrl + /api/provider/ + path + ?endpoint=actualApiUrl`
2. 代理API接收请求，从URL参数中提取 `endpoint`
3. 代理API使用 `endpoint` 作为目标URL发起请求
4. `endpoint` 包含了用户配置的完整API地址（hosts + path），确保使用正确的配置

## MCP服务代理支持

### 1. 添加代理配置字段

在 `app/mcp/types.ts` 中的 `ServerConfig` 接口添加了代理配置：
```typescript
useProxy?: boolean; // 是否启用代理
proxyUrl?: string; // 代理服务器地址
```

### 2. 修改传输层

在 `app/mcp/transport-factory.ts` 中修改了SSE和StreamableHTTP传输：
- 检查 `useProxy` 配置
- 如果启用代理，构建代理URL：`proxyUrl/api/mcp-proxy?endpoint=actualUrl`
- 代理请求会转发到配置的MCP服务器

### 3. 创建MCP代理API

创建了 `app/api/mcp-proxy/route.ts`：
- 从URL参数中读取 `endpoint`
- 转发请求到实际的MCP服务器
- 处理响应压缩和headers

### 4. 添加UI配置界面

在 `app/components/mcp-market.tsx` 中添加了代理配置UI：
- 添加"启用代理"复选框
- 当启用代理时，显示"代理地址"输入框
- 在添加和编辑MCP服务器时都可以配置代理

### 5. 使用方法

**方法1：通过UI配置**
1. 进入MCP市场页面
2. 点击"手动添加服务器"或编辑现有服务器
3. 勾选"启用代理"
4. 输入代理地址（如 `http://localhost:8080`）
5. 保存配置

**方法2：直接编辑配置文件**
在 `app/mcp/mcp_config.json` 中配置MCP服务器时添加代理选项：
```json
{
  "mcpServers": {
    "my-mcp-server": {
      "type": "sse",
      "baseUrl": "https://my-mcp-server.com/sse",
      "useProxy": true,
      "proxyUrl": "http://localhost:8080",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

如果不配置 `proxyUrl`，默认使用 `window.location.origin`。

## 注意事项

- 代理地址应该是完整的URL，包括协议（http/https）
- 如果不配置代理地址，默认使用 `window.location.origin`
- 代理服务器需要支持转发请求到配置的endpoint
- MCP代理支持SSE和StreamableHTTP两种传输协议
