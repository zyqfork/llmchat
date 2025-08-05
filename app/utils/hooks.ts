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
    accessStore.enabledModels,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}

/**
 * 获取启用服务商的启用模型 - 更高效的版本
 * 只返回已启用服务商的已启用模型，避免不必要的计算
 * 注意：这个钩子现在包含API获取的模型，但API模型应该是实时的，不依赖长期缓存
 */
export function useEnabledModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();

  const enabledModels = useMemo(() => {
    console.log("[useEnabledModels] 开始计算启用的模型");

    const enabledProviders = accessStore.enabledProviders || {};
    const enabledModelsConfig = accessStore.enabledModels || {};
    const customProviders = accessStore.customProviders || [];
    const apiModelsCache = accessStore.apiModelsCache || {};

    console.log("[useEnabledModels] 启用的服务商:", enabledProviders);
    console.log("[useEnabledModels] 启用的模型配置:", enabledModelsConfig);
    console.log("[useEnabledModels] 自定义服务商:", customProviders);
    console.log("[useEnabledModels] API模型缓存:", apiModelsCache);

    const result: LLMModel[] = [];

    // 获取所有基础模型
    const allBaseModels = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );

    // 处理内置服务商
    Object.entries(enabledProviders).forEach(([providerName, isEnabled]) => {
      if (!isEnabled) return;

      const providerEnabledModels = enabledModelsConfig[providerName] || [];
      if (providerEnabledModels.length === 0) return;

      console.log(
        `[useEnabledModels] 处理内置服务商 ${providerName}, 启用模型:`,
        providerEnabledModels,
      );

      // 从基础模型中找到该服务商的模型
      const providerModels = allBaseModels.filter(
        (model) =>
          model.provider?.providerName === providerName &&
          providerEnabledModels.includes(model.name),
      );

      // 设置为可用并添加到结果中
      providerModels.forEach((model) => {
        if (model.provider) {
          result.push({
            ...model,
            available: true,
            provider: model.provider,
          } as LLMModel);
        }
      });

      // 添加从API获取的模型（如果有的话）
      const apiModels = apiModelsCache[providerName] || [];
      if (apiModels.length > 0) {
        console.log(
          `[useEnabledModels] 发现 ${providerName} 的API模型缓存:`,
          apiModels.length,
          "个模型",
        );

        apiModels.forEach((apiModel) => {
          if (providerEnabledModels.includes(apiModel.name)) {
            // 检查是否已经存在（避免重复）
            const exists = result.some(
              (existingModel) =>
                existingModel.name === apiModel.name &&
                existingModel.provider?.providerName === providerName,
            );

            if (!exists) {
              result.push({
                ...apiModel,
                available: true,
                displayName: apiModel.displayName || apiModel.name,
              } as LLMModel);
            }
          }
        });
      }

      console.log(
        `[useEnabledModels] 添加了 ${
          providerModels.length
        } 个内置 ${providerName} 模型和 ${
          apiModels.filter((m) => providerEnabledModels.includes(m.name)).length
        } 个API ${providerName} 模型`,
      );
    });

    // 处理自定义服务商
    customProviders.forEach((provider) => {
      if (!provider.enabled) return;

      const providerEnabledModels = enabledModelsConfig[provider.id] || [];
      if (providerEnabledModels.length === 0) return;

      console.log(
        `[useEnabledModels] 处理自定义服务商 ${provider.name} (${provider.id}), 启用模型:`,
        providerEnabledModels,
      );

      // 根据自定义服务商类型获取基础模型
      const baseModelsForType = getBaseModelsForProviderType(provider.type);

      baseModelsForType.forEach((baseModel) => {
        if (providerEnabledModels.includes(baseModel.name)) {
          result.push({
            ...baseModel,
            available: true,
            displayName: baseModel.displayName || baseModel.name,
            provider: {
              id: provider.id,
              providerName: provider.name,
              providerType: provider.type,
              sorted: 1000 + provider.created,
            },
          });
        }
      });

      // 添加从API获取的自定义服务商模型
      const apiModels = apiModelsCache[provider.id] || [];
      apiModels.forEach((apiModel) => {
        if (providerEnabledModels.includes(apiModel.name)) {
          // 检查是否已经存在（避免重复）
          const exists = result.some(
            (existingModel) =>
              existingModel.name === apiModel.name &&
              existingModel.provider?.id === provider.id,
          );

          if (!exists) {
            result.push({
              ...apiModel,
              available: true,
              displayName: apiModel.displayName || apiModel.name,
              provider: {
                id: provider.id,
                providerName: provider.name,
                providerType: provider.type,
                sorted: 1000 + provider.created,
              },
            } as LLMModel);
          }
        }
      });

      console.log(
        `[useEnabledModels] 添加了自定义服务商 ${provider.name} 的内置模型和API模型`,
      );
    });

    console.log(
      `[useEnabledModels] 总共返回 ${result.length} 个启用的模型:`,
      result.map(
        (m) => `${m.name}@${m.provider?.id || m.provider?.providerName}`,
      ),
    );

    return result;
  }, [
    accessStore.enabledProviders,
    accessStore.enabledModels,
    accessStore.customProviders,
    accessStore.customModels,
    accessStore.defaultModel,
    accessStore.apiModelsCache,
    configStore.customModels,
    configStore.models,
  ]);

  return enabledModels;
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
