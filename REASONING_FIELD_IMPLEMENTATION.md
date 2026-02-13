# 推理字段实现说明

## 概述

本次修改实现了从 `models-config.ts` 配置文件中读取模型的推理字段配置，并在流式响应中正确解析推理内容。

## 修改内容

### 1. 模型能力接口简化 (`app/config/model-config.ts`)

**修改前：**
```typescript
export interface ModelCapabilities {
  vision?: boolean;
  web?: boolean;
  reasoning?: boolean;
  tools?: boolean;
  thinkingType?: "gemini" | "claude";
  reasoningField?: string;
}
```

**修改后：**
```typescript
export interface ModelCapabilities {
  vision?: boolean; // 视觉能力
  reasoning?: boolean; // 推理能力
  tools?: boolean; // 工具调用能力
  reasoningField?: string; // 推理内容字段名（从 interleaved.field 获取）
}
```

**变更说明：**
- 移除了 `web` 字段（联网能力）
- 移除了 `thinkingType` 字段（thinking实现类型）
- 保留了核心的三种能力：视觉、推理、工具
- `reasoningField` 现在从 `models-config.ts` 的 `interleaved.field` 中获取

### 2. 从配置中读取推理字段 (`app/config/model-config.ts`)

在 `getModelCapabilities` 函数中添加了从配置读取 `reasoningField` 的逻辑：

```typescript
// 推理能力：检查 reasoning 字段
if (model.reasoning === true) {
  capabilities.reasoning = true;

  // 从 interleaved.field 获取推理内容字段名
  if (
    model.interleaved &&
    typeof model.interleaved === "object" &&
    "field" in model.interleaved &&
    typeof model.interleaved.field === "string"
  ) {
    capabilities.reasoningField = model.interleaved.field;
  }
}
```

### 3. 配置文件格式 (`app/config/generated/models-config.ts`)

推理模型的配置示例：

```typescript
"glm-4.7": {
  id: "glm-4.7",
  name: "GLM-4.7",
  family: "glm",
  attachment: false,
  reasoning: true,
  tool_call: true,
  interleaved: {
    field: "reasoning_content",  // 推理内容字段名
  },
  // ... 其他配置
}
```

### 4. 推理内容提取函数 (`app/config/model-config.ts`)

新增了 `extractReasoningContent` 函数，用于从 AI SDK 的流式响应中提取推理内容：

```typescript
export function extractReasoningContent(
  part: any,
  reasoningField: string,
): string | null {
  // 方法1: 从 experimental_providerMetadata.rawResponse 中提取
  // OpenAI 兼容格式：choices[0].delta[reasoningField]
  
  // 方法2: 直接从 part 中提取
  
  // 方法3: 从 rawPart 中提取（备用方案）
}
```

### 5. 流式响应处理 (`app/client/api.ts`)

在流式响应处理中集成了推理内容提取：

```typescript
// 获取模型能力
const { getModelCapabilities, extractReasoningContent } = await import("../config/model-config");
const capabilities = getModelCapabilities(
  options.config.model,
  options.config.providerName,
);
const reasoningField = capabilities.reasoningField;

// 在处理每个流式响应片段时
if (reasoningField && capabilities.reasoning) {
  const reasoningDelta = extractReasoningContent(part, reasoningField);
  if (reasoningDelta) {
    reasoningContent += reasoningDelta;
    // TODO: 将推理内容传递给 UI 显示
  }
}
```

## OpenAI 兼容模型的推理内容格式

对于 OpenAI 兼容的推理模型（如 DeepSeek-R1、GLM-4.7 等），推理内容通常在流式响应的以下位置：

```json
{
  "choices": [
    {
      "delta": {
        "content": "正常的回答内容",
        "reasoning_content": "推理过程的内容"  // 推理字段
      }
    }
  ]
}
```

## 使用示例

### 1. 配置模型

在 `models-config.ts` 中配置支持推理的模型：

```typescript
"deepseek-r1": {
  id: "deepseek-r1",
  name: "DeepSeek-R1",
  reasoning: true,
  tool_call: true,
  interleaved: {
    field: "reasoning_content",  // 指定推理字段名
  },
  // ...
}
```

### 2. 获取模型能力

```typescript
import { getModelCapabilities } from "@/app/config/model-config";

const capabilities = getModelCapabilities("deepseek-r1", "deepseek");
console.log(capabilities);
// {
//   vision: false,
//   reasoning: true,
//   tools: true,
//   reasoningField: "reasoning_content"
// }
```

### 3. 提取推理内容

推理内容会在流式响应处理过程中自动提取并记录日志。

## 后续工作

当前实现已经完成了推理内容的提取，但还需要以下工作来完整支持推理内容的显示：

1. **UI 显示**：在聊天界面中添加推理内容的显示区域
2. **消息存储**：将推理内容保存到消息对象中
3. **回调扩展**：扩展 `ChatOptions` 接口，添加推理内容的回调函数
4. **折叠/展开**：实现推理内容的折叠/展开功能

## 测试建议

1. 使用支持推理的模型（如 DeepSeek-R1、GLM-4.7）进行测试
2. 检查浏览器控制台日志，确认推理内容被正确提取
3. 验证不同厂商的推理模型是否都能正确工作

## 注意事项

1. 推理字段名可能因厂商而异，需要在配置文件中正确设置
2. 某些模型可能不支持推理功能，此时 `reasoningField` 为 `undefined`
3. 推理内容的提取依赖于 AI SDK 暴露的原始响应数据
