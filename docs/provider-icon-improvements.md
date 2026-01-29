# 厂商图标系统改进

## 概述

将厂商图标系统重构为使用 `ServiceProvider` 配置中的图标 URL，实现统一的图标管理。

## 主要改进

### 1. 统一图标配置源

- **之前**: 图标分散在多个地方配置（硬编码的图标库、本地 SVG 文件等）
- **现在**: 所有图标都从 `ServiceProvider` 配置中的 `iconUrl` 字段获取

### 2. 动态图标加载

- 默认启用动态图标加载（`useDynamicIcon = true`）
- 优先使用 `ServiceProvider.iconUrl` 配置的图标
- 图标加载失败时自动降级到传统图标库

### 3. 改进的组件

#### `DynamicProviderIcon`
- 从 ServiceProvider 配置动态加载图标
- 支持错误处理和 fallback
- 统一的图标样式（4px 圆角）

#### `ProviderIcon`
- 默认启用动态图标
- 改进的厂商识别逻辑
- 更好的自定义厂商支持

#### `ModelProviderIcon`
- 模型管理页面专用
- 优先使用 ServiceProvider 图标
- fallback 到本地 SVG 图标

## 配置示例

```typescript
export const ServiceProvider = {
  OpenAI: {
    id: "openai",
    name: "OpenAI",
    iconUrl: "https://models.dev/logos/openai.svg", // 统一图标配置
    // ... 其他配置
  },
  // ... 其他厂商
};
```

## 使用方式

```tsx
// 基本使用（自动使用 ServiceProvider 图标）
<ProviderIcon provider="openai" size={24} />

// 模型管理页面
<ModelProviderIcon provider="openai" modelName="gpt-4" size={32} />

// 禁用动态图标（使用传统图标库）
<ProviderIcon provider="openai" useDynamicIcon={false} />
```

## 优势

1. **统一管理**: 所有厂商图标在一个地方配置
2. **易于维护**: 添加新厂商只需在 ServiceProvider 中配置
3. **自动降级**: 图标加载失败时自动使用 fallback
4. **性能优化**: 图标缓存和错误处理
5. **一致性**: 统一的图标样式和尺寸

## 向后兼容

- 保留了传统图标库作为 fallback
- 现有的图标调用方式继续有效
- 渐进式改进，不影响现有功能