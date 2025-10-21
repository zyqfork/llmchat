# 配色方案不生效 - 快速修复指南

## 最可能的原因和解决方案

### 方案1: 重启开发服务器（最常见）

SCSS 文件修改后需要重新编译。请执行以下步骤：

1. 停止当前的开发服务器（Ctrl+C）
2. 重新启动：`npm run dev` 或 `yarn dev`
3. 清除浏览器缓存并硬刷新（Ctrl+Shift+R）

### 方案2: 清除浏览器缓存和本地存储

```javascript
// 在浏览器控制台执行
localStorage.clear();
location.reload();
```

然后重新进入设置页面，选择配色方案。

### 方案3: 手动验证配色是否加载

在浏览器控制台执行：

```javascript
// 1. 检查body类名
console.log('Body classes:', document.body.className);
// 应该看到类似: "light color-scheme-default" 或 "dark color-scheme-ocean"

// 2. 手动添加配色类测试
document.body.classList.add('color-scheme-ocean');

// 3. 检查CSS变量
const styles = getComputedStyle(document.body);
console.log('Primary:', styles.getPropertyValue('--primary'));
// Ocean配色在light模式应该是: #0891b2
// Ocean配色在dark模式应该是: #22d3ee
```

### 方案4: 检查配置是否保存

```javascript
// 查看配置
const config = JSON.parse(localStorage.getItem('app-config'));
console.log('Color Scheme:', config.colorScheme);

// 如果是 undefined，手动设置
config.colorScheme = 'ocean';
localStorage.setItem('app-config', JSON.stringify(config));
location.reload();
```

### 方案5: 使用测试页面验证

打开项目根目录的 `test-color-scheme.html` 文件：

1. 在浏览器中打开这个文件
2. 切换不同的配色方案
3. 观察颜色是否变化

如果测试页面可以正常切换颜色，说明CSS是正确的，问题在于应用的集成。

### 方案6: 检查CSS文件是否正确编译

1. 打开浏览器开发者工具
2. 进入 Network 标签
3. 刷新页面
4. 搜索 "globals" 或 "color-scheme"
5. 查看CSS文件内容，确认配色方案的样式存在

### 方案7: 强制重新编译所有样式

```bash
# 删除 .next 缓存目录
rm -rf .next

# 或在 Windows 上
rmdir /s /q .next

# 重新启动
npm run dev
```

## 验证配色是否工作的快速测试

在浏览器控制台运行这个完整的测试脚本：

```javascript
// 完整测试脚本
(function testColorScheme() {
  console.log('=== 配色方案测试 ===');
  
  // 1. 当前状态
  console.log('1. Body classes:', document.body.className);
  
  // 2. 当前配置
  const config = JSON.parse(localStorage.getItem('app-config') || '{}');
  console.log('2. Config colorScheme:', config.colorScheme);
  console.log('   Config theme:', config.theme);
  
  // 3. 当前CSS变量
  const styles = getComputedStyle(document.body);
  console.log('3. CSS Variables:');
  console.log('   --primary:', styles.getPropertyValue('--primary'));
  console.log('   --primary-light:', styles.getPropertyValue('--primary-light'));
  console.log('   --primary-dark:', styles.getPropertyValue('--primary-dark'));
  
  // 4. 测试切换配色
  console.log('4. 测试切换到 Ocean 配色...');
  document.body.classList.remove(
    'color-scheme-default',
    'color-scheme-ocean',
    'color-scheme-forest',
    'color-scheme-sunset',
    'color-scheme-purple',
    'color-scheme-rose'
  );
  document.body.classList.add('color-scheme-ocean');
  
  const newStyles = getComputedStyle(document.body);
  console.log('   切换后 --primary:', newStyles.getPropertyValue('--primary'));
  console.log('   预期值 (light): #0891b2');
  console.log('   预期值 (dark): #22d3ee');
  
  // 5. 结果
  const currentPrimary = newStyles.getPropertyValue('--primary').trim();
  const isLight = document.body.classList.contains('light');
  const isDark = document.body.classList.contains('dark');
  const expectedLight = '#0891b2';
  const expectedDark = '#22d3ee';
  
  if (isLight && currentPrimary === expectedLight) {
    console.log('✅ 配色方案工作正常 (Light模式)');
  } else if (isDark && currentPrimary === expectedDark) {
    console.log('✅ 配色方案工作正常 (Dark模式)');
  } else {
    console.log('❌ 配色方案未生效');
    console.log('   当前主题:', isLight ? 'light' : isDark ? 'dark' : 'unknown');
    console.log('   当前颜色:', currentPrimary);
    console.log('   预期颜色:', isLight ? expectedLight : expectedDark);
  }
  
  console.log('=== 测试完成 ===');
})();
```

## 如果以上都不行

请提供以下信息以便进一步诊断：

1. 运行上面的测试脚本，复制完整输出
2. 浏览器和版本（如：Chrome 120）
3. 操作系统（如：Windows 11）
4. 开发服务器是否有报错信息
5. Network 标签中是否能找到 color-schemes 相关的CSS

## 临时解决方案

如果急需使用配色功能，可以在浏览器控制台手动设置：

```javascript
// 手动设置配色（临时）
function setColorScheme(scheme) {
  // scheme 可以是: default, ocean, forest, sunset, purple, rose
  document.body.classList.remove(
    'color-scheme-default',
    'color-scheme-ocean',
    'color-scheme-forest',
    'color-scheme-sunset',
    'color-scheme-purple',
    'color-scheme-rose'
  );
  document.body.classList.add(`color-scheme-${scheme}`);
  console.log('已切换到:', scheme);
}

// 使用示例
setColorScheme('ocean');  // 切换到海洋配色
setColorScheme('forest'); // 切换到森林配色
```
