# 配色方案功能更新说明

## 更新内容

为 LLMChat 添加了配色方案选择功能，用户现在可以在 light 和 dark 主题下选择不同的配色方案。

## 新增功能

### 1. 配色方案枚举
- 文件：`app/constant.ts`
- 新增 `ColorScheme` 枚举，包含 6 种配色方案：
  - Default（默认蓝调）
  - Ocean（海洋蓝绿）
  - Forest（森林绿）
  - Sunset（日落橙红）
  - Purple（紫色梦幻）
  - Rose（玫瑰粉）

### 2. 配置存储
- 文件：`app/store/config.ts`
- 在 `DEFAULT_CONFIG` 中添加 `colorScheme` 字段
- 默认值为 `ColorScheme.Default`

### 3. 样式系统
- 新文件：`app/styles/color-schemes.scss`
- 为每种配色方案定义了 light 和 dark 两种模式
- 通过 CSS 类名 `.color-scheme-{name}` 应用配色

### 4. 主题切换逻辑
- 文件：`app/components/home.tsx`
- 更新 `useSwitchTheme` 函数，支持动态切换配色方案
- 配色方案类名会随主题一起应用到 `document.body`

### 5. 设置界面
- 文件：`app/components/settings.tsx`
- 在设置页面添加"配色方案"选择器
- 位于"主题"选项下方

### 6. 多语言支持
- 更新了所有 18 种语言的本地化文件
- 文件：`app/locales/*.ts`
- 为每种语言添加了配色方案的翻译

## 修改的文件列表

### 核心文件
- `app/constant.ts` - 添加 ColorScheme 枚举
- `app/store/config.ts` - 添加配色配置
- `app/components/home.tsx` - 更新主题切换逻辑
- `app/components/settings.tsx` - 添加配色选择器

### 样式文件
- `app/styles/globals.scss` - 导入配色方案样式
- `app/styles/color-schemes.scss` - 新增配色方案定义

### 本地化文件（18个）
- `app/locales/cn.ts` - 简体中文
- `app/locales/en.ts` - 英语
- `app/locales/tw.ts` - 繁体中文
- `app/locales/jp.ts` - 日语
- `app/locales/ko.ts` - 韩语
- `app/locales/ar.ts` - 阿拉伯语
- `app/locales/bn.ts` - 孟加拉语
- `app/locales/cs.ts` - 捷克语
- `app/locales/da.ts` - 丹麦语
- `app/locales/de.ts` - 德语
- `app/locales/es.ts` - 西班牙语
- `app/locales/fr.ts` - 法语
- `app/locales/it.ts` - 意大利语
- `app/locales/pt.ts` - 葡萄牙语
- `app/locales/ru.ts` - 俄语
- `app/locales/tr.ts` - 土耳其语
- `app/locales/vi.ts` - 越南语

### 文档
- `docs/COLOR_SCHEMES.md` - 配色方案使用文档

## 使用方法

1. 启动应用
2. 进入设置页面
3. 找到"配色方案"选项
4. 选择喜欢的配色
5. 配色会立即应用并保存

## 技术特点

- ✅ 完全响应式，支持 light/dark 主题自动切换
- ✅ 配色设置持久化存储
- ✅ 支持 18 种语言
- ✅ 使用 CSS 变量，易于扩展
- ✅ 无需重启应用，即时生效
- ✅ 所有配色都经过精心设计，确保可读性

## 测试建议

1. 测试主题切换（light/dark/auto）
2. 测试配色方案切换
3. 测试配色在不同主题下的表现
4. 测试配置持久化
5. 测试多语言显示

## 后续扩展

如需添加更多配色方案，只需：
1. 在 `ColorScheme` 枚举中添加新值
2. 在 `color-schemes.scss` 中定义配色
3. 在所有语言文件中添加翻译
