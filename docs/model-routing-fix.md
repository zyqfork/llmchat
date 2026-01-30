# 模型路由问题修复

## 问题描述

用户配置了 OpenAI 模型，没有勾选 response api，通过 `/models` 接口获取了一些外部模型（如 `deepseek-chat`）。当在聊天界面使用这些模型时，系统返回错误：

```json
{
  "error": true,
  "message": "API key not provided for deepseek"
}
```

## 问题根因

系统的模型路由逻辑存在缺陷：

1. **模型获取正确**：通过 OpenAI 的 `/models` 接口获取到 `deepseek-chat` 模型，并正确标记为来自 `openai` 厂商
2. **路由逻辑错误**：在 `app/client/unified-api.ts` 的 `getProviderIdFromModel` 函数中，系统根据模型名称 `deepseek-chat` 推断厂商为 `deepseek`，而不是使用实际配置的 `openai` 厂商
3. **API Key 查找失败**：系统尝试查找 `deepseek` 的 API Key，但用户只配置了 `openai` 的 API Key

## 修复方案

修改 `unifiedChat` 函数的厂商选择逻辑：

### 修复前
```typescript
// 直接根据模型名称推断厂商
const providerId = getProviderIdFromModel(model);
```

### 修复后
```typescript
// 优先使用会话配置中的 providerName，如果没有则根据模型名称推断
let providerId: string;

if (typeof window !== "undefined") {
  try {
    const { useChatStore } = require("../store");
    const chatStore = useChatStore.getState();
    const currentSession = chatStore.currentSession();
    const sessionProviderName = currentSession?.mask?.modelConfig?.providerName;
    
    if (sessionProviderName) {
      // 标准化 providerName
      const { normalizeProviderName } = require("./api");
      providerId = normalizeProviderName(sessionProviderName);
      logger.debug(`[Unified API] Using session provider: ${providerId} for model: ${model}`);
    } else {
      // 如果没有会话配置，则根据模型名称推断
      providerId = getProviderIdFromModel(model);
      logger.debug(`[Unified API] Inferred provider: ${providerId} from model: ${model}`);
    }
  } catch (error) {
    logger.warn(`[Unified API] Could not get session provider, falling back to model inference:`, error);
    providerId = getProviderIdFromModel(model);
  }
} else {
  // 服务器端环境，根据模型名称推断
  providerId = getProviderIdFromModel(model);
  logger.debug(`[Unified API] Server-side provider inference: ${providerId} for model: ${model}`);
}
```

## 修复逻辑

1. **优先级顺序**：
   - 首先尝试从当前会话的 `modelConfig.providerName` 获取厂商配置
   - 如果获取失败，则回退到根据模型名称推断厂商

2. **环境兼容**：
   - 客户端环境：可以访问 `useChatStore` 获取会话配置
   - 服务器端环境：只能根据模型名称推断

3. **错误处理**：
   - 如果访问 store 失败，回退到原有的推断逻辑
   - 添加详细的调试日志，便于问题排查

## 修复效果

修复后的行为：

1. **正确路由**：当用户选择通过 OpenAI 获取的 `deepseek-chat` 模型时，系统使用 `openai` 厂商配置
2. **API Key 正确**：使用用户配置的 OpenAI API Key 发起请求
3. **请求成功**：请求发送到 OpenAI 的端点，使用正确的认证信息

## 测试验证

- ✅ 构建测试通过，无 TypeScript 错误
- ✅ 向后兼容，不影响现有功能
- ✅ 支持服务器端渲染环境
- ✅ 包含详细的调试日志

## 相关文件

- `app/client/unified-api.ts` - 主要修复文件
- `app/client/model-fetcher.ts` - 模型获取逻辑（无需修改）
- `app/store/config.ts` - 模型配置结构（无需修改）

## 总结

这个修复解决了模型路由的核心问题：**系统现在会优先使用用户实际配置的厂商，而不是根据模型名称盲目推断厂商**。这确保了通过聚合服务（如 OpenAI、SiliconFlow 等）获取的第三方模型能够正确路由到配置的厂商端点。