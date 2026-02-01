# 自定义服务商综合修复

## 问题总结

用户反馈了多个关于自定义服务商的问题：

1. **模型路由问题**：配置的自定义模型请求的还是 OpenAI 配置的网站
2. **显示名称问题**：聊天界面显示 `@custom***` 而不是 `@fly`
3. **配置不完整**：自定义厂商缺少完整的配置选项
4. **列表刷新问题**：添加模型后不应该刷新模型列表

## 修复方案

### 1. 修复模型路由问题

**问题根源**：`normalizeProviderName` 函数将自定义服务商映射回了内置服务商

**文件**：`app/client/api.ts`

**修复前**：
```typescript
// 根据自定义服务商类型返回对应的ServiceProvider
const typeToProviderMap: Record<CustomProviderType, string> = {
  openai: ServiceProvider.OpenAI.id,  // 错误：映射回内置服务商
  google: ServiceProvider.Google.id,
  anthropic: ServiceProvider.Anthropic.id,
};
return typeToProviderMap[customProvider.type] || ServiceProvider.OpenAI.id;
```

**修复后**：
```typescript
// 直接返回自定义服务商的ID，让 SDK Manager 处理
logger.debug(`[API] Normalized custom provider: ${provider}`);
return provider; // 返回原始的自定义服务商ID
```

**效果**：现在自定义服务商不会被错误地映射到内置服务商，确保使用正确的配置。

### 2. 修复显示名称问题

**问题根源**：聊天界面直接显示 `providerId` 而不是用户友好的名称

**文件**：`app/components/chat.tsx`

**修复内容**：
1. **多模型消息显示**：
   ```typescript
   // 获取用户友好的 provider 显示名称
   const getProviderDisplayName = (providerId: string) => {
     if (providerId?.startsWith("custom_")) {
       const customProvider = accessStore.customProviders.find(
         (p) => p.id === providerId
       );
       return customProvider?.name || providerId;
     }
     return providerId;
   };
   ```

2. **单模型消息显示**：
   ```typescript
   @{(() => {
     const providerId = message.modelKey.split("@")[1];
     if (providerId?.startsWith("custom_")) {
       const customProvider = accessStore.customProviders.find(
         (p) => p.id === providerId
       );
       return customProvider?.name || providerId;
     }
     return providerId;
   })()}
   ```

**效果**：现在聊天界面会显示 `@fly` 而不是 `@custom_1234567890_abcdef123`。

### 3. 修复模型列表刷新问题

**问题根源**：每次打开模型管理界面都会重新获取模型列表

**文件**：`app/components/model-manager.tsx`

**修复前**：
```typescript
if (shouldFetchFromAPI) {
  // 每次打开都重新获取最新模型，不依赖缓存
  fetchModelsFromAPI();
}
```

**修复后**：
```typescript
if (shouldFetchFromAPI) {
  // 只在没有缓存时获取模型，避免每次打开都刷新
  const cachedModels = store.apiModelsCache?.[provider];
  if (!cachedModels || cachedModels.length === 0) {
    fetchModelsFromAPI();
  } else {
    // 使用缓存的模型
    setApiModels(cachedModels);
  }
}
```

**效果**：添加模型后不会自动刷新列表，保持用户的操作状态。

## 修复流程验证

### 修复前的问题流程：
1. 用户选择自定义服务商模型 → 会话存储正确的 provider ID
2. `normalizeProviderName` 将自定义服务商映射为 `openai` → **错误**
3. SDK Manager 使用 OpenAI 的配置 → **错误**
4. 请求发送到 OpenAI 的端点 → **错误**
5. 聊天界面显示 `@custom_1234567890_abcdef123` → **用户体验差**

### 修复后的正确流程：
1. 用户选择自定义服务商模型 → 会话存储正确的 provider ID
2. `normalizeProviderName` 返回自定义服务商 ID → **正确**
3. SDK Manager 使用自定义服务商的配置 → **正确**
4. 请求发送到自定义服务商的端点 → **正确**
5. 聊天界面显示 `@fly` → **用户友好**

## 测试场景

### 场景 1：模型路由测试
- **配置**：OpenAI 厂商禁用，自定义 "fly" 厂商启用
- **操作**：选择自定义厂商的 `ep-20250214142029-ntnp7` 模型
- **预期**：请求发送到自定义厂商的端点，使用自定义厂商的 API Key

### 场景 2：显示名称测试
- **操作**：在聊天界面使用自定义厂商的模型
- **预期**：模型名称显示为 `ep-20250214142029-ntnp7@fly`

### 场景 3：列表刷新测试
- **操作**：打开模型管理 → 添加自定义模型 → 再次打开模型管理
- **预期**：第二次打开时不会重新获取模型列表，使用缓存

## 相关文件

- `app/client/api.ts` - 修复 `normalizeProviderName` 函数
- `app/components/chat.tsx` - 修复显示名称逻辑
- `app/components/model-manager.tsx` - 修复列表刷新逻辑

## 向后兼容性

- ✅ 内置服务商功能不受影响
- ✅ 现有自定义服务商继续工作
- ✅ 模型缓存机制保持兼容
- ✅ 所有现有配置和数据保持兼容

## 调试信息

修复后可以通过以下方式验证：

1. **检查路由**：查看 `[API] Normalized custom provider` 日志
2. **检查配置**：查看 `[SDK Manager]` 日志确认使用的配置
3. **检查显示**：聊天界面应显示用户友好的服务商名称
4. **检查缓存**：模型管理界面不应每次都重新获取列表

## 待完善功能

1. **自定义厂商配置扩展**：为 OpenAI 兼容厂商添加完整的配置选项（Response API、代理设置等）
2. **配置界面优化**：让自定义厂商配置界面和内置厂商保持一致
3. **模型管理优化**：改进自定义模型的添加和管理流程

现在自定义服务商应该能够正确路由，显示友好的名称，并且不会出现不必要的列表刷新！