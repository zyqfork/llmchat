# 自定义服务商模型路由修复

## 问题描述

用户配置了两个服务商都有相同的模型名称 `ep-20250214142029-ntnp7`：
- **OpenAI 厂商**：已取消勾选（禁用）
- **自定义服务商 "fly"**：已启用

但是当用户选择自定义服务商的模型进行聊天时，系统仍然调用 OpenAI 的配置，而不是自定义服务商的配置。

## 根本原因

### 1. 模型选择时 Provider 信息设置错误

在 `app/components/chat.tsx` 的 `updateSessionModel` 函数中：

**错误的代码**：
```typescript
session.mask.modelConfig.providerName = nextModel?.provider?.providerName as string;
```

这里使用的是 `provider.providerName`（用户设置的显示名称，如 "fly"），而不是 `provider.id`（真实的服务商ID，如 `custom_1234567890_abcdef123`）。

### 2. 会话中存储的 Provider 信息不正确

由于上述问题，会话中存储的 `providerName` 是 "fly" 而不是 `custom_1234567890_abcdef123`，导致 `unifiedChat` 函数无法正确识别自定义服务商。

### 3. 模型名称推断逻辑的问题

当会话中没有正确的 provider 信息时，`unifiedChat` 会调用 `getProviderIdFromModel` 函数根据模型名称推断 provider。对于 `ep-20250214142029-ntnp7` 这样的模型名，会被默认推断为 `openai`。

## 修复方案

### 1. 修复模型选择时的 Provider 信息设置

**文件**: `app/components/chat.tsx`

**修改前**：
```typescript
session.mask.modelConfig.providerName = nextModel?.provider?.providerName as string;
```

**修改后**：
```typescript
// 使用 provider.id 而不是 provider.providerName，确保自定义服务商正确路由
session.mask.modelConfig.providerName = nextModel?.provider?.id as string;
```

### 2. 改进模型名称推断逻辑

**文件**: `app/client/unified-api.ts`

添加了更详细的日志记录和警告，帮助诊断路由问题：

```typescript
// 对于无法识别的模型名称，记录警告
logger.warn(`[Unified API] Unknown model pattern: ${model}, defaulting to openai. This may cause routing issues for custom providers.`);
```

### 3. 确保自定义服务商模型的 Provider 信息正确

**文件**: `app/client/model-fetcher.ts`

在 `parseModelsResponse` 方法中，确保自定义服务商的模型包含正确的 provider 信息：

```typescript
provider: {
  id: providerId,           // 自定义服务商的完整ID
  providerName: providerName, // 用户设置的显示名称
  providerType: "custom",   // 标记为自定义类型
}
```

## 修复流程

### 修复前的错误流程：
1. 用户选择自定义服务商的模型 `ep-20250214142029-ntnp7`
2. `updateSessionModel` 设置 `providerName = "fly"`（错误）
3. `unifiedChat` 尝试查找名为 "fly" 的内置服务商（找不到）
4. 回退到 `getProviderIdFromModel`，推断为 `openai`
5. 使用 OpenAI 的配置发起请求（错误）

### 修复后的正确流程：
1. 用户选择自定义服务商的模型 `ep-20250214142029-ntnp7`
2. `updateSessionModel` 设置 `providerName = "custom_1234567890_abcdef123"`（正确）
3. `unifiedChat` 使用会话中的 provider 信息
4. `normalizeProviderName` 正确处理自定义服务商ID
5. 使用自定义服务商的配置发起请求（正确）

## 测试验证

### 场景测试：
- **OpenAI 服务商**：禁用，有模型 `ep-20250214142029-ntnp7`
- **自定义服务商 "fly"**：启用，有模型 `ep-20250214142029-ntnp7`
- **用户操作**：选择自定义服务商的模型进行聊天

### 预期结果：
- ✅ 会话中存储正确的 provider ID：`custom_1234567890_abcdef123`
- ✅ `unifiedChat` 使用自定义服务商的配置
- ✅ 请求发送到自定义服务商的端点
- ✅ 使用自定义服务商的 API Key 和设置

## 相关文件

- `app/components/chat.tsx` - 修复模型选择时的 provider 信息设置
- `app/client/unified-api.ts` - 改进模型名称推断逻辑和日志
- `app/client/model-fetcher.ts` - 确保自定义服务商模型的 provider 信息正确

## 向后兼容性

- ✅ 内置服务商的模型选择不受影响
- ✅ 现有会话的 provider 信息保持兼容
- ✅ 模型名称推断逻辑保持向后兼容
- ✅ 所有现有功能正常工作

## 调试信息

修复后，可以通过以下日志来验证路由是否正确：

1. **模型选择时**：检查会话中存储的 `providerName` 是否为完整的服务商ID
2. **发起聊天时**：查看 `[Unified API]` 日志，确认使用的 provider
3. **SDK 调用时**：查看 `[SDK Manager]` 日志，确认使用的配置

现在自定义服务商的模型应该能够正确路由，不会再错误地使用已禁用的 OpenAI 配置！