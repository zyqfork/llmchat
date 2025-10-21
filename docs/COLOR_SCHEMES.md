# 配色方案功能说明

## 概述

LLMChat 现在支持多种配色方案，每种配色方案都有 light 和 dark 两种模式，让你可以根据个人喜好自定义界面颜色。

## 可用配色方案

### 1. Default（默认蓝调）
- **Light 模式**: 现代蓝色 (#3b82f6)
- **Dark 模式**: 浅蓝色 (#60a5fa)
- 适合日常使用的经典配色

### 2. Ocean（海洋蓝绿）
- **Light 模式**: 青色 (#0891b2)
- **Dark 模式**: 亮青色 (#22d3ee)
- 清新的海洋风格

### 3. Forest（森林绿）
- **Light 模式**: 翠绿色 (#059669)
- **Dark 模式**: 浅绿色 (#34d399)
- 自然舒适的绿色主题

### 4. Sunset（日落橙红）
- **Light 模式**: 橙色 (#f97316)
- **Dark 模式**: 浅橙色 (#fb923c)
- 温暖活力的橙色调

### 5. Purple（紫色梦幻）
- **Light 模式**: 紫色 (#9333ea)
- **Dark 模式**: 浅紫色 (#a855f7)
- 优雅神秘的紫色系

### 6. Rose（玫瑰粉）
- **Light 模式**: 玫瑰红 (#e11d48)
- **Dark 模式**: 浅粉色 (#fb7185)
- 柔和浪漫的粉色调

## 如何使用

1. 打开设置页面（点击左侧边栏的设置图标）
2. 在"外观"部分找到"配色方案"选项
3. 从下拉菜单中选择你喜欢的配色方案
4. 配色会立即应用到当前主题（light/dark/auto）

## 技术实现

### 配置存储
配色方案设置保存在 `app/store/config.ts` 中：
```typescript
colorScheme: ColorScheme.Default as ColorSchemeType
```

### CSS 变量
每个配色方案定义了以下 CSS 变量：
- `--primary`: 主色调
- `--primary-light`: 浅色变体
- `--primary-dark`: 深色变体
- `--success`: 成功状态颜色
- `--warning`: 警告状态颜色
- `--error`: 错误状态颜色
- `--info`: 信息状态颜色

### 样式文件
配色方案定义在 `app/styles/color-schemes.scss` 中，通过 CSS 类名应用：
```scss
.light.color-scheme-ocean { ... }
.dark.color-scheme-ocean { ... }
```

## 自定义配色方案

如果你想添加自己的配色方案：

1. 在 `app/constant.ts` 中添加新的枚举值：
```typescript
export enum ColorScheme {
  // ... 现有配色
  Custom = "custom",
}
```

2. 在 `app/styles/color-schemes.scss` 中定义配色：
```scss
@mixin color-scheme-custom-light {
  --primary: #your-color;
  --primary-light: #your-light-color;
  --primary-dark: #your-dark-color;
  // ... 其他颜色
}

@mixin color-scheme-custom-dark {
  // ... dark 模式配色
}

.light.color-scheme-custom {
  @include color-scheme-custom-light;
}

.dark.color-scheme-custom {
  @include color-scheme-custom-dark;
}
```

3. 在所有语言文件中添加翻译（`app/locales/*.ts`）：
```typescript
ColorScheme: {
  Options: {
    custom: "自定义名称",
  },
},
```

## 注意事项

- 配色方案会自动适配 light 和 dark 主题
- 切换主题时，配色方案会保持不变
- 配色设置会自动保存到本地存储
- 所有配色方案都经过精心设计，确保在两种模式下都有良好的可读性和对比度
