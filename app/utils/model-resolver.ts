/**
 * 统一的模型决策系统
 * 负责决定在不同场景下应该使用哪个模型
 */

import { useAppConfig } from "../store/config";
import { Mask } from "../store/mask";

export interface ModelDecision {
  model: string;
  providerName: string;
  source: "mask-default" | "global-default" | "mask-config";
}

/**
 * 获取面具应该显示的模型
 * 优先级：面具默认模型 > 全局默认模型
 */
export function getMaskDisplayModel(mask: Mask): ModelDecision {
  const globalConfig = useAppConfig.getState().modelConfig;

  // 如果面具设置了默认模型，使用面具默认模型
  if (mask.defaultModel) {
    // 需要找到对应的提供商信息
    const allModels = useAppConfig.getState().models;
    const modelObj = allModels.find((m) => m.name === mask.defaultModel);

    return {
      model: mask.defaultModel,
      providerName:
        modelObj?.provider?.providerName || globalConfig.providerName,
      source: "mask-default",
    };
  }

  // 如果没有设置默认模型，使用全局默认模型
  return {
    model: globalConfig.model,
    providerName: globalConfig.providerName,
    source: "global-default",
  };
}

/**
 * 获取创建新对话时应该使用的模型配置
 * 优先级：面具默认模型 > 全局默认模型
 */
export function getSessionModelConfig(mask: Mask) {
  const globalConfig = useAppConfig.getState().modelConfig;
  const decision = getMaskDisplayModel(mask);

  // 基于全局配置，但使用决策的模型和提供商
  return {
    ...globalConfig,
    model: decision.model as any, // 类型断言，因为我们确保模型是有效的
    providerName: decision.providerName as any, // 类型断言，因为我们确保提供商是有效的
  };
}

/**
 * 获取面具的有效模型名称（用于显示）
 */
export function getMaskEffectiveModel(mask: Mask): string {
  return getMaskDisplayModel(mask).model;
}

/**
 * 检查面具是否使用全局默认模型
 */
export function isMaskUsingGlobalModel(mask: Mask): boolean {
  return !mask.defaultModel || mask.defaultModel === "";
}
