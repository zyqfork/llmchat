# Response API 问题分析

## 问题描述

用户配置了 OpenAI 厂商，没有启用 Response API，但系统仍然调用了 `/v1/responses` 接口：

```bash
curl 'https://chs.fly.dev/v1/responses' \
  -H 'authorization: Bearer sk-jS2nastcb1JS7kzd5C5hDrB89SOVGOxegphtca1AiNzUl2mK' \
  --data-raw '{"model":"ep-20250331103723-xkgdp","input":[...],"temperature":0.7,"stream":true}'
```

## 问题分析

### 1. 配置检查

**预期行为**：
- 用户没有勾选"使用 Response API"选项
- 系统应该使用 Chat API (`/chat/completions`)
- `openaiApiType` 应该为 `"chat"`（默认值）

**实际行为**：
- 系统发送请求到 `/v1/responses` 端点
- 使用了 Response API 的请求格式

### 2. 代码路径分析

#### 默认配置正确
在 `app/store/access.ts` 中，默认配置是正确的：
```typescript
if (storeKeys.apiType) {
  state[storeKeys.apiType] = "chat";  // 默认使用 chat API
}
```

#### 设置界面逻辑正确
在 `app/components/settings.tsx` 中，设置逻辑也是正确的：
```typescript
checked={(accessStore as any)[storeKeys.apiType!] === "response"}
onChange={(e) => {
  accessStore.update(
    (access) =>
      ((access as any)[storeKeys.apiType!] = e.currentTarget.checked
        ? "response"
        : "chat"),
  );
}}
```

### 3. 可能的问题源头

#### A. 外部代理服务
从请求 URL `https://chs.fly.dev/v1/responses` 来看：
- 这是一个外部域名，不是本地 API
- 可能是用户配置的自定义 Base URL
- 该代理服务可能强制使用 Response API

#### B. SDK 工具中的路径判断
在 `app/api/sdk-utils.ts` 中，有基于路径的 API 类型判断：
```typescript
if (
  config.responsePaths &&
  config.responsePaths.some(
    (responsePath) =>
      path === responsePath || path.endsWith(responsePath),
  )
) {
  // 使用 Response API
  return await handleResponsesRequest(config);
}
```

#### C. 请求路由问题
可能的问题：
1. 某个地方硬编码了 `/responses` 路径
2. 代理服务自动重写了请求路径
3. 客户端发送了错误的端点

## Response API 是否使用 SDK？

### 当前实现

**Response API 实现**：
- **不使用 AI SDK**：直接使用 `fetch` 发送 HTTP 请求
- **位置**：`app/api/sdk-utils.ts` 中的 `handleOpenAIResponsesAPI` 函数
- **原因**：Response API 使用特殊的请求格式，与标准 Chat API 不同

```typescript
async function handleOpenAIResponsesAPI(config: OpenAICompatibleConfig) {
  const url = `${config.baseURL}/responses`;
  
  // 直接使用 fetch，不使用 AI SDK
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
}
```

**Chat API 实现**：
- **使用 AI SDK**：通过 `streamTextWithSDK` 和 `generateTextWithSDK`
- **位置**：`app/client/sdk-manager.ts`
- **优势**：类型安全、错误处理、统一接口

## 解决方案

### 1. 立即修复（推荐）

**强制使用 Chat API**：
```typescript
// 在 unified-api.ts 中强制使用 Chat API
// 即使检测到 Response API 配置，也使用 Chat API 以确保兼容性
```

### 2. 根本修复

**检查配置源头**：
1. 确认用户的 OpenAI Base URL 配置
2. 检查是否有代理服务强制重写路径
3. 验证 `openaiApiType` 的实际值

### 3. 调试步骤

1. **检查存储值**：
   ```javascript
   console.log(useAccessStore.getState().openaiApiType);
   ```

2. **检查请求路径**：
   - 在浏览器开发者工具中查看实际发送的请求
   - 确认是否是客户端发送了错误的端点

3. **检查代理配置**：
   - 确认 Base URL 设置
   - 检查是否启用了代理模式

## 建议

### 短期解决方案
- 强制所有请求使用 Chat API
- 添加详细的调试日志
- 在 Response API 被调用时发出警告

### 长期解决方案
- 统一所有 API 调用使用 AI SDK
- 移除直接的 HTTP 请求实现
- 简化 API 类型选择逻辑

## 总结

问题的根本原因可能是：
1. **外部代理服务**强制使用 Response API
2. **路径判断逻辑**错误地识别了 API 类型
3. **配置覆盖**导致默认设置被改变

建议优先检查用户的 Base URL 配置和代理设置，然后根据实际情况进行针对性修复。