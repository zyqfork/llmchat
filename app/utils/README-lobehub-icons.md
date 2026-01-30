# Lobehub Icons 工具函数使用指南

这个工具库提供了一套简单易用的函数来使用 `@lobehub/icons` 包中的 AI 模型图标。

## 📦 文件结构

- `lobehub-icons.tsx` - 核心工具函数
- `lobehub-icons-examples.tsx` - 使用示例
- `README-lobehub-icons.md` - 使用文档

## 🚀 快速开始

### 1. 基础图标使用

```tsx
import { getLobehubIcon } from "@/app/utils/lobehub-icons";

// 基础用法
const openaiIcon = getLobehubIcon({ type: "openai", size: 24 });

// OpenAI 不同模型类型
const gpt4Icon = getLobehubIcon({
  type: "openai",
  variant: "avatar",
  avatarType: "gpt4",
  size: 32,
});

// Claude 彩色图标
const claudeIcon = getLobehubIcon({
  type: "claude",
  variant: "color",
  size: 28,
});
```

### 2. 智能模型图标选择

```tsx
import { getModelLobehubIcon } from "@/app/utils/lobehub-icons";

// 根据模型名称自动选择合适的图标
const gpt4Icon = getModelLobehubIcon("gpt-4o", 24);
const claudeIcon = getModelLobehubIcon("claude-3-sonnet", 24);
const geminiIcon = getModelLobehubIcon("gemini-pro", 24);
const llamaIcon = getModelLobehubIcon("llama-3.1-70b", 24);
```

### 3. 厂商图标获取

```tsx
import { getProviderLobehubIcon } from "@/app/utils/lobehub-icons";

// 根据厂商名称获取图标
const openaiIcon = getProviderLobehubIcon("OpenAI", 32);
const anthropicIcon = getProviderLobehubIcon("Anthropic", 32);
const googleIcon = getProviderLobehubIcon("Google", 32);
```

## 🎨 支持的图标类型

### 主要厂商图标

| 图标类型       | 厂商名称        | 支持的变体                 |
| -------------- | --------------- | -------------------------- |
| `openai`       | OpenAI          | `avatar` (gpt3, gpt4, o1)  |
| `azure`        | Microsoft Azure | `color`                    |
| `claude`       | Anthropic       | `color`, `text`, `combine` |
| `gemini`       | Google          | `color`, `text`, `combine` |
| `meta`         | Meta (Llama)    | `color`, `text`, `combine` |
| `deepseek`     | DeepSeek        | `color`, `text`, `combine` |
| `kimi`         | MoonshotAI      | `color`, `text`, `combine` |
| `qwen`         | 阿里巴巴千问    | `color`, `text`, `combine` |
| `wenxin`       | 百度文心        | `color`, `text`, `combine` |
| `grok`         | xAI             | 默认样式                   |
| `siliconcloud` | SiliconFlow     | `color`, `text`, `combine` |
| `ollama`       | Ollama          | 默认样式                   |

### 图标变体说明

- **`color`**: 彩色版本（默认）
- **`avatar`**: 头像版本（仅 OpenAI 支持，可指定 gpt3/gpt4/o1）
- **`text`**: 文字版本
- **`combine`**: 图标+文字组合版本

## 🛠️ API 参考

### `getLobehubIcon(config)`

获取指定配置的 Lobehub 图标组件。

**参数:**

```typescript
interface LobehubIconConfig {
  type: LobehubIconType; // 图标类型
  variant?: IconVariant; // 图标变体，默认 "color"
  avatarType?: OpenAIAvatarType; // OpenAI Avatar 类型
  size?: number; // 图标大小，默认 24
  style?: React.CSSProperties; // 自定义样式
}
```

### `getModelLobehubIcon(modelName, size?, style?)`

根据模型名称自动选择合适的图标。

**参数:**

- `modelName: string` - 模型名称
- `size?: number` - 图标大小，默认 24
- `style?: React.CSSProperties` - 自定义样式

**支持的模型名称模式:**

- `gpt-3*` → OpenAI GPT-3 图标
- `gpt-4*`, `chatgpt-4o*` → OpenAI GPT-4 图标
- `o1*`, `o3*` → OpenAI O1 图标
- `claude*` → Claude 图标
- `gemini*`, `learnlm*` → Gemini 图标
- `llama*` → Meta Llama 图标
- `deepseek*` → DeepSeek 图标
- `kimi*`, `moonshot*` → Kimi 图标
- `qwen*`, `qwq*`, `qvq*` → Qwen 图标
- `wenxin*`, `文心*` → 文心图标
- `grok*` → Grok 图标
- `ollama*` → Ollama 图标

### `getProviderLobehubIcon(providerName, size?, style?)`

根据厂商名称获取图标。

**参数:**

- `providerName: string` - 厂商名称
- `size?: number` - 图标大小，默认 24
- `style?: React.CSSProperties` - 自定义样式

### 工具函数

```typescript
// 获取所有支持的图标类型
getSupportedLobehubIcons(): LobehubIconType[]

// 检查是否支持指定的图标类型
isSupportedLobehubIcon(iconType: string): boolean
```

## 💡 使用场景

### 1. 聊天界面模型图标

```tsx
function ChatMessage({ modelName }: { modelName: string }) {
  return (
    <div className="message">
      {getModelLobehubIcon(modelName, 20)}
      <span>{modelName}</span>
    </div>
  );
}
```

### 2. 设置页面厂商图标

```tsx
function ProviderSettings({ providers }: { providers: string[] }) {
  return (
    <div>
      {providers.map((provider) => (
        <div key={provider} className="provider-item">
          {getProviderLobehubIcon(provider, 24)}
          <span>{provider}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. 模型选择器

```tsx
function ModelSelector({ models }: { models: Array<{ name: string }> }) {
  return (
    <select>
      {models.map((model) => (
        <option key={model.name} value={model.name}>
          {/* 注意：select option 中不能直接使用 React 组件 */}
          {model.name}
        </option>
      ))}
    </select>
  );
}

// 对于需要图标的选择器，使用自定义组件
function CustomModelSelector({
  models,
  onSelect,
}: {
  models: Array<{ name: string }>;
  onSelect: (model: string) => void;
}) {
  return (
    <div className="model-selector">
      {models.map((model) => (
        <div
          key={model.name}
          className="model-option"
          onClick={() => onSelect(model.name)}
        >
          {getModelLobehubIcon(model.name, 16)}
          <span>{model.name}</span>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 最佳实践

1. **统一图标大小**: 在同一界面中使用统一的图标大小
2. **合理选择变体**: 根据界面风格选择合适的图标变体
3. **缓存图标组件**: 对于频繁使用的图标，考虑使用 `React.memo` 缓存
4. **错误处理**: 对于不支持的模型名称，工具函数会自动回退到 OpenAI 图标
5. **自定义样式**: 使用 `style` 参数添加阴影、边框等效果

## 🔧 扩展支持

如果需要添加新的图标类型：

1. 在 `@lobehub/icons` 中确认图标可用
2. 更新 `LobehubIconType` 类型定义
3. 在 `getLobehubIcon` 函数中添加对应的 case
4. 在 `getModelLobehubIcon` 和 `getProviderLobehubIcon` 中添加识别逻辑
5. 更新文档和示例

## 📝 注意事项

- 确保项目已安装 `@lobehub/icons` 包
- 某些图标可能不支持所有变体，会自动回退到默认变体
- OpenAI 图标比较特殊，只支持 `Avatar` 变体
- 图标组件是 React 组件，不能在 `<select>` 等原生 HTML 元素中使用
