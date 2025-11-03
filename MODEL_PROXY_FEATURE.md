# 模型服务代理功能

## 功能概述

为所有模型服务商添加了代理选项，允许在 standalone 模式下通过服务端代理发起请求，类似于云同步功能的代理实现。

## 实现内容

### 1. 数据存储 (app/store/access.ts)

为每个服务商添加了 `useProxy` 配置项：

- `openaiUseProxy`: OpenAI 代理开关
- `azureUseProxy`: Azure 代理开关
- `googleUseProxy`: Google 代理开关
- `anthropicUseProxy`: Anthropic 代理开关
- `bytedanceUseProxy`: ByteDance 代理开关
- `alibabaUseProxy`: Alibaba 代理开关
- `moonshotUseProxy`: Moonshot 代理开关
- `deepseekUseProxy`: DeepSeek 代理开关
- `xaiUseProxy`: XAI 代理开关
- `siliconflowUseProxy`: SiliconFlow 代理开关
- `ollamaUseProxy`: Ollama 代理开关

### 2. 用户界面 (app/components/settings.tsx)

在每个服务商的配置区域添加了"启用代理"复选框，用户可以勾选启用代理功能。

### 3. 国际化 (app/locales/cn.ts)

为每个服务商添加了代理选项的中文文本：

```typescript
UseProxy: {
  Title: "启用代理",
  SubTitle: "在 standalone 模式下通过服务端代理发起请求",
}
```

### 4. API 客户端 (app/client/platforms/*.ts)

修改了所有平台的 `path()` 方法，当启用代理时，会构建代理 URL：

```typescript
if (accessStore.xxxUseProxy) {
  const proxyUrl = window.location.origin;
  const endpoint = [baseUrl, path].join("/");
  const proxyPath = "/api/proxy/xxx/";
  
  try {
    const u = new URL(proxyUrl + proxyPath + path);
    u.searchParams.append("endpoint", endpoint);
    return u.toString();
  } catch (e) {
    console.error("[XXX] Failed to build proxy URL:", e);
    return [baseUrl, path].join("/");
  }
}
```

## 代理 URL 格式

代理请求的 URL 格式为：

```
http://localhost:3000/api/proxy/{provider}/{path}?endpoint={original_endpoint}
```

例如：
- OpenAI: `http://localhost:3000/api/proxy/openai/v1/chat/completions?endpoint=https://api.openai.com/v1/chat/completions`
- Anthropic: `http://localhost:3000/api/proxy/anthropic/v1/messages?endpoint=https://api.anthropic.com/v1/messages`

## 使用方法

1. 进入设置页面
2. 选择对应的模型服务商
3. 勾选"启用代理"选项
4. 保存设置

启用后，所有该服务商的 API 请求都会通过服务端代理发起，类似于云同步的代理机制。

## 注意事项

- 代理功能需要服务端支持对应的代理路由 (`/api/proxy/{provider}/`)
- 如果代理 URL 构建失败，会自动回退到直接请求
- 代理功能主要用于 standalone 模式，避免跨域问题

## 后续工作

需要在服务端实现对应的代理路由处理器，参考云同步的 `/api/upstash/` 实现方式。
