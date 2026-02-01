# 自定义服务商模型获取修复

## 问题描述

用户配置了名为 "fly" 的自定义服务商，但在获取模型列表时出现错误：
```
fly 模型获取失败：不支持的服务商 custom_*
```

## 根本原因

在 `app/client/model-fetcher.ts` 的 `fetchModels` 方法中，逻辑顺序有问题：

1. **错误的逻辑顺序**：先检查内置服务商配置，找不到就返回错误
2. **自定义服务商检查太晚**：自定义服务商的检查在内置服务商检查之后
3. **Provider 信息错误**：解析模型时使用了错误的 provider 信息

## 修复方案

### 1. 调整检查顺序

**修改前**：
```typescript
// 先检查内置服务商配置
let providerConfig = getProviderConfig(provider);
if (!providerConfig) {
  return { error: `不支持的服务商: ${provider}` };
}

// 后检查自定义服务商（永远不会执行到）
if (provider.startsWith("custom_")) {
  // ...
}
```

**修改后**：
```typescript
// 首先检查是否是自定义服务商
if (provider.startsWith("custom_")) {
  const customProvider = accessStore.customProviders.find(p => p.id === provider);
  if (customProvider) {
    return await this.fetchCustomProviderModels(customProvider);
  }
}

// 然后检查内置服务商
let providerConfig = getProviderConfig(provider);
// ...
```

### 2. 修复 Provider 信息

**修改前**：
```typescript
provider: {
  id: `custom_${providerType}`,  // 错误：使用类型而不是真实ID
  providerName: providerType,
  providerType: providerType,
}
```

**修改后**：
```typescript
provider: {
  id: providerId,           // 正确：使用真实的自定义服务商ID
  providerName: providerName, // 正确：使用用户设置的名称
  providerType: "custom",   // 正确：标记为自定义类型
}
```

### 3. 改进错误处理

添加了更具体的错误信息：
- 自定义服务商未找到：`自定义服务商 ${provider} 未找到`
- 内置服务商不支持：`不支持的服务商: ${provider}`

## 修复的文件

### `app/client/model-fetcher.ts`

1. **`fetchModels` 方法**：
   - 将自定义服务商检查移到最前面
   - 改进错误处理和日志记录

2. **`parseModelsResponse` 方法**：
   - 修改方法签名：`(data, providerType)` → `(data, providerId, providerName)`
   - 使用正确的 provider 信息

3. **`fetchCustomProviderModels` 方法**：
   - 传递正确的参数给 `parseModelsResponse`

## 测试验证

修复后的逻辑流程：

1. **输入**：`custom_1234567890_abcdef123` (fly 服务商)
2. **检测**：✅ 识别为自定义服务商
3. **查找**：✅ 在 `accessStore.customProviders` 中找到配置
4. **请求**：✅ 向 `{endpoint}/models` 发起请求
5. **解析**：✅ 使用正确的 provider 信息解析响应

## 支持的响应格式

修复后支持多种 `/models` 接口响应格式：

### OpenAI 格式
```json
{
  "data": [
    {"id": "gpt-3.5-turbo"},
    {"id": "gpt-4"}
  ]
}
```

### 直接数组格式
```json
["model1", "model2", "model3"]
```

### 嵌套格式
```json
{
  "models": [
    {"id": "model1"},
    {"name": "model2"}
  ]
}
```

## 向后兼容性

- ✅ 内置服务商功能不受影响
- ✅ 现有自定义服务商继续工作
- ✅ 所有现有配置保持兼容
- ✅ 错误处理更加友好

## 使用方式

修复后，用户可以：

1. **添加自定义服务商**：
   - 设置 → 模型服务 → 添加自定义服务商
   - 填写名称（如 "fly"）、API Key、端点 URL

2. **获取模型列表**：
   - 模型管理 → 刷新模型列表
   - 系统自动请求 `{endpoint}/models`

3. **查看结果**：
   - 成功：显示获取到的模型列表
   - 失败：显示具体的错误信息

现在 "fly" 等自定义服务商应该能够正常获取模型列表了！