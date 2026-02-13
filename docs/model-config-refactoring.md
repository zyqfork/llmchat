# 模型配置重构说明

## 概述

将模型能力配置和上下文Token配置统一到 `app/config/model-config.ts` 文件中，基于自动生成的 `models-config.ts` 提供统一的配置接口。

## 变更内容

### 新增文件

- `app/config/model-config.ts` - 统一的模型配置管理文件

### 删除文件

- `app/config/model-capabilities.ts` - 已合并到 model-config.ts
- `app/config/model-context-tokens.ts` - 已合并到 model-config.ts

### 修改文件

所有导入旧配置文件的地方都已更新为导入新的 `model-config.ts`：

- `app/constant.ts`
- `app/config/tools.ts`
- `app/store/chat.ts`
- `app/store/config.ts`
- `app/store/mask.ts`
- `app/masks/index.ts`
- `app/components/chat.tsx`
- `app/components/mask.tsx`
- `app/components/model-config.tsx`
- `app/components/model-config-modal.tsx`
- `app/components/model-manager.tsx`
- `app/components/settings.tsx` (包括动态 require)
- `app/components/ui-lib.tsx`
- `app/constant.ts.backup`

## 新的配置结构

### 模型能力配置

```typescript
export interface ModelCapabilities {
  vision?: boolean; // 视觉能力
  web?: boolean; // 联网能力
  reasoning?: boolean; // 推理能力
  tools?: boolean; // 工具调用能力
  embedding?: boolean; // 嵌入能力
  thinkingType?: "gemini" | "claude"; // thinking实现类型
  reasoningField?: string; // 推理字段名
}
```

### 模型上下文配置

```typescript
export interface ModelContextConfig {
  contextTokens: number; // 上下文窗口大小
  maxOutputTokens?: number; // 最大输出Token数
  description?: string; // 模型描述
}
```

## 主要函数

### 模型能力相关

- `getModelCapabilities(modelName: string): ModelCapabilities` - 获取模型能力
- `getEnhancedModelCapabilities(modelName: string): ModelCapabilities` - 获取增强的模型能力（包含启发式检测）
- `hasCapability(modelName: string, capability: keyof ModelCapabilities): boolean` - 检查模型是否有特定能力
- `isWebSearchModel(modelName: string): boolean` - 检测模型是否支持网络搜索

### 模型上下文相关

- `getModelContextTokens(modelName: string): ModelContextConfig | null` - 获取模型上下文Token数配置
- `saveCustomContextTokens(modelName: string, contextTokens: number): void` - 保存自定义上下文Token数配置
- `removeCustomContextTokens(modelName: string): void` - 删除自定义上下文Token数配置
- `formatTokenCount(tokens: number): string` - 格式化Token数显示
- `getModelCompressThreshold(modelName: string): number` - 根据模型的上下文Token数自动计算压缩阈值

## 数据来源

配置数据主要来自 `app/config/generated/models-config.ts`，该文件由构建脚本从 models.dev API 自动生成。

### 能力检测逻辑

1. **优先使用配置数据**：从 `models-config.ts` 中读取模型的 `reasoning`、`tool_call`、`modalities` 等字段
2. **启发式检测**：对于配置中不存在的模型，使用正则表达式进行启发式检测
3. **自定义配置**：支持通过 localStorage 保存用户自定义的模型配置

### 上下文Token数据

直接从 `models-config.ts` 中的 `limit.context` 和 `limit.output` 字段读取。

## 优势

1. **统一管理**：所有模型配置相关的逻辑集中在一个文件中
2. **自动同步**：基于自动生成的配置文件，模型信息会自动更新
3. **易于维护**：减少重复代码，降低维护成本
4. **向后兼容**：保持了原有的 API 接口，不影响现有代码

## 注意事项

- `models-config.ts` 是自动生成的文件，不要手动修改
- 如需添加新的辅助函数，请在 `model-config.ts` 中添加
- 自定义配置会保存在 localStorage 中，优先级高于默认配置
