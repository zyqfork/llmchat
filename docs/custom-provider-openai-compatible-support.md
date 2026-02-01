# 自定义服务商 OpenAI 兼容支持

## 功能概述

实现了对自定义服务商的完整支持，特别是 OpenAI 类型的自定义服务商：

1. **使用 OpenAI 兼容 SDK**：自定义 OpenAI 类型服务商使用 `openai-compatible` SDK 而不是 `openai` SDK
2. **支持 `/models` 接口**：自定义服务商可以通过标准的 `/models` 端点获取模型列表
3. **Response API 支持**：自定义 OpenAI 类型服务商也支持 Response API 选项

## 主要修改

### 1. SDK Manager 支持自定义服务商

**文件**: `app/client/sdk-manager.ts`

#### 修改内容：
- **自定义服务商检测**：检查 `providerId.startsWith("custom_")` 来识别自定义服务商
- **虚拟 Provider 配置**：为自定义服务商创建虚拟的 provider 配置对象
- **SDK 类型映射**：自定义 OpenAI 类型 → `openai-compatible` SDK
- **API 类型支持**：自定义 OpenAI 类型服务商支持 `apiType` 设置

#### 关键逻辑：
```typescript
if (providerId.startsWith("custom_")) {
  // 自定义服务商
  provider = {
    id: providerId,
    name: customProvider.name,
    // 自定义 OpenAI 类型使用 openai-compatible SDK
    sdkType: customProvider.type === "openai" ? "openai-compatible" : customProvider.type,
    defaultBaseUrl: customProvider.endpoint || "",
    storeKeys: {
      // 自定义服务商支持 API 类型选择（如果是 OpenAI 类型）
      apiType: customProvider.type === "openai" ? `${providerId}ApiType` : undefined,
    },
  };
}
```

### 2. Model Fetcher 支持自定义服务商

**文件**: `app/client/model-fetcher.ts`

#### 修改内容：
- **直接请求 `/models`**：自定义服务商直接请求其端点的 `/models` 接口
- **多格式响应解析**：支持不同格式的模型列表响应
- **认证头设置**：根据服务商类型设置正确的认证头

#### 关键功能：
```typescript
// 构建请求 URL - 使用标准的 /models 端点
const requestUrl = `${baseUrl}/models`;

// 根据自定义服务商类型设置认证头
switch (customProvider.type) {
  case "openai":
    headers["Authorization"] = `Bearer ${apiKey}`;
    break;
  case "anthropic":
    headers["x-api-key"] = apiKey;
    break;
  // ...
}
```

### 3. Access Store 支持 API 类型设置

**文件**: `app/store/access.ts`

#### 修改内容：
- **自动初始化**：添加自定义 OpenAI 服务商时自动创建 API 类型设置
- **设置清理**：删除自定义服务商时清理相关设置
- **动态 Store Key**：使用 `${providerId}ApiType` 作为设置键

#### 关键逻辑：
```typescript
// 添加自定义服务商时
if (newProvider.type === "openai") {
  const apiTypeKey = `${newProvider.id}ApiType`;
  (newState as any)[apiTypeKey] = "chat"; // 默认使用 Chat API
}

// 删除自定义服务商时
if (provider && provider.type === "openai") {
  const apiTypeKey = `${id}ApiType`;
  delete (newState as any)[apiTypeKey];
}
```

## 支持的功能

### ✅ 自定义 OpenAI 类型服务商
- 使用 `openai-compatible` SDK
- 支持 Chat API 和 Response API 切换
- 通过 `/models` 接口获取模型列表
- 完整的认证和配置支持

### ✅ 自定义 Anthropic 类型服务商
- 使用 `anthropic` SDK
- 通过 `/models` 接口获取模型列表
- 正确的 `x-api-key` 认证头

### ✅ 自定义 Google 类型服务商
- 使用 `google` SDK
- 通过 `/models` 接口获取模型列表
- 正确的 `x-goog-api-key` 认证头

## 使用方式

### 1. 添加自定义 OpenAI 类型服务商
1. 进入 **设置 → 模型服务 → 添加自定义服务商**
2. 选择 **OpenAI** 类型
3. 填写服务商名称、API Key 和端点 URL
4. 保存后会自动：
   - 使用 `openai-compatible` SDK
   - 初始化 Response API 设置（默认为 Chat API）
   - 支持通过 `/models` 获取模型列表

### 2. 配置 Response API
1. 在服务商配置中找到 **"使用 Response API"** 选项
2. 勾选启用 Response API，取消勾选使用 Chat API
3. 设置会自动应用到该服务商的所有模型调用

### 3. 获取模型列表
1. 在模型管理界面点击 **"刷新模型列表"**
2. 系统会自动请求 `{endpoint}/models` 接口
3. 解析响应并显示可用模型

## 技术细节

### API 类型设置键格式
- **内置服务商**：`{providerId}ApiType`（如 `openaiApiType`）
- **自定义服务商**：`{customProviderId}ApiType`（如 `custom_1234567890_abcdef123ApiType`）

### 模型列表请求格式
```http
GET {endpoint}/models
Authorization: Bearer {apiKey}
Content-Type: application/json
```

### 支持的响应格式
1. **OpenAI 格式**：`{data: [{id: "model-name"}, ...]}`
2. **直接数组**：`["model1", "model2", ...]`
3. **嵌套格式**：`{models: [{id: "model-name"}, ...]}`

## 向后兼容性

- ✅ 现有内置服务商功能不受影响
- ✅ 现有自定义服务商继续工作
- ✅ 现有 API 类型设置保持不变
- ✅ 所有现有配置和数据保持兼容

## 调试信息

系统会输出详细的调试日志：
- `[SDK Manager]` - SDK 实例创建和 API 类型选择
- `[Model Fetcher]` - 模型列表获取过程
- `[Access Store]` - 自定义服务商设置管理

可以在浏览器控制台查看这些日志来诊断问题。