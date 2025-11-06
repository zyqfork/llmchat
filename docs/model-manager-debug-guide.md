# 模型管理器调试指南

## 问题描述

添加新模型后，之前添加的模型消失了。

## 已实施的修复

### 修复 1: 移除回调函数中的 return

**问题**: 在 `accessStore.update` 回调中使用 `return` 不会阻止外层函数执行。

**解决**: 将检查逻辑移到 `update` 调用之前。

### 修复 2: 使用 Zustand selector

**问题**: 直接访问 `accessStore.customModels` 可能不会触发 React 重新渲染。

**解决**: 使用 `useAccessStore((state) => state.customModels)` 来订阅状态变化。

```typescript
// ❌ 错误方式
const accessStore = useAccessStore();
// ... 在 useMemo 中使用 accessStore.customModels

// ✅ 正确方式
const customModels = useAccessStore((state) => state.customModels);
// ... 在 useMemo 中使用 customModels
```

## 调试步骤

### 1. 打开浏览器开发者工具

按 F12 打开开发者工具，切换到 Console 标签页。

### 2. 添加第一个模型

1. 在模型管理界面点击 "+" 添加模型
2. 输入模型 ID，例如：`qwen-test-1`
3. 点击"添加模型"
4. 查看控制台输出：

```
[ModelManager] 添加模型前: {
  currentCustomModels: "",
  existingModels: [],
  newModel: "qwen-test-1@alibaba",
  newCustomModels: "qwen-test-1@alibaba"
}
[ModelManager] 更新后的 customModels: "qwen-test-1@alibaba"
[ModelManager] 重新计算 providerModels: {
  provider: "alibaba",
  customModels: "qwen-test-1@alibaba",
  apiModelsCount: 0
}
```

### 3. 添加第二个模型

1. 再次点击 "+" 添加模型
2. 输入模型 ID，例如：`qwen-test-2`
3. 点击"添加模型"
4. 查看控制台输出：

```
[ModelManager] 添加模型前: {
  currentCustomModels: "qwen-test-1@alibaba",
  existingModels: ["qwen-test-1@alibaba"],
  newModel: "qwen-test-2@alibaba",
  newCustomModels: "qwen-test-1@alibaba,qwen-test-2@alibaba"
}
[ModelManager] 更新后的 customModels: "qwen-test-1@alibaba,qwen-test-2@alibaba"
[ModelManager] 重新计算 providerModels: {
  provider: "alibaba",
  customModels: "qwen-test-1@alibaba,qwen-test-2@alibaba",
  apiModelsCount: 0
}
```

### 4. 验证模型列表

检查界面上是否显示两个模型：
- ✅ qwen-test-1
- ✅ qwen-test-2

## 可能的问题场景

### 场景 1: customModels 没有更新

**症状**: 
```
[ModelManager] 添加模型前: {
  currentCustomModels: "",  // ❌ 应该包含之前的模型
  ...
}
```

**原因**: `customModels` selector 没有正确订阅状态变化。

**解决**: 确认使用了 `useAccessStore((state) => state.customModels)`。

### 场景 2: providerModels 没有重新计算

**症状**: 添加模型后没有看到 `[ModelManager] 重新计算 providerModels` 日志。

**原因**: `useMemo` 的依赖数组不正确。

**解决**: 确认依赖数组包含 `customModels`。

### 场景 3: 模型被覆盖

**症状**:
```
[ModelManager] 添加模型前: {
  currentCustomModels: "qwen-test-1@alibaba",
  existingModels: ["qwen-test-1@alibaba"],
  newModel: "qwen-test-2@alibaba",
  newCustomModels: "qwen-test-2@alibaba"  // ❌ 缺少第一个模型
}
```

**原因**: `existingModels` 数组处理有问题。

**解决**: 检查 `split` 和 `filter` 逻辑。

### 场景 4: localStorage 问题

**症状**: 刷新页面后模型消失。

**检查**: 
1. 打开 Application 标签页
2. 展开 Local Storage
3. 查看对应域名下的数据
4. 找到 `access-control` 键
5. 检查 `customModels` 字段的值

**解决**: 如果 localStorage 中的值不正确，可能是持久化有问题。

## 手动测试清单

- [ ] 添加第一个模型，验证显示正确
- [ ] 添加第二个模型，验证两个模型都显示
- [ ] 添加第三个模型，验证三个模型都显示
- [ ] 刷新页面，验证所有模型仍然存在
- [ ] 尝试添加重复模型，验证提示"该模型已存在"
- [ ] 删除一个模型，验证其他模型不受影响
- [ ] 在不同服务商中添加模型，验证互不影响

## 清理测试数据

如果需要清理测试数据：

1. 打开浏览器开发者工具
2. 切换到 Console 标签页
3. 执行以下代码：

```javascript
// 清空所有自定义模型
localStorage.removeItem('access-control');
// 或者只清空自定义模型
const data = JSON.parse(localStorage.getItem('access-control') || '{}');
data.state.customModels = '';
localStorage.setItem('access-control', JSON.stringify(data));
// 刷新页面
location.reload();
```

## 报告问题

如果问题仍然存在，请提供以下信息：

1. **控制台日志**: 复制所有 `[ModelManager]` 开头的日志
2. **localStorage 数据**: 
   ```javascript
   console.log(localStorage.getItem('access-control'));
   ```
3. **操作步骤**: 详细描述你的操作步骤
4. **预期结果**: 你期望看到什么
5. **实际结果**: 实际发生了什么
6. **浏览器信息**: 浏览器类型和版本

## 临时解决方案

如果问题紧急，可以使用以下临时方案：

### 方案 1: 手动编辑 localStorage

1. 打开开发者工具 → Application → Local Storage
2. 找到 `access-control` 键
3. 编辑 `customModels` 字段，手动添加模型
4. 格式：`model1@provider,model2@provider`
5. 刷新页面

### 方案 2: 使用配置文件

如果支持配置文件导入，可以：
1. 导出当前配置
2. 手动编辑 JSON 文件
3. 重新导入配置

## 下一步

如果以上修复仍然无法解决问题，可能需要：

1. 检查 Zustand store 的持久化配置
2. 检查是否有其他地方修改了 `customModels`
3. 检查是否有竞态条件
4. 考虑使用 Zustand 的 devtools 进行深度调试
