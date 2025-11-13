# 对话钉选功能说明

## 功能概述
新增了对话钉选功能，允许用户通过长按对话项来钉选/取消钉选对话。

## 功能特性

### 1. 长按钉选/取消钉选
- 长按对话列表项 1 秒，可以切换对话的钉选状态
- 支持鼠标和触摸操作
- 长按期间如果移开鼠标/手指，操作会被取消
- 按住过程中会显示视觉反馈（边框高亮、背景色变化、轻微缩放）

### 2. 视觉反馈
- 钉选的对话会显示特殊的边框颜色（主题色）
- 钉选的对话背景色会有轻微的主题色透明度
- 右上角的删除按钮会变成钉子图标
- 钉子图标不可点击（cursor: not-allowed）

### 3. 删除保护
- 已钉选的对话无法被删除
- 尝试删除钉选对话时会显示提示："无法删除已钉选的对话，请先取消钉选"
- 必须先取消钉选才能删除对话

## 实现细节

### 数据结构变更
在 `ChatSession` 接口中添加了 `pinned?: boolean` 字段：

```typescript
export interface ChatSession {
  id: string;
  topic: string;
  // ... 其他字段
  pinned?: boolean; // 钉选状态
  mask: Mask;
  // ...
}
```

### Store 方法
在 `useChatStore` 中添加了 `togglePinSession` 方法：

```typescript
togglePinSession(index: number) {
  set((state) => {
    const sessions = [...state.sessions];
    const session = sessions[index];
    if (session) {
      session.pinned = !session.pinned;
    }
    return { sessions };
  });
}
```

### 组件更新
`ChatItem` 组件新增：
- `pinned` 属性：显示钉选状态
- `onTogglePin` 回调：处理钉选切换
- 长按检测逻辑（2秒触发）
- 视觉状态切换

### 样式类
- `.chat-item-pinned`: 钉选对话的样式
- `.chat-item-pinned-icon`: 钉选图标的样式

## 使用方法

1. **钉选对话**：长按对话列表项 1 秒，对话会被钉选
   - 按住时会看到边框高亮和背景色变化
   - 1 秒后自动切换钉选状态
2. **取消钉选**：再次长按已钉选的对话 1 秒，取消钉选
3. **删除对话**：只有未钉选的对话才能被删除

## 语言支持

已添加中英文支持：
- 中文：`无法删除已钉选的对话，请先取消钉选`
- 英文：`Cannot delete pinned chat, please unpin it first`

## 注意事项

1. 长按操作不会触发对话的点击事件（选中对话）
2. 点击删除/钉选按钮区域不会触发长按
3. 钉选状态会持久化保存
4. 钉选的对话在列表中会有明显的视觉区分
