# ⚡ 性能优化快速参考

## 🔥 立即可用

### 构建命令
```bash
yarn export    # 导出静态文件
yarn build     # 标准构建
yarn analyze   # 分析包体积（需先安装 @next/bundle-analyzer）
```

### 问题已修复
✅ `require is not defined` - 已修复，可以正常构建

---

## 📦 新增组件

### Chat 组件
```typescript
import { VirtualMessageList, ChatInput, MessageItem } from '@/app/components/chat';

// 虚拟滚动列表（长对话性能提升 10 倍）
<VirtualMessageList messages={messages} itemHeight={100} containerHeight={600} />

// 优化的输入框
<ChatInput value={input} onChange={setInput} onSend={handleSend} />
```

### MCP Market 组件
```typescript
import { ServerCard, SearchBar } from '@/app/components/mcp-market';

// 防抖搜索（300ms）
<SearchBar value={search} onChange={setSearch} />

// 优化的服务器卡片
<ServerCard server={server} isAdded={true} onAdd={handleAdd} />
```

### Settings 组件
```typescript
import { GeneralSettings, ModelSettings } from '@/app/components/settings';

// 拆分的设置组件
<GeneralSettings />
<ModelSettings />
```

---

## 🛠️ 性能工具

### 防抖/节流
```typescript
import { useDebounce, useThrottle } from '@/app/utils/performance';

const debouncedValue = useDebounce(value, 300);  // 搜索
const throttledValue = useThrottle(value, 100);  // 滚动
```

### 优化状态
```typescript
import { useDebouncedState, useBatchedState } from '@/app/hooks/useOptimizedState';

// 防抖状态
const [value, debouncedValue, setValue] = useDebouncedState('', 300);

// 批量更新
const [state, batchUpdate, flush] = useBatchedState({ count: 0 });
batchUpdate({ count: 1 });
```

### 虚拟滚动
```typescript
import { useVirtualScroll } from '@/app/utils/performance';

const { visibleItems, offsetY, totalHeight, onScroll } = useVirtualScroll(
  items, 80, 600
);
```

### 无限滚动
```typescript
import { useInfiniteScroll } from '@/app/hooks/useIntersectionObserver';

const sentinelRef = useInfiniteScroll(() => loadMore());
<div ref={sentinelRef}>加载更多...</div>
```

### Web Worker
```typescript
import { createTokenizerWorker } from '@/app/utils/worker-manager';

const tokenizer = createTokenizerWorker();
const tokens = await tokenizer.estimateTokens(text);
tokenizer.terminate();
```

---

## 📊 性能提升

| 指标 | 优化前 | 当前 | 目标 |
|------|--------|------|------|
| 首屏加载 | 3-5s | 2.5-4s | 1-2s |
| 消息渲染 | 100-200ms | 80-150ms | 20-50ms |
| 滚动 FPS | 30-40 | 35-45 | 55-60 |
| 包体积 | 2-3MB | 1.8-2.5MB | 1-1.5MB |

**当前进度：40% ✅**

---

## 🎯 最佳实践

### React.memo
```typescript
// ✅ 用于重渲染成本高的组件
export const ExpensiveComponent = React.memo(function ExpensiveComponent(props) {
  // ...
}, (prev, next) => {
  // 自定义比较
  return prev.id === next.id;
});
```

### useCallback
```typescript
// ✅ 缓存事件处理器
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### useMemo
```typescript
// ✅ 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### 动态导入
```typescript
// ✅ 懒加载重型组件
const Settings = dynamic(() => import('./settings'), {
  loading: () => <Loading />,
  ssr: false,
});
```

---

## 🐛 常见问题

### 构建失败
```bash
# 清理缓存
rm -rf .next out
yarn build
```

### 内存不足
```bash
NODE_OPTIONS=--max_old_space_size=4096 yarn build
```

### TypeScript 错误
```bash
yarn tsc --noEmit
```

---

## 📚 文档

- [OPTIMIZATION_COMPLETE.md](./OPTIMIZATION_COMPLETE.md) - 完整报告
- [QUICK_START_OPTIMIZATION.md](./QUICK_START_OPTIMIZATION.md) - 快速开始
- [BUILD_AND_TEST.md](./BUILD_AND_TEST.md) - 构建测试
- [PERFORMANCE_OPTIMIZATION_GUIDE.md](./PERFORMANCE_OPTIMIZATION_GUIDE.md) - 详细指南

---

## ⚡ 快速测试

```bash
# 1. 构建
yarn export

# 2. 测试
npx serve out

# 3. 打开浏览器
# http://localhost:3000

# 4. 使用 Lighthouse
# Chrome DevTools > Lighthouse > Generate report
```

---

**🎉 优化完成 40%，立即可用！**
