# 多模型功能重构说明

## 概述
本次重构优化了多模型功能的用户体验，主要改进包括：

1. **简化多模型开启流程**：点击多模型按钮直接打开模型选择弹窗
2. **增强Token统计显示**：支持多模型模式下横向显示所有模型的Token统计
3. **保持并发请求支持**：多模型回复继续支持并发请求（已有功能）

## 主要修改

### 1. 多模型按钮行为优化 (`app/components/chat.tsx`)

#### 修改前
- 点击多模型按钮：切换开启/关闭状态
- 需要先开启，再点击右下角模型选择器选择模型

#### 修改后
- **未开启状态**：点击按钮 → 自动临时启用多模型模式 → 打开多选模型选择弹窗
- **已开启状态**：点击按钮关闭多模型模式

```typescript
const MultiModelAction = ({ 
  onToggle, 
  onOpenSelector 
}: { 
  onToggle: () => void;
  onOpenSelector: () => void;
}) => {
  // ...
  const handleClick = () => {
    if (isEnabled) {
      // 如果已启用，点击关闭多模型模式
      onToggle();
    } else {
      // 如果未启用，先临时启用多模型模式，然后打开模型选择器
      chatStore.updateTargetSession(session, (session) => {
        if (!session.multiModelMode) {
          session.multiModelMode = {
            enabled: true,
            selectedModels: [],
            // ...
          };
        } else {
          session.multiModelMode.enabled = true;
        }
      });
      onOpenSelector();
    }
  };
  // ...
};
```

#### 自动关闭逻辑
如果用户打开选择器后没有选择至少2个模型就关闭了，会自动关闭多模型模式：

```typescript
onClose={() => {
  props.setShowModelSelector(false);
  // 如果用户没有选择至少2个模型，自动关闭多模型模式
  if ((session.multiModelMode?.selectedModels?.length || 0) < 2) {
    chatStore.updateTargetSession(session, (session) => {
      if (session.multiModelMode) {
        session.multiModelMode.enabled = false;
        session.multiModelMode.selectedModels = [];
      }
    });
  }
}}
```

### 2. Token统计组件增强 (`app/components/chat.tsx`)

#### 新增功能
- **多模型检测**：自动检测当前是否为多模型模式
- **横向显示**：多模型模式下，鼠标悬停显示所有模型的Token统计
- **独立统计**：每个模型显示独立的Token使用量、上下文大小和使用率

#### 实现细节
```typescript
// 多模型模式下的Token统计
const multiModelStats = isMultiModel
  ? multiModelMode.selectedModels.map((modelKey) => {
      const [modelName] = modelKey.split("@");
      const modelMessages = multiModelMode.modelMessages[modelKey] || [];
      const modelUsedTokens = modelMessages.reduce(...);
      const modelContextConfig = getModelContextTokens(modelName);
      const modelMaxTokens = modelContextConfig?.contextTokens;
      const modelProgressPercentage = modelMaxTokens ? (modelUsedTokens / modelMaxTokens) * 100 : 0;
      
      return {
        modelKey,
        modelName,
        usedTokens: modelUsedTokens,
        maxTokens: modelMaxTokens,
        progressPercentage: modelProgressPercentage,
      };
    })
  : [];
```

#### 显示效果
- **单模型模式**：显示 `128K/1M` 格式的Token统计
- **多模型模式**：显示 `3 模型`，鼠标悬停显示详细统计

### 3. 样式增强 (`app/components/chat.module.scss`)

新增样式类：

```scss
// 多模型Token统计样式
.token-counter-tooltip-multi {
  min-width: 400px;
  max-width: 600px;
}

.multi-model-token-stats {
  display: flex;
  gap: 16px;
  padding: 4px;
}

.model-token-stat {
  flex: 1;
  min-width: 120px;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--hover-color);
  border: 1px solid var(--border-in-light);
}

// 移动端适配
@media only screen and (max-width: 600px) {
  .multi-model-token-stats {
    flex-direction: column;
    gap: 12px;
  }
}
```

### 4. 本地化文本更新

在 `app/locales/cn.ts` 和 `app/locales/en.ts` 中添加：

```typescript
MultiModel: {
  // ...
  Models: "模型", // 中文
  Models: "models", // 英文
  // ...
}
```

### 5. 多模型切换逻辑优化 (`app/components/chat.tsx`)

```typescript
const toggleMultiModelMode = () => {
  chatStore.updateTargetSession(session, (session) => {
    // ...
    const wasEnabled = session.multiModelMode.enabled;
    
    // 如果当前是启用状态，点击则关闭
    if (wasEnabled) {
      session.multiModelMode.enabled = false;
      session.multiModelMode.selectedModels = [];
      // 清空所有模型数据
      showToast(Locale.Chat.MultiModel.DisableToast);
    }
    // 如果当前是关闭状态，不在这里启用，而是打开模型选择器
  });
};
```

## 用户体验改进

### 开启多模型流程

**修改前**：
1. 点击多模型按钮（开启状态）
2. 点击右下角模型选择器
3. 选择多个模型
4. 确认

**修改后**：
1. 点击多模型按钮（直接打开选择器）
2. 选择多个模型（最多4个）
3. 确认（自动开启多模型模式）

### Token统计显示

**单模型模式**：
```
鼠标悬停显示：
┌─────────────────────┐
│ 上下文: 10 / 20     │
│ 当前Token: 1.2K/128K│
│ Token使用率: 0.9%   │
│ ████░░░░░░░░░░░░░░  │
└─────────────────────┘
```

**多模型模式**：
```
鼠标悬停显示：
┌──────────────────────────────────────────────────┐
│ ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│ │gpt-4o   │  │claude-3 │  │gemini-2 │           │
│ │1.2K/128K│  │800/200K │  │1.5K/1M  │           │
│ │0.9%     │  │0.4%     │  │0.15%    │           │
│ │████░░░░ │  │██░░░░░░ │  │█░░░░░░░ │           │
│ └─────────┘  └─────────┘  └─────────┘           │
└──────────────────────────────────────────────────┘
```

## 技术细节

### 并发请求支持
多模型回复已经支持并发请求（原有功能），在 `app/store/chat.ts` 的 `onMultiModelUserInput` 方法中实现：

```typescript
// 为每个模型发送请求，使用独立的错误处理
const promises = multiModelMode.selectedModels.map(async (modelKey) => {
  // 每个模型独立请求
  await api.llm.chat({...});
});

// 并发执行所有请求
await Promise.allSettled(promises);
```

### 响应式设计
- **桌面端**：Token统计横向排列，最多显示4个模型
- **移动端**：Token统计纵向排列，自适应屏幕宽度

## 未来改进方向

1. **横向排列聊天界面**：
   - 当前多模型回复仍然是纵向排列
   - 可以考虑添加横向排列选项，类似竞技场模式
   - 需要重构消息渲染逻辑

2. **模型数量限制**：
   - 当前在模型选择器中限制最多选择4个模型
   - 可以在UI中添加更明显的提示

3. **性能优化**：
   - 大量模型同时回复时的性能优化
   - 流式更新的优化

## 测试建议

1. **功能测试**：
   - 测试多模型按钮的开启/关闭流程
   - 测试Token统计在单模型和多模型模式下的显示
   - 测试选择2-4个模型的场景

2. **兼容性测试**：
   - 测试移动端和桌面端的显示效果
   - 测试不同浏览器的兼容性

3. **性能测试**：
   - 测试4个模型同时回复的性能
   - 测试长对话场景下的Token统计性能

## 文件修改清单

- ✅ `app/components/chat.tsx` - 多模型按钮、Token统计组件
- ✅ `app/components/chat.module.scss` - 样式增强
- ✅ `app/locales/cn.ts` - 中文本地化
- ✅ `app/locales/en.ts` - 英文本地化
- ⚠️ 其他语言文件需要添加 `Models` 字段

## 注意事项

1. 其他语言的本地化文件（如 `jp.ts`, `tw.ts` 等）也需要添加 `Models` 字段
2. 多模型消息的横向排列功能需要进一步开发
3. 当前实现保持了与原有代码的兼容性，不影响单模型模式的使用


## 补充说明 - 多选模型选择器增强

### 新增功能

#### 1. 最多选择4个模型限制
- 选择第5个模型时会弹出提示："最多只能选择4个模型"
- 已选择4个模型时，未选中的模型会自动显示为禁用状态（灰色）
- 鼠标悬停在禁用的模型上会显示提示："最多只能选择4个模型"

#### 2. 标题显示优化
- 显示格式：`选择多个模型 (2/4 个已选择)`
- 实时显示当前选择数量和最大限制（4个）

#### 3. 自动关闭多模型模式
- 如果用户打开选择器后没有选择至少2个模型就关闭了选择器
- 系统会自动关闭多模型模式，恢复到单模型状态

### 代码实现

```typescript
// app/components/ui-lib.tsx
const handleSelection = (value: T) => {
  if (selectedValues.includes(value)) {
    // 取消选择
    const newSelectedValues = selectedValues.filter((v) => v !== value);
    setSelectedValues(newSelectedValues);
  } else {
    // 添加选择，但最多4个
    if (selectedValues.length >= 4) {
      showToast("最多只能选择4个模型");
      return;
    }
    const newSelectedValues = [...selectedValues, value];
    setSelectedValues(newSelectedValues);
  }
};

// 渲染时检查是否达到最大选择数
const isMaxSelected = selectedValues.length >= 4 && !selected;
```

### 完整的用户流程

1. **点击多模型按钮**
   - 系统自动临时启用多模型模式
   - 打开多选模型选择器

2. **选择模型**
   - 可以选择2-4个模型
   - 选择第5个时会提示限制
   - 已选择的模型显示勾选标记

3. **确认或取消**
   - **点击"确认选择"**：正式启用多模型模式，开始多模型对话
   - **点击"X"关闭或点击外部区域**：
     - 如果选择了至少2个模型：保持多模型模式
     - 如果选择少于2个模型：自动关闭多模型模式

4. **关闭多模型**
   - 再次点击多模型按钮即可关闭
   - 清空所有选择的模型和数据
