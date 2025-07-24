/**
 * 统一的模型决策系统
 * 负责决定在不同场景下应该使用哪个模型
 */

import { useAppConfig } from "../store/config";
import { useAccessStore } from "../store/access";
import { Mask } from "../store/mask";
import { collectModelsWithDefaultModel } from "./model";

export interface ModelDecision {
  model: string;
  providerName: string;
  source: "mask-default" | "global-default" | "mask-config";
}

/**
 * 获取助手应该显示的模型
 * 优先级：助手默认模型 > 全局默认模型
 */
export function getMaskDisplayModel(mask: Mask): ModelDecision {
  const globalConfig = useAppConfig.getState().modelConfig;

  // 如果助手设置了默认模型，使用助手默认模型
  if (mask.defaultModel) {
    // 需要找到对应的提供商信息，使用包含自定义模型的完整列表
    const configStore = useAppConfig.getState();
    const accessStore = useAccessStore.getState();
    const allModels = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
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
 * 获取助手的模型和提供商决策
 * 优先级：助手默认模型 > 全局默认模型
 * 注意：这个函数只返回模型和提供商信息，不包含其他配置项
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
 * 获取助手的有效模型名称（用于显示）
 */
export function getMaskEffectiveModel(mask: Mask): string {
  return getMaskDisplayModel(mask).model;
}

/**
 * 检查助手是否使用全局默认模型
 */
export function isMaskUsingGlobalModel(mask: Mask): boolean {
  return !mask.defaultModel || mask.defaultModel === "";
}

/**
 * 获取助手应该使用的摘要模型
 * 优先级：助手摘要模型配置 > 全局摘要模型配置 > 智能选择
 */
export function getMaskCompressModel(mask: Mask): ModelDecision {
  const globalConfig = useAppConfig.getState().modelConfig;

  // 如果助手设置了摘要模型，使用助手摘要模型
  if (mask.modelConfig.compressModel) {
    return {
      model: mask.modelConfig.compressModel,
      providerName:
        mask.modelConfig.compressProviderName || globalConfig.providerName,
      source: "mask-config",
    };
  }

  // 如果助手没有设置摘要模型，使用全局摘要模型配置
  if (globalConfig.compressModel) {
    return {
      model: globalConfig.compressModel,
      providerName:
        globalConfig.compressProviderName || globalConfig.providerName,
      source: "global-default",
    };
  }

  // 如果全局也没有配置摘要模型，返回空，让系统使用智能选择
  return {
    model: "",
    providerName: "",
    source: "global-default", // 使用现有的source类型
  };
}

/**
 * 检查助手是否使用全局摘要模型配置
 */
export function isMaskUsingGlobalCompressModel(mask: Mask): boolean {
  return (
    !mask.modelConfig.compressModel || mask.modelConfig.compressModel === ""
  );
}
