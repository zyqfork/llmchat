# 架构简化计划

## 问题分析

当前架构存在大量重复代码：
- 每个厂商都有单独的 `app/api/[provider].ts` 文件
- 每个厂商都有单独的 `app/client/platforms/[provider].ts` 文件
- 这些文件做的事情基本相同，只是配置不同

## 解决方案

### 1. 统一架构
```
app/
├── api/
│   ├── chat/route.ts              # 统一聊天端点
│   ├── models/route.ts            # 统一模型列表端点
│   └── proxy/[provider]/[...path]/route.ts  # 通用代理端点
├── client/
│   ├── sdk-manager.ts             # SDK 实例管理 ✅
│   ├── unified-api.ts             # 统一 API 调用 ✅
│   ├── unified-client-api.ts      # 统一客户端 API ✅
│   └── api.ts                     # 客户端入口（简化）
└── constant.ts                    # 厂商配置 ✅
```

### 2. 可以删除的文件

#### API 层文件（重复功能）
- `app/api/openai.ts`
- `app/api/anthropic.ts`
- `app/api/google.ts`
- `app/api/alibaba.ts`
- `app/api/moonshotai.ts`
- `app/api/deepseek.ts`
- `app/api/xai.ts`
- `app/api/siliconflow.ts`
- `app/api/ollama-cloud.ts`
- `app/api/azure.ts`

#### Client Platform 文件（重复功能）
- `app/client/platforms/openai.ts`
- `app/client/platforms/anthropic.ts`
- `app/client/platforms/google-genai.ts`
- `app/client/platforms/alibaba.ts`
- `app/client/platforms/moonshot.ts`
- `app/client/platforms/deepseek.ts`
- `app/client/platforms/xai.ts`
- `app/client/platforms/siliconflow.ts`
- `app/client/platforms/ollama.ts`

### 3. 迁移步骤

#### 第一阶段：验证新架构
1. ✅ 创建 `app/client/sdk-manager.ts`
2. ✅ 创建 `app/client/unified-api.ts`
3. ✅ 创建 `app/api/chat/route.ts`
4. ✅ 创建 `app/api/proxy/[provider]/[...path]/route.ts`
5. ✅ 创建 `app/client/unified-client-api.ts`

#### 第二阶段：修改现有代码
1. 修改 `app/client/api.ts` 中的 `getClientApi` 函数
2. 更新所有调用 platform 特定 API 的地方
3. 测试所有厂商的功能

#### 第三阶段：清理旧代码
1. 删除所有 `app/api/[provider].ts` 文件
2. 删除所有 `app/client/platforms/[provider].ts` 文件
3. 清理相关的导入语句

### 4. 优势

1. **代码量减少**：从 20+ 个文件减少到 5 个核心文件
2. **维护简单**：添加新厂商只需要在 `constant.ts` 中添加配置
3. **一致性**：所有厂商使用相同的逻辑，减少 bug
4. **类型安全**：统一的类型定义，更好的 TypeScript 支持

### 5. 风险评估

1. **兼容性**：需要确保所有现有功能都能正常工作
2. **测试**：需要全面测试所有厂商的功能
3. **回滚**：保留旧文件直到新架构完全稳定

### 6. 实施建议

1. **渐进式迁移**：先让新旧架构并存，逐步迁移
2. **功能对等**：确保新架构支持所有现有功能
3. **充分测试**：每个厂商都要测试聊天、流式、工具调用等功能
4. **文档更新**：更新相关文档和注释

## 结论

这个简化方案可以大大减少代码重复，提高维护效率。核心思想是：
- **配置驱动**：通过配置文件定义厂商差异
- **统一接口**：所有厂商使用相同的调用接口
- **SDK 抽象**：利用 AI SDK 的统一抽象层