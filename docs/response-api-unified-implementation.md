# Response API 统一实现修复

## 问题描述

用户反馈在取消勾选"使用 Response API"后，聊天界面发起的请求仍然使用 Response API 格式：

**错误的请求：**
- URL: `https://chs.fly.dev/v1/chat/completions/responses`
- Body: `{"model":"deepseek-chat","input":[...]}`

**期望的请求：**
- URL: `https://chs.fly.dev/v1/chat/completions`  
- Body: `{"model":"deepseek-chat","messages":[...]}`

## 根本原因

AI SDK 5 默认使用 Response API。根据官方文档：

> Since AI SDK 5, the OpenAI responses API is called by default (unless you specify e.g. 'openai.chat')

这意味着：
- `openai('model')` → 使用 Response API
- `openai.chat('model')` → 使用 Chat API
- `openai.responses('model')` → 明确使用 Response API

## 解决方案

### 1. 修复 SDK Manager

在 `app/client/sdk-manager.ts` 的 `getModel()` 函数中：

```typescript
// 根据用户设置选择正确的 API 类型
if (apiType === "response") {
  // 用户启用了 Response API
  if (sdkInstance.responses) {
    return sdkInstance.responses(modelName);
  } else {
    // 使用默认方法（AI SDK 5 默认就是 Response API）
    return sdkInstance(modelName);
  }
} else {
  // 用户使用 Chat API，必须明确使用 .chat() 方法
  if (sdkInstance.chat) {
    return sdkInstance.chat(modelName);
  } else {
    // 如果没有 chat 方法，记录错误
    logger.error(`No .chat method available for ${providerId}`);
    return sdkInstance(modelName);
  }
}
```

### 2. 支持的厂商

以下厂商支持 API 类型选择（有 `apiType` storeKey）：

- **OpenAI** (`openaiApiType`)
- **Alibaba** (`alibabaApiType`) 
- **MoonshotAI** (`moonshotApiType`)
- **XAI** (`xaiApiType`)
- **DeepSeek** (`deepseekApiType`)
- **SiliconFlow** (`siliconflowApiType`)
- **ZAI** (`zaiApiType`)

其他厂商（Google、Anthropic、Azure、Ollama）默认使用各自的原生 API。

### 3. 调试信息

添加了详细的调试日志：

```typescript
logger.debug(`[SDK Manager] API type for model ${modelName}:`, {
  providerId,
  storeKey,
  rawValue: (accessStore as any)[storeKey],
  finalApiType: apiType,
});
```

## 测试验证

### 场景 1：用户禁用 Response API
- 设置：`openaiApiType = "chat"`
- 结果：使用 `sdkInstance.chat(modelName)`
- 请求：`POST /chat/completions` with `{messages: [...]}`

### 场景 2：用户启用 Response API  
- 设置：`openaiApiType = "response"`
- 结果：使用 `sdkInstance.responses(modelName)` 或 `sdkInstance(modelName)`
- 请求：`POST /chat/completions/responses` with `{input: [...]}`

## 影响范围

此修复影响所有通过 SDK Manager 的模型调用：
- 聊天对话
- 标题生成  
- 摘要生成
- 其他模型调用

## 向后兼容性

- ✅ 保持现有 API 接口不变
- ✅ 默认值为 `"chat"`，确保向后兼容
- ✅ 支持所有现有厂商配置
- ✅ 错误处理和降级机制

## 相关文件

- `app/client/sdk-manager.ts` - 主要修复
- `app/constant.ts` - 厂商配置定义
- `app/store/access.ts` - 用户设置存储
- `app/client/unified-api.ts` - 统一 API 调用
- `app/locales/cn.ts` & `app/locales/en.ts` - UI 文本更新