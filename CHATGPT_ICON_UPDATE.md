# ChatGPT 图标更新说明

## 更新内容

将 ChatGPT 图标从 PNG 格式改为 SVG 格式，并让图标颜色跟随配色方案变化。

## 修改的文件

### 1. `app/icons/chatgpt.svg`
- 将固定颜色 `#8bcae0` 改为使用 CSS 变量 `var(--primary, #3b82f6)`
- 将透明度从 `0.27` 改为 `1`，使图标更清晰
- 现在图标会自动使用当前配色方案的主色调

### 2. `app/components/exporter.tsx`
- 将导入从 `chatgpt.png` 改为 `chatgpt.svg`
- 将 `NextImage` 组件改为直接使用 SVG 组件
- 移除 `no-dark` 类，让图标可以跟随主题变化

**修改前：**
```tsx
import ChatGptIcon from "../icons/chatgpt.png";

<div className={clsx(styles["logo"], "no-dark")}>
  <NextImage
    src={ChatGptIcon.src}
    alt="logo"
    width={50}
    height={50}
  />
</div>
```

**修改后：**
```tsx
import ChatGptIcon from "../icons/chatgpt.svg";

<div className={clsx(styles["logo"])}>
  <ChatGptIcon width={50} height={50} />
</div>
```

### 3. `app/store/update.ts`
- 将导入从 `chatgpt.png` 改为 `chatgpt.svg`
- 通知图标会使用 SVG 格式

## 效果

### 配色跟随
图标颜色现在会根据当前选择的配色方案自动变化：

- **Default 配色**: 蓝色 (#3b82f6 / #60a5fa)
- **Ocean 配色**: 青色 (#0891b2 / #22d3ee)
- **Forest 配色**: 绿色 (#059669 / #34d399)
- **Sunset 配色**: 橙色 (#f97316 / #fb923c)
- **Purple 配色**: 紫色 (#9333ea / #a855f7)
- **Rose 配色**: 玫瑰红 (#e11d48 / #fb7185)

### 主题跟随
- Light 模式：使用配色方案的 light 版本
- Dark 模式：使用配色方案的 dark 版本

## 优势

1. **矢量图形**: SVG 是矢量格式，在任何分辨率下都清晰
2. **体积更小**: SVG 文件通常比 PNG 小
3. **动态配色**: 可以通过 CSS 变量动态改变颜色
4. **主题一致性**: 图标颜色与整体配色方案保持一致
5. **易于维护**: 只需修改 CSS 变量即可改变所有图标颜色

## 测试

1. 切换不同的配色方案，观察图标颜色变化
2. 切换 light/dark 主题，观察图标颜色适配
3. 导出对话时，查看预览中的图标显示

## 注意事项

- SVG 图标使用 `var(--primary)` CSS 变量
- 如果 CSS 变量未定义，会回退到默认蓝色 `#3b82f6`
- 图标在导出预览和通知中都会使用新的 SVG 格式
