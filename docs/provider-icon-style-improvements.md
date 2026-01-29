# 厂商图标样式优化

## 概述

对厂商图标系统进行了样式优化，提升了图标的视觉效果和用户体验。

## 主要改进

### 1. 图标尺寸优化

**之前**: 图标直接使用容器尺寸，可能显得过小
**现在**: 图标使用 `size * 0.85` 或 `size - 4` 的较大值，确保图标足够大但不会溢出

```typescript
const iconSize = Math.max(size * 0.85, size - 4);
```

### 2. 居中对齐改进

**之前**: 图标可能不够居中
**现在**: 使用 flexbox 布局确保完美居中

```typescript
style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}}
```

### 3. 统一容器样式

**新增**: `IconContainer` 组件，为所有图标提供统一的容器样式

```typescript
const IconContainer = React.memo(function IconContainer({
  children,
  size,
}: {
  children: React.ReactNode;
  size: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
});
```

### 4. 圆角优化

**之前**: 4px 圆角
**现在**: 6px 圆角，视觉效果更柔和

### 5. 图标适配改进

**新增属性**:
- `objectFit: "contain"` - 确保图标比例正确
- `maxWidth: "100%"` - 防止图标溢出
- `maxHeight: "100%"` - 防止图标溢出

### 6. 通用 AI 图标优化

**改进**:
- 更合适的字体大小：`Math.max(size * 0.4, 10)`
- 字体粗细调整：`fontWeight: "600"`
- 添加阴影效果：`boxShadow: "0 2px 4px rgba(0,0,0,0.1)"`

## 组件更新

### DynamicProviderIcon
- 添加了居中容器
- 优化了图标尺寸计算
- 改进了 fallback 样式

### ProviderIcon
- 所有传统图标都使用 `IconContainer` 包装
- 统一的样式处理

### ModelAvatar
- 本地 SVG 图标也添加了居中容器
- 优化了图标尺寸

### ModelProviderIcon
- 保持与其他组件一致的样式

## 视觉效果

### 之前
- 图标可能显得较小
- 居中效果不够理想
- 不同类型图标样式不统一

### 现在
- 图标尺寸更合适，视觉效果更好
- 完美居中对齐
- 统一的容器样式和圆角
- 更好的视觉层次感

## 兼容性

- 保持了所有现有 API 不变
- 向后兼容所有现有用法
- 默认启用新的样式优化

## 使用示例

```tsx
// 所有图标都会自动应用新的样式优化
<ProviderIcon provider="openai" size={24} />
<ProviderIcon provider="anthropic" size={32} />
<ModelProviderIcon provider="google" modelName="gemini-pro" size={40} />
```

新的样式优化让图标看起来更大、更居中、更美观！