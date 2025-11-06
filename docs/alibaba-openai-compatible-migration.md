# 阿里云通义千问 - 迁移到 OpenAI 兼容模式

## 概述

将阿里云通义千问的 API 调用方式从 DashScope SDK 格式迁移到 OpenAI 兼容格式。

## 为什么要迁移？

### OpenAI 兼容模式的优势

1. **标准化接口**：使用业界标准的 OpenAI API 格式
2. **更好的兼容性**：与其他 OpenAI 兼容的工具和库无缝集成
3. **简化代码**：统一的 API 格式减少特殊处理
4. **更好的工具支持**：原生支持 Function Calling
5. **易于迁移**：如果需要切换到其他 OpenAI 兼容的服务，代码改动最小

### 两种模式对比

| 特性 | DashScope 模式 | OpenAI 兼容模式 |
|------|----------------|-----------------|
| Base URL | `https://dashscope.aliyuncs.com/api/` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 请求格式 | `{input: {messages}, parameters: {...}}` | `{messages, stream, temperature, ...}` |
| 响应格式 | `{output: {choices: [{message: {...}}]}}` | `{choices: [{delta: {...}}]}` |
| 工具调用 | 支持 | 原生支持 |
| 图片处理 | 自定义格式 `{image: "..."}` | OpenAI 格式 `{type: "image_url", image_url: {...}}` |

## 修改内容

### 1. Base URL 更新

**文件**: `app/constant.ts`

```typescript
// ❌ 旧的 DashScope 格式
export const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/api/";

// ✅ 新的 OpenAI 兼容格式
export const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
```

### 2. API 路径更新

**文件**: `app/constant.ts`

```typescript
// ❌ 旧的 DashScope 格式
export const Alibaba = {
  ExampleEndpoint: ALIBABA_BASE_URL,
  ChatPath: (modelName: string) => {
    if (modelName.includes("vl") || modelName.includes("omni")) {
      return "v1/services/aigc/multimodal-generation/generation";
    }
    return `v1/services/aigc/text-generation/generation`;
  },
};

// ✅ 新的 OpenAI 兼容格式
export const Alibaba = {
  ExampleEndpoint: ALIBABA_BASE_URL,
  ChatPath: "chat/completions",
};
```

### 3. 请求格式更新

**文件**: `app/client/platforms/alibaba.ts`

#### 请求负载类型定义

```typescript
// ❌ 旧的 DashScope 格式
interface RequestPayload {
  model: string;
  input: {
    messages: {...}[];
  };
  parameters: {
    result_format: string;
    incremental_output?: boolean;
    temperature: number;
    top_p: number;
  };
}

// ✅ 新的 OpenAI 兼容格式
interface RequestPayload {
  model: string;
  messages: {...}[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  tools?: any[];
}
```

#### 请求构建

```typescript
// ❌ 旧的 DashScope 格式
const requestPayload: RequestPayload = {
  model: modelConfig.model,
  input: {
    messages,
  },
  parameters: {
    result_format: "message",
    incremental_output: shouldStream,
    temperature: modelConfig.temperature,
    top_p: modelConfig.top_p,
  },
};

// ✅ 新的 OpenAI 兼容格式
const requestPayload: RequestPayload = {
  model: modelConfig.model,
  messages,
  stream: shouldStream,
  temperature: modelConfig.temperature,
  top_p: modelConfig.top_p,
};

// 添加 tools 参数（如果有）
if (options.tools && options.tools.length > 0) {
  requestPayload.tools = options.tools;
}
```

### 4. Headers 更新

```typescript
// ❌ 旧的 DashScope 格式
const headers: Record<string, string> = {
  ...baseHeaders,
  "X-DashScope-SSE": shouldStream ? "enable" : "disable",
};

// ✅ 新的 OpenAI 兼容格式
const headers: Record<string, string> = {
  ...baseHeaders,
  "Content-Type": "application/json",
};
```

### 5. 响应解析更新

#### SSE 流式响应

```typescript
// ❌ 旧的 DashScope 格式
const json = JSON.parse(text);
const choices = json.output.choices as Array<{
  message: {
    content: string | null;
    tool_calls: ChatMessageTool[];
  };
}>;

// ✅ 新的 OpenAI 兼容格式
const json = JSON.parse(text);
const choices = json.choices as Array<{
  delta: {
    content: string | null;
    tool_calls: ChatMessageTool[];
  };
}>;
```

#### 非流式响应

```typescript
// ❌ 旧的 DashScope 格式
extractMessage(res: any) {
  return res?.output?.choices?.at(0)?.message?.content ?? "";
}

// ✅ 新的 OpenAI 兼容格式
extractMessage(res: any) {
  return res?.choices?.at(0)?.message?.content ?? "";
}
```

### 6. 图片处理更新

```typescript
// ❌ 旧的 DashScope 格式
import { preProcessImageContentForAlibabaDashScope } from "@/app/utils/chat";

const content = visionModel
  ? await preProcessImageContentForAlibabaDashScope(v.content)
  : getMessageTextContent(v);

// ✅ 新的 OpenAI 兼容格式
import { preProcessImageContent } from "@/app/utils/chat";

const content = visionModel
  ? await preProcessImageContent(v.content)
  : getMessageTextContent(v);
```

### 7. 工具调用消息处理

```typescript
// ❌ 旧的 DashScope 格式
requestPayload?.input?.messages?.splice(
  requestPayload?.input?.messages?.length,
  0,
  toolCallMessage,
  ...toolCallResult,
);

// ✅ 新的 OpenAI 兼容格式
requestPayload?.messages?.splice(
  requestPayload?.messages?.length,
  0,
  toolCallMessage,
  ...toolCallResult,
);
```

## 完整的请求示例

### DashScope 格式（旧）

```json
POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
Headers:
  Authorization: Bearer sk-xxx
  X-DashScope-SSE: enable

Body:
{
  "model": "qwen-plus",
  "input": {
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  },
  "parameters": {
    "result_format": "message",
    "incremental_output": true,
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

### OpenAI 兼容格式（新）

```json
POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
Headers:
  Authorization: Bearer sk-xxx
  Content-Type: application/json

Body:
{
  "model": "qwen-plus",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "stream": true,
  "temperature": 0.7,
  "top_p": 0.9
}
```

## 工具调用示例

### 请求

```json
{
  "model": "qwen-plus",
  "messages": [
    {"role": "user", "content": "北京天气怎么样"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "查询指定城市的天气",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "城市名称"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

### 响应（流式）

```json
// 第一个 chunk
{
  "choices": [{
    "delta": {
      "tool_calls": [{
        "id": "call_xxx",
        "type": "function",
        "function": {
          "name": "get_current_weather",
          "arguments": ""
        }
      }]
    }
  }]
}

// 后续 chunks（累积参数）
{
  "choices": [{
    "delta": {
      "tool_calls": [{
        "function": {
          "arguments": "{\"location\":"
        }
      }]
    }
  }]
}

{
  "choices": [{
    "delta": {
      "tool_calls": [{
        "function": {
          "arguments": "\"北京\"}"
        }
      }]
    }
  }]
}
```

## 测试清单

- [ ] 基本对话功能正常
- [ ] 流式响应正常
- [ ] 非流式响应正常
- [ ] 多轮对话正常
- [ ] 视觉模型（qwen-vl）图片处理正常
- [ ] 工具调用（Function Calling）正常
- [ ] MCP 工具集成正常
- [ ] 错误处理正常
- [ ] 代理设置正常工作

## 兼容性说明

### 支持的模型

所有通义千问模型都支持 OpenAI 兼容模式：
- qwen-turbo
- qwen-plus
- qwen-max
- qwen-vl-plus
- qwen-vl-max
- qwen2.5 系列
- qwen3 系列

### API Key

使用相同的 API Key，无需更改。

### 地域支持

- **北京地域**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **新加坡地域**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## 迁移检查

如果遇到问题，请检查：

1. **Base URL 是否正确**
   - 应该包含 `/compatible-mode/v1`
   - 不应该包含 `/api/v1/services/`

2. **请求格式是否正确**
   - 使用 `messages` 而不是 `input.messages`
   - 使用 `stream` 而不是 `parameters.incremental_output`

3. **响应解析是否正确**
   - 使用 `choices[0].delta` 而不是 `output.choices[0].message`

4. **Headers 是否正确**
   - 不应该包含 `X-DashScope-SSE`
   - 应该包含 `Content-Type: application/json`

## 回滚方案

如果需要回滚到 DashScope 格式，可以：

1. 恢复 `app/constant.ts` 中的 Base URL 和 ChatPath
2. 恢复 `app/client/platforms/alibaba.ts` 中的请求和响应格式
3. 恢复图片处理函数的调用

## 参考文档

- [阿里云百炼 OpenAI 兼容文档](https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-openai-api)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)

## 总结

这次迁移将阿里云通义千问的调用方式统一到 OpenAI 标准格式，提高了代码的可维护性和兼容性。所有功能保持不变，包括基本对话、流式响应、工具调用和 MCP 集成。
