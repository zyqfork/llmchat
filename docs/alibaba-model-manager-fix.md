# 阿里云通义千问 - 模型管理问题修复

## 问题 1: URL 错误 ✅ 已修复

### 问题描述
请求 URL 错误：
```
❌ https://dashscope.aliyuncs.com/api/chat/completions
✅ https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

### 根本原因
环境变量 `ALIBABA_BASE_URL` 使用了旧的 DashScope API 地址。

### 修复方案
更新 `.env.example` 文件中的默认值：

```bash
# 旧值
ALIBABA_BASE_URL=https://dashscope.aliyuncs.com

# 新值（OpenAI 兼容模式）
ALIBABA_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 用户操作
如果你有 `.env` 文件，请更新其中的 `ALIBABA_BASE_URL`：

```bash
# 编辑 .env 文件
ALIBABA_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 如果使用新加坡地域
ALIBABA_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

**重要**: 修改后需要重启应用才能生效！

## 问题 2: 模型管理状态显示问题

### 问题描述
1. 添加模型后，图标没有变成"已添加"状态
2. 添加新模型时，旧模型消失

### 调试步骤

#### 步骤 1: 打开浏览器控制台
按 F12 打开开发者工具，切换到 Console 标签页。

#### 步骤 2: 添加第一个模型
1. 打开阿里云模型管理
2. 点击 "+" 添加模型
3. 输入模型 ID：`qwen-test-1`
4. 点击"添加模型"
5. 查看控制台输出

**预期输出**:
```javascript
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

#### 步骤 3: 添加第二个模型
1. 再次点击 "+" 添加模型
2. 输入模型 ID：`qwen-test-2`
3. 点击"添加模型"
4. 查看控制台输出

**预期输出**:
```javascript
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

#### 步骤 4: 验证模型列表
检查界面上是否显示两个模型：
- ✅ qwen-test-1
- ✅ qwen-test-2

### 可能的问题场景

#### 场景 A: customModels 没有更新
**症状**: 
```javascript
[ModelManager] 添加模型前: {
  currentCustomModels: "",  // ❌ 应该包含之前的模型
  ...
}
```

**原因**: Zustand selector 没有正确订阅状态变化。

**检查**: 
```typescript
// 确认使用了 selector
const customModels = useAccessStore((state) => state.customModels);
```

#### 场景 B: providerModels 没有重新计算
**症状**: 添加模型后没有看到 `[ModelManager] 重新计算 providerModels` 日志。

**原因**: `useMemo` 的依赖数组不正确。

**检查**:
```typescript
}, [
  provider,
  customModels,  // ✅ 必须包含
  apiModels,
  isCustomProvider,
  customProviderConfig,
]);
```

#### 场景 C: localStorage 数据损坏
**症状**: 刷新页面后模型消失。

**检查**:
1. 打开 Application 标签页
2. 展开 Local Storage
3. 查看 `access-control` 键
4. 检查 `customModels` 字段的值

**修复**:
```javascript
// 在控制台执行
const data = JSON.parse(localStorage.getItem('access-control') || '{}');
console.log('customModels:', data.state.customModels);

// 如果数据损坏，清空重试
localStorage.removeItem('access-control');
location.reload();
```

### 对比 OpenAI 模型管理

OpenAI 的模型管理工作正常，说明核心逻辑是正确的。阿里云应该使用相同的逻辑。

#### 检查点 1: Provider 名称
```typescript
// OpenAI
const providerForModel = "openai";
const modelWithProvider = `${modelId}@openai`;

// Alibaba
const providerForModel = "alibaba";
const modelWithProvider = `${modelId}@alibaba`;
```

#### 检查点 2: 模型过滤
```typescript
// 过滤出当前服务商的模型
const providerCustomModels = allModels.filter((model) => {
  if (!model.provider) return false;
  return (
    model.provider.providerName.toLowerCase() ===
    (provider as string).toLowerCase()
  );
});
```

**注意**: 确保 `provider` 参数传递正确：
- OpenAI: `ServiceProvider.OpenAI` = `"openai"`
- Alibaba: `ServiceProvider.Alibaba` = `"alibaba"`

### 临时解决方案

如果问题持续存在，可以尝试：

#### 方案 1: 清空缓存
```javascript
// 在浏览器控制台执行
localStorage.removeItem('access-control');
location.reload();
```

#### 方案 2: 手动编辑 localStorage
```javascript
// 1. 获取当前数据
const data = JSON.parse(localStorage.getItem('access-control') || '{}');

// 2. 手动添加模型
data.state.customModels = "qwen-test-1@alibaba,qwen-test-2@alibaba";

// 3. 保存回 localStorage
localStorage.setItem('access-control', JSON.stringify(data));

// 4. 刷新页面
location.reload();
```

#### 方案 3: 使用 OpenAI 模型管理作为参考
1. 打开 OpenAI 模型管理
2. 添加几个模型
3. 观察控制台日志
4. 对比阿里云的日志输出
5. 找出差异

### 代码审查清单

- [x] 使用 Zustand selector 订阅 `customModels`
- [x] `useMemo` 依赖数组包含 `customModels`
- [x] 在 `update` 之前检查模型是否存在
- [x] 正确拼接新的 `customModels` 字符串
- [x] 添加调试日志

### 已实施的修复

1. **使用 Zustand Selector** (已完成)
   ```typescript
   const customModels = useAccessStore((state) => state.customModels);
   ```

2. **更新依赖数组** (已完成)
   ```typescript
   }, [provider, customModels, apiModels, ...]);
   ```

3. **添加调试日志** (已完成)
   ```typescript
   console.log("[ModelManager] 添加模型前:", {...});
   console.log("[ModelManager] 更新后的 customModels:", ...);
   console.log("[ModelManager] 重新计算 providerModels:", {...});
   ```

### 下一步

1. **测试验证**
   - 按照调试步骤操作
   - 收集控制台日志
   - 确认问题是否解决

2. **如果问题仍然存在**
   - 提供完整的控制台日志
   - 提供 localStorage 中的 `access-control` 数据
   - 说明具体的操作步骤

3. **对比测试**
   - 在 OpenAI 模型管理中执行相同操作
   - 对比两者的日志输出
   - 找出差异点

## 总结

### 已修复
- ✅ URL 路径错误（更新 `.env.example`）
- ✅ Zustand 状态订阅（使用 selector）
- ✅ 添加调试日志

### 需要验证
- ⏳ 模型添加后状态显示是否正确
- ⏳ 多个模型是否都能正常显示
- ⏳ 刷新页面后模型是否保持

### 用户操作
1. 更新 `.env` 文件中的 `ALIBABA_BASE_URL`
2. 重启应用
3. 按照调试步骤测试模型管理
4. 如有问题，提供控制台日志
