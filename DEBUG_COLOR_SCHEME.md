# 配色方案调试指南

## 问题排查步骤

### 1. 检查浏览器开发者工具

打开浏览器开发者工具（F12），在 Console 中运行以下命令：

```javascript
// 检查 body 上的类名
console.log('Body classes:', document.body.className);

// 检查当前的 CSS 变量值
const styles = getComputedStyle(document.body);
console.log('Primary color:', styles.getPropertyValue('--primary'));
console.log('Primary light:', styles.getPropertyValue('--primary-light'));
console.log('Primary dark:', styles.getPropertyValue('--primary-dark'));

// 检查配置
const config = localStorage.getItem('app-config');
console.log('Config:', JSON.parse(config));
```

### 2. 预期的类名组合

根据你的设置，body 元素应该有以下类名组合：

- **Light + Default**: `light color-scheme-default`
- **Light + Ocean**: `light color-scheme-ocean`
- **Light + Forest**: `light color-scheme-forest`
- **Light + Sunset**: `light color-scheme-sunset`
- **Light + Purple**: `light color-scheme-purple`
- **Light + Rose**: `light color-scheme-rose`

- **Dark + Default**: `dark color-scheme-default`
- **Dark + Ocean**: `dark color-scheme-ocean`
- 等等...

### 3. 预期的颜色值

#### Default 配色
- Light 模式: `--primary: #3b82f6` (蓝色)
- Dark 模式: `--primary: #60a5fa` (浅蓝色)

#### Ocean 配色
- Light 模式: `--primary: #0891b2` (青色)
- Dark 模式: `--primary: #22d3ee` (亮青色)

#### Forest 配色
- Light 模式: `--primary: #059669` (绿色)
- Dark 模式: `--primary: #34d399` (浅绿色)

#### Sunset 配色
- Light 模式: `--primary: #f97316` (橙色)
- Dark 模式: `--primary: #fb923c` (浅橙色)

#### Purple 配色
- Light 模式: `--primary: #9333ea` (紫色)
- Dark 模式: `--primary: #a855f7` (浅紫色)

#### Rose 配色
- Light 模式: `--primary: #e11d48` (玫瑰红)
- Dark 模式: `--primary: #fb7185` (浅粉色)

### 4. 手动测试

在浏览器控制台中手动添加类名测试：

```javascript
// 清除所有配色类
document.body.classList.remove(
  'color-scheme-default',
  'color-scheme-ocean',
  'color-scheme-forest',
  'color-scheme-sunset',
  'color-scheme-purple',
  'color-scheme-rose'
);

// 添加 ocean 配色
document.body.classList.add('color-scheme-ocean');

// 检查颜色是否改变
const styles = getComputedStyle(document.body);
console.log('Primary color:', styles.getPropertyValue('--primary'));
```

### 5. 清除缓存

如果样式没有更新，尝试：

1. 硬刷新页面（Ctrl + Shift + R 或 Cmd + Shift + R）
2. 清除浏览器缓存
3. 重启开发服务器

### 6. 检查 CSS 是否加载

在开发者工具的 Network 标签中：
1. 刷新页面
2. 查找 `color-schemes.scss` 或相关的 CSS 文件
3. 确认文件已成功加载
4. 查看文件内容，确认配色方案的样式存在

### 7. 检查 CSS 优先级

在开发者工具的 Elements 标签中：
1. 选中 body 元素
2. 查看 Styles 面板
3. 找到 `--primary` 变量
4. 查看是否有其他样式覆盖了配色方案的样式

### 8. 常见问题

#### 问题1: 配色没有变化
**原因**: CSS 文件可能没有重新编译
**解决**: 重启开发服务器

#### 问题2: 类名没有添加到 body
**原因**: React 状态没有更新
**解决**: 检查 localStorage 中的配置，手动修改后刷新页面

#### 问题3: 颜色显示不正确
**原因**: CSS 变量被其他样式覆盖
**解决**: 检查 CSS 优先级，确保配色方案样式在最后加载

### 9. 验证配置是否保存

```javascript
// 查看当前配置
const configStr = localStorage.getItem('app-config');
const config = JSON.parse(configStr);
console.log('Current colorScheme:', config.colorScheme);

// 手动设置配色
config.colorScheme = 'ocean';
localStorage.setItem('app-config', JSON.stringify(config));
// 刷新页面查看效果
```

### 10. 如果以上都不行

请提供以下信息：
1. 浏览器控制台的 body.className 输出
2. --primary CSS 变量的实际值
3. localStorage 中的 app-config 内容
4. 浏览器和版本信息
