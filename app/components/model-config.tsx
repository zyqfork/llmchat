import { ServiceProvider } from "@/app/constant";
import { ModalConfigValidator, ModelConfig } from "../store";
import { normalizeProviderName } from "../client/api";

import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useAllModels } from "../utils/hooks";
import { groupBy } from "lodash-es";
import styles from "./model-config.module.scss";
import { getModelProvider } from "../utils/model";
import { useAccessStore } from "../store/access";
import { useMemo } from "react";
import { getModelCapabilitiesWithCustomConfig } from "../config/model-capabilities";

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
  showModelSelector?: boolean; // 新增参数控制是否显示模型选择器
  showGlobalOption?: boolean; // 新增参数控制是否显示"使用全局配置"选项
}) {
  const allModels = useAllModels();
  const accessStore = useAccessStore();

  // 只显示已启用服务商的已启用模型
  const availableModels = useMemo(() => {
    const enabledProviders = accessStore.enabledProviders || {};
    const enabledModels = accessStore.enabledModels || {};

    return allModels.filter((model) => {
      const providerId = model.provider?.id;
      const providerName = model.provider?.providerName;

      if (!providerId || !providerName) return false;

      // 检查是否是自定义服务商
      const isCustomProvider = providerId.startsWith("custom_");
      const customProvider = isCustomProvider
        ? accessStore.customProviders.find((p) => p.id === providerId)
        : null;

      // 对于内置服务商，检查是否启用
      // 对于自定义服务商，检查是否存在且启用
      const isProviderEnabled = isCustomProvider
        ? customProvider && customProvider.enabled
        : enabledProviders[providerName as ServiceProvider];

      if (!isProviderEnabled) return false;

      // 检查模型是否在启用列表中
      const providerEnabledModels =
        enabledModels[isCustomProvider ? providerId : providerName] || [];

      // 只有明确配置了可用模型的提供商才显示，且只显示已配置的模型
      return (
        providerEnabledModels.length > 0 &&
        providerEnabledModels.includes(model.name)
      );
    });
  }, [
    allModels,
    accessStore.enabledProviders,
    accessStore.enabledModels,
    accessStore.customProviders,
  ]);

  const groupModels = groupBy(availableModels, (model) => {
    const isCustomProvider = model.provider?.id?.startsWith("custom_");
    if (isCustomProvider) {
      const customProvider = accessStore.customProviders.find(
        (p) => p.id === model.provider?.id,
      );
      return customProvider?.name || model.provider?.providerName;
    }
    return model.provider?.providerName;
  });

  const value = `${props.modelConfig.model}@${props.modelConfig?.providerName}`;
  const compressModelValue = props.modelConfig.compressModel
    ? `${props.modelConfig.compressModel}@${props.modelConfig?.compressProviderName}`
    : "";

  return (
    <>
      {props.showModelSelector && (
        <ListItem title={Locale.Settings.Model}>
          <Select
            aria-label={Locale.Settings.Model}
            value={value}
            align="left"
            onChange={(e) => {
              const [model, providerName] = getModelProvider(
                e.currentTarget.value,
              );
              props.updateConfig((config) => {
                config.model = ModalConfigValidator.model(model);
                config.providerName = normalizeProviderName(providerName!);

                // 检查新模型是否支持thinking功能，如果支持且thinkingBudget未设置，则设置默认值
                const modelCapabilities = getModelCapabilitiesWithCustomConfig(
                  config.model,
                );
                if (
                  modelCapabilities.reasoning &&
                  modelCapabilities.thinkingType &&
                  config.thinkingBudget === undefined
                ) {
                  config.thinkingBudget = -1; // 默认为动态思考
                }
              });
            }}
          >
            {Object.keys(groupModels).map((providerName, index) => (
              <optgroup label={providerName} key={index}>
                {groupModels[providerName].map((v, i) => (
                  <option
                    value={`${v.name}@${
                      v.provider?.id || v.provider?.providerName
                    }`}
                    key={i}
                  >
                    {v.displayName}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </ListItem>
      )}
      <ListItem
        title={Locale.Settings.Temperature.Title}
        subTitle={Locale.Settings.Temperature.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.Temperature.Title}
          value={props.modelConfig.temperature?.toFixed(1)}
          min="0"
          max="1" // lets limit it to 0-1
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.temperature = ModalConfigValidator.temperature(
                  e.currentTarget.valueAsNumber,
                )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        title={Locale.Settings.TopP.Title}
        subTitle={Locale.Settings.TopP.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.TopP.Title}
          value={(props.modelConfig.top_p ?? 1).toFixed(1)}
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.top_p = ModalConfigValidator.top_p(
                  e.currentTarget.valueAsNumber,
                )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        title={Locale.Settings.MaxTokens.Title}
        subTitle={Locale.Settings.MaxTokens.SubTitle}
      >
        <input
          aria-label={Locale.Settings.MaxTokens.Title}
          type="number"
          min={1024}
          max={512000}
          value={props.modelConfig.max_tokens}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.max_tokens = ModalConfigValidator.max_tokens(
                  e.currentTarget.valueAsNumber,
                )),
            )
          }
        ></input>
      </ListItem>

      {props.modelConfig?.providerName == ServiceProvider.Google ? null : (
        <>
          <ListItem
            title={Locale.Settings.PresencePenalty.Title}
            subTitle={Locale.Settings.PresencePenalty.SubTitle}
          >
            <InputRange
              aria={Locale.Settings.PresencePenalty.Title}
              value={props.modelConfig.presence_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                    (config.presence_penalty =
                      ModalConfigValidator.presence_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.FrequencyPenalty.Title}
            subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
          >
            <InputRange
              aria={Locale.Settings.FrequencyPenalty.Title}
              value={props.modelConfig.frequency_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                    (config.frequency_penalty =
                      ModalConfigValidator.frequency_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.InjectSystemPrompts.Title}
            subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
          >
            <input
              aria-label={Locale.Settings.InjectSystemPrompts.Title}
              type="checkbox"
              checked={props.modelConfig.enableInjectSystemPrompts}
              onChange={(e) =>
                props.updateConfig(
                  (config) =>
                    (config.enableInjectSystemPrompts =
                      e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.InputTemplate.Title}
            subTitle={Locale.Settings.InputTemplate.SubTitle}
          >
            <input
              aria-label={Locale.Settings.InputTemplate.Title}
              type="text"
              value={props.modelConfig.template}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.template = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </>
      )}
      <ListItem
        title={Locale.Settings.HistoryCount.Title}
        subTitle={Locale.Settings.HistoryCount.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.HistoryCount.Title}
          title={props.modelConfig.historyMessageCount.toString()}
          value={props.modelConfig.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.historyMessageCount = e.target.valueAsNumber),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={Locale.Settings.CompressThreshold.SubTitle}
      >
        <input
          aria-label={Locale.Settings.CompressThreshold.Title}
          type="number"
          min={500}
          max={4000}
          value={props.modelConfig.compressMessageLengthThreshold}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.compressMessageLengthThreshold =
                  e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>
      <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
        <input
          aria-label={Locale.Memory.Title}
          type="checkbox"
          checked={props.modelConfig.sendMemory}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.sendMemory = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.CompressModel.Title}
        subTitle={Locale.Settings.CompressModel.SubTitle}
      >
        <Select
          className={styles["select-compress-model"]}
          aria-label={Locale.Settings.CompressModel.Title}
          value={compressModelValue}
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (value === "") {
              // 使用全局摘要模型配置
              props.updateConfig((config) => {
                config.compressModel = "";
                config.compressProviderName = "";
              });
            } else {
              const [model, providerName] = getModelProvider(value);
              props.updateConfig((config) => {
                config.compressModel = ModalConfigValidator.model(model);
                config.compressProviderName = normalizeProviderName(
                  providerName!,
                );
              });
            }
          }}
        >
          {props.showGlobalOption && (
            <option value="">使用全局摘要模型配置</option>
          )}
          {Object.keys(groupModels).map((providerName, index) => (
            <optgroup label={providerName} key={index}>
              {groupModels[providerName].map((v, i) => (
                <option
                  value={`${v.name}@${
                    v.provider?.id || v.provider?.providerName
                  }`}
                  key={i}
                >
                  {v.displayName}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </ListItem>
    </>
  );
}
