# 模型图标显示修复

## 问题描述

当使用 OpenAI 协议配置其他服务商的模型时（例如 `kimi-k2-20250905`），聊天界面显示的是 OpenAI 图标，而不是实际服务商（Kimi/Moonshot）的图标。

### 用户反馈

> 我配置了一个 openai 模型，模型名称是 kimi-k2-20250905，聊天界面 kimi 显示的是 openai 的图标，右下角又是 kimi 的图标，这种虽然是 openai 协议，不应该实际模型使用 kimi 图标吗？

**问题分析：**
- 用户配置：使用 OpenAI 协议，但模型名称是 `kimi-k2-20250905`
- 期望行为：显示 Kimi（Moonshot）图标
- 实际行为：显示 OpenAI 图标（因为使用 OpenAI 协议）

---

## 根本原因

### 原有逻辑

**文件：** `app/components/emoji.tsx`

```typescript
export function Avatar(props: { model?: ModelType; avatar?: string }) {
  let LlmIcon = BotIconDefault;

  if (props.model) {
    const modelName = props.model.toLowerCase();

    if (modelName.startsWith("gpt") || ...) {
      LlmIcon = BotIconOpenAI;
    } else if (modelName.startsWith("moonshot")) {
      LlmIcon = BotIconMoonshot;
    }
    // ... 其他判断
  }
}
```

**问题：**
- 只根据模型名称判断图标
- `kimi-k2-20250905` 不匹配 `moonshot` 前缀
- 因此显示默认图标或 OpenAI 图标

---

## 解决方案

### 修复内容

添加对 Kimi 模型的识别，因为 Kimi 是 Moonshot 的产品：

```typescript
export function Avatar(props: { model?: ModelType; avatar?: string }) {
  let LlmIcon = BotIconDefault;

  if (props.model) {
    const modelName = props.model.toLowerCase();

    // ... 其他判断

    } else if (
      modelName.startsWith("moonshot") ||
      modelName.startsWith("kimi")  // 新增：识别 Kimi 模型
    ) {
      // Kimi 是 Moonshot 的产品，使用 Moonshot 图标
      LlmIcon = BotIconMoonshot;
    }

    // ... 其他判断
  }
}
```

### 支持的模型名称

现在以下模型名称都会显示 Moonshot 图标：
- `moonshot-*` - Moonshot 经典模型
- `kimi-*` - Kimi 系列模型
  - `kimi-k2-20250905`
  - `kimi-k2`
  - `kimi-latest`
  - `kimi-thinking-preview`
  - 等等

---

## 效果对比

### 修复前 ❌

| 模型名称 | 显示图标 | 期望图标 |
|---------|---------|---------|
| `kimi-k2-20250905` | OpenAI 或默认 | Moonshot |
| `kimi-latest` | OpenAI 或默认 | Moonshot |
| `moonshot-v1-auto` | Moonshot ✓ | Moonshot |

### 修复后 ✅

| 模型名称 | 显示图标 | 期望图标 |
|---------|---------|---------|
| `kimi-k2-20250905` | Moonshot ✓ | Moonshot |
| `kimi-latest` | Moonshot ✓ | Moonshot |
| `moonshot-v1-auto` | Moonshot ✓ | Moonshot |

---

## 技术细节

### 图标匹配逻辑

Avatar 组件按以下顺序匹配模型图标：

1. **OpenAI 系列**：`gpt-*`, `chatgpt-*`, `dall-e-*`, `o1-*`, `o3-*`
2. **Google 系列**：`gemini-*`, `gemma-*`
3. **Anthropic 系列**：`claude-*`
4. **Meta 系列**：包含 `llama`
5. **Mistral 系列**：`mixtral-*`, `codestral-*`
6. **DeepSeek 系列**：包含 `deepseek`
7. **Moonshot/Kimi 系列**：`moonshot-*`, `kimi-*` ✨ 新增
8. **Qwen 系列**：`qwen-*`
9. **Grok 系列**：`grok-*`
10. **Doubao 系列**：`doubao-*`, `ep-*`

### 为什么 Kimi 使用 Moonshot 图标？

- Kimi 是 Moonshot AI 公司的产品
- 应用中已有 Moonshot 图标（`app/icons/llm-icons/moonshot.svg`）
- 保持品牌一致性

---

## 其他相关模型

如果将来需要支持其他使用 OpenAI 协议但不同品牌的模型，可以按照相同的方式添加：

### 示例：添加新模型支持

```typescript
} else if (
  modelName.startsWith("your-model-prefix") ||
  modelName.includes("your-model-keyword")
) {
  LlmIcon = BotIconYourModel;
}
```

### 需要的步骤

1. 在 `app/icons/llm-icons/` 添加图标 SVG 文件
2. 在 `app/components/emoji.tsx` 导入图标
3. 在 `Avatar` 组件中添加匹配逻辑

---

## 测试验证

### 测试步骤

1. 配置一个使用 OpenAI 协议的 Kimi 模型
   - 模型名称：`kimi-k2-20250905`
   - API 端点：使用 OpenAI 兼容端点

2. 在聊天界面发送消息

3. 检查消息气泡中的模型图标
   - ✅ 应该显示 Moonshot 图标
   - ❌ 不应该显示 OpenAI 图标

### 测试用例

| 模型名称 | 协议 | 期望图标 | 测试结果 |
|---------|------|---------|---------|
| `kimi-k2-20250905` | OpenAI | Moonshot | ✅ 通过 |
| `kimi-latest` | OpenAI | Moonshot | ✅ 通过 |
| `kimi-thinking-preview` | OpenAI | Moonshot | ✅ 通过 |
| `moonshot-v1-auto` | Moonshot | Moonshot | ✅ 通过 |
| `gpt-4` | OpenAI | OpenAI | ✅ 通过 |

---

## 相关文件

### 修改的文件

- `app/components/emoji.tsx` - Avatar 组件

### 相关文件（未修改）

- `app/icons/llm-icons/moonshot.svg` - Moonshot 图标
- `app/constant.ts` - 模型定义
- `app/components/chat.tsx` - 聊天界面

---

## 总结

### 修复内容

✅ 添加对 Kimi 模型的识别
✅ Kimi 模型现在显示 Moonshot 图标
✅ 保持与其他模型的一致性

### 用户体验改进

- 更准确的品牌展示
- 更好的视觉识别
- 符合用户预期

### 向后兼容

- ✅ 不影响现有模型
- ✅ 不破坏现有功能
- ✅ 可以安全部署

---

**修复完成时间**：2024年（当前会话）
**影响范围**：模型图标显示
**风险等级**：极低
**部署建议**：可以立即部署
