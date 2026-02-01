# 自定义厂商显示名称修复

## 问题描述

用户添加自定义厂商（名称为 "fly"）后，在聊天界面中显示为 `@custom_1769936141058_5it5le7pp` 而不是 `@fly`。

## 根本原因

1. **模型 provider 信息不完整**：在 `model-fetcher.ts` 中，自定义厂商的模型没有正确设置 `provider.id` 和 `provider.providerName`
2. **单模型模式缺少 modelKey**：在 `chat.ts` 中，单模型模式下创建的 bot 消息没有设置 `modelKey` 字段
3. **模型选择时标准化问题**：在 `chat.tsx` 中，选择模型时使用了 `normalizeProviderName`，可能导致自定义厂商 ID 被错误转换

## 修复方案

### 1. 修复 model-fetcher.ts

在 `parseModelsResponse` 方法中，确保自定义厂商的模型正确设置 provider 信息：

```typescript
provider: {
  id: providerId, // 使用自定义服务商的ID (custom_xxx)
  providerName: providerName, // 使用自定义服务商的名称 (fly)
  providerType: "custom",
  sorted: 999,
}
```

添加调试日志以便追踪：

```typescript
logger.debug(`[Model Fetcher] Parsed models:`, {
  providerId,
  providerName,
  count: models.length,
  sampleModel: models[0],
});
```

### 2. 修复 chat.ts

在单模型模式下创建 bot 消息时，添加 `modelKey` 字段：

```typescript
const botMessage: ChatMessage = createMessage({
  role: "assistant",
  streaming: true,
  model: modelConfig.model,
  modelKey: `${modelConfig.model}@${modelConfig.providerName}`, // 添加此行
});
```

### 3. 修复 chat.tsx

在模型选择器的 `onSelection` 回调中，直接使用 `providerId` 而不是标准化：

```typescript
onSelection={(selectedValue) => {
  const [model, providerId] = getModelProvider(selectedValue);
  chatStore.updateTargetSession(session, (session) => {
    session.mask.modelConfig.model = model as ModelType;
    // 直接使用 providerId，不要标准化
    session.mask.modelConfig.providerName = providerId!;
    // ...
  });
}}
```

### 4. 增强 getProviderDisplayName 函数

添加空值检查和更详细的日志：

```typescript
function getProviderDisplayName(providerId: string, accessStore: any): string {
  if (!providerId) {
    logger.warn(`[Chat] Provider ID is empty`);
    return "Unknown";
  }
  
  // 如果是自定义厂商
  if (providerId.startsWith("custom_")) {
    const customProvider = accessStore.customProviders?.find(
      (p: any) => p.id === providerId
    );
    if (customProvider) {
      return customProvider.name; // 返回用户设置的名称
    }
  }
  
  // 内置厂商直接返回 ID
  return providerId;
}
```

## 模态框样式修复

### 1. 标签右对齐

增加标签宽度以适应中文：

```scss
.form-label {
  min-width: 140px; // 从 120px 增加到 140px
  text-align: right;
}
```

### 2. 防止添加按钮消失

确保表单和底部按钮正确使用 flexbox：

```scss
.custom-provider-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0; // 允许flex子项收缩
  flex: 1; // 占据可用空间
}

.modal-footer {
  flex-shrink: 0; // 防止底部被压缩
}
```

调整对齐边距：

```scss
.form-description,
.error-message {
  margin-left: 156px; // 140px + 16px gap
}
```

## 数据流

1. **添加自定义厂商**：
   - 用户在设置中添加自定义厂商 "fly"
   - 生成唯一 ID：`custom_1769936141058_5it5le7pp`
   - 保存到 `accessStore.customProviders`

2. **获取模型列表**：
   - `ModelFetcher.fetchCustomProviderModels()` 获取模型
   - 每个模型设置 `provider.id = custom_xxx` 和 `provider.providerName = fly`

3. **选择模型**：
   - 用户选择模型，值为 `claude-sonnet-4-5@custom_xxx`
   - 保存到 `session.mask.modelConfig.providerName = custom_xxx`

4. **发送消息**：
   - 创建 bot 消息时设置 `modelKey = claude-sonnet-4-5@custom_xxx`
   - SDK Manager 使用 `custom_xxx` 查找自定义厂商配置

5. **显示消息**：
   - 从 `message.modelKey` 提取 provider ID
   - `getProviderDisplayName(custom_xxx)` 查找自定义厂商
   - 返回 "fly" 并显示为 `@fly`

## 测试验证

1. 添加自定义厂商 "fly"
2. 从该厂商获取模型列表
3. 选择一个模型并发送消息
4. 验证消息显示为 `@fly` 而不是 `@custom_xxx`
5. 验证模型选择器中正确分组显示
6. 验证模态框标签右对齐
7. 验证缩小窗口时添加按钮不消失

## 相关文件

- `app/client/model-fetcher.ts` - 模型获取和 provider 信息设置
- `app/store/chat.ts` - 消息创建和 modelKey 设置
- `app/components/chat.tsx` - 模型选择和显示逻辑
- `app/components/settings.module.scss` - 模态框样式
- `app/client/api.ts` - normalizeProviderName 函数
- `app/client/sdk-manager.ts` - SDK 实例创建和自定义厂商处理

## 注意事项

1. **不要标准化自定义厂商 ID**：`normalizeProviderName` 应该保留 `custom_xxx` 格式
2. **确保 modelKey 一致性**：单模型和多模型模式都要设置 `modelKey`
3. **Provider 信息完整性**：模型对象必须包含完整的 `provider.id` 和 `provider.providerName`
4. **调试日志**：保留详细的日志以便追踪问题
