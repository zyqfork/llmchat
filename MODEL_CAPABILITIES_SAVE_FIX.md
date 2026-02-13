# 模型能力保存修复说明

## 问题描述

用户在模型管理界面手动修改模型能力后，无法保存配置。再次打开配置界面时，修改的内容会恢复到原始状态。

## 问题原因

虽然代码已经实现了将用户修改保存到 `localStorage` 的逻辑，但存在以下问题：

1. 保存时只保存了三个基本能力字段（vision, reasoning, tools），没有保留 `reasoningField` 字段
2. 缺少统一的保存和读取函数，导致代码分散且不易维护

## 解决方案

### 1. 添加统一的保存函数 (`app/config/model-config.ts`)

新增两个函数来统一管理模型能力的保存和删除：

```typescript
/**
 * 保存自定义模型能力配置
 * @param modelName 模型名称
 * @param capabilities 模型能力配置
 */
export function saveCustomModelCapabilities(
  modelName: string,
  capabilities: Partial<ModelCapabilities>,
): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_capabilities_${modelName}`;
    localStorage.setItem(customKey, JSON.stringify(capabilities));
  }
}

/**
 * 删除自定义模型能力配置
 * @param modelName 模型名称
 */
export function removeCustomModelCapabilities(modelName: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const customKey = `model_capabilities_${modelName}`;
    localStorage.removeItem(customKey);
  }
}
```

### 2. 修改保存逻辑 (`app/components/model-manager.tsx`)

更新 `saveModelConfig` 函数，确保保存时保留 `reasoningField`：

```typescript
const saveModelConfig = () => {
  const modelName = modelConfigForm.modelId;
  const newCategory = (modelConfigForm.category || "").trim();

  // 获取当前从配置文件读取的能力（包括 reasoningField）
  const configCapabilities = getLocalModelCapabilities(modelName);

  // 合并用户修改的能力和配置文件中的 reasoningField
  const capabilitiesToSave: ModelCapabilities = {
    vision: modelConfigForm.capabilities.vision,
    reasoning: modelConfigForm.capabilities.reasoning,
    tools: modelConfigForm.capabilities.tools,
    // 保留 reasoningField（如果存在）
    ...(configCapabilities.reasoningField && {
      reasoningField: configCapabilities.reasoningField,
    }),
  };

  // 使用统一的保存函数
  saveCustomModelCapabilities(modelName, capabilitiesToSave);

  logger.debug("[ModelManager] 保存模型配置:", {
    modelName,
    capabilities: capabilitiesToSave,
  });

  // ... 其他保存逻辑
};
```

## 工作原理

### 配置优先级

`getModelCapabilities` 函数的读取优先级如下：

1. **用户自定义配置**（localStorage）- 最高优先级
2. **API 配置文件**（models-config.ts）
3. **启发式检测**（基于模型名称的正则匹配）

```typescript
export function getModelCapabilities(
  modelName: string,
  providerName?: string,
): ModelCapabilities {
  const model = findModelInConfig(modelName, providerName);

  if (!model) {
    // 如果配置中没有，使用启发式检测
    return getEnhancedModelCapabilities(modelName);
  }

  // 从配置文件读取基础能力
  const capabilities: ModelCapabilities = {
    vision: false,
    reasoning: false,
    tools: false,
  };

  // ... 从配置文件填充能力

  // 检查是否有自定义配置（用户修改的配置）
  if (typeof window !== "undefined" && window.localStorage) {
    const customKey = `model_capabilities_${modelName}`;
    try {
      const stored = window.localStorage.getItem(customKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ModelCapabilities>;
        // 用户配置覆盖默认配置
        return { ...capabilities, ...parsed };
      }
    } catch {
      // 静默处理解析错误
    }
  }

  return capabilities;
}
```

### 保存流程

1. 用户在模型管理界面修改模型能力
2. 点击保存按钮
3. 系统读取当前配置文件中的能力（包括 `reasoningField`）
4. 合并用户修改的能力和配置文件中的 `reasoningField`
5. 保存到 `localStorage`，key 为 `model_capabilities_${modelName}`
6. 下次读取时，用户配置会覆盖默认配置

### 数据存储格式

localStorage 中存储的数据格式：

```json
{
  "vision": true,
  "reasoning": false,
  "tools": true,
  "reasoningField": "reasoning_content"
}
```

## 测试步骤

1. 打开模型管理界面
2. 选择一个模型，点击配置按钮
3. 修改模型能力（如勾选/取消勾选视觉、推理、工具）
4. 点击保存
5. 关闭配置面板
6. 再次打开同一模型的配置面板
7. 验证修改的内容是否保留

## 注意事项

1. **reasoningField 的保留**：用户修改能力时，`reasoningField` 会自动从配置文件中读取并保留，不会丢失
2. **配置优先级**：用户自定义配置始终优先于 API 配置
3. **清除配置**：如果需要恢复默认配置，可以使用 `removeCustomModelCapabilities(modelName)` 函数
4. **浏览器兼容性**：配置保存依赖 localStorage，需要浏览器支持

## 相关文件

- `app/config/model-config.ts` - 模型配置管理
- `app/components/model-manager.tsx` - 模型管理界面
- `app/constant.ts` - 导出 `getModelCapabilities` 函数

## 后续优化建议

1. 添加"恢复默认"按钮，允许用户清除自定义配置
2. 在配置界面显示配置来源（默认/用户自定义）
3. 支持批量导入/导出模型配置
4. 添加配置同步功能（跨设备）
