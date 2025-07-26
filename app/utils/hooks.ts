import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";
import { LLMModel } from "../client/api";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    // 获取基础模型
    const baseModels = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );

    // 为每个启用的自定义服务商添加模型
    const customProviderModels: LLMModel[] = [];
    accessStore.customProviders.forEach((provider) => {
      if (provider.enabled) {
        // 根据自定义服务商类型添加相应的模型
        const baseModelsForType = getBaseModelsForProviderType(provider.type);
        const enabledModels = accessStore.enabledModels?.[provider.id] || [];

        baseModelsForType.forEach((baseModel) => {
          // 只有在启用列表中的模型才添加，如果启用列表为空则不添加任何模型
          if (
            enabledModels.length > 0 &&
            enabledModels.includes(baseModel.name)
          ) {
            customProviderModels.push({
              ...baseModel,
              available: true, // 已启用的模型设为可用
              displayName: baseModel.displayName || baseModel.name, // 确保有displayName
              provider: {
                id: provider.id,
                providerName: provider.name,
                providerType: provider.type,
                sorted: 1000 + provider.created, // 使用创建时间作为排序
              },
            });
          }
        });
      }
    });

    return [...baseModels, ...customProviderModels];
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    accessStore.customProviders,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}

// 根据服务商类型获取基础模型列表
function getBaseModelsForProviderType(type: string): LLMModel[] {
  const { DEFAULT_MODELS, ServiceProvider } = require("../constant");

  switch (type) {
    case "openai":
      return DEFAULT_MODELS.filter(
        (m: LLMModel) => m.provider.providerName === ServiceProvider.OpenAI,
      );
    case "google":
      return DEFAULT_MODELS.filter(
        (m: LLMModel) => m.provider.providerName === ServiceProvider.Google,
      );
    case "anthropic":
      return DEFAULT_MODELS.filter(
        (m: LLMModel) => m.provider.providerName === ServiceProvider.Anthropic,
      );
    default:
      return [];
  }
}
