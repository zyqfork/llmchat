import { ServiceProvider, getModelCapabilities } from "@/app/constant";
import { ModalConfigValidator, ModelConfig } from "../store";
import { normalizeProviderName } from "../client/api";

import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useEnabledModels } from "../utils/hooks";
import { groupBy } from "lodash-es";
import styles from "./model-config.module.scss";
import { getModelProvider } from "../utils/model";
import { useAccessStore } from "../store/access";

import {
  getModelContextTokens,
  formatTokenCount,
  getModelCompressThreshold,
} from "../config/model-config";

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
  showModelSelector?: boolean; // 新增参数控制是否显示模型选择器
  showGlobalOption?: boolean; // 新增参数控制是否显示"使用全局配置"选项
}) {
  // 直接使用启用的模型，无需额外过滤
  const availableModels = useEnabledModels();
  const accessStore = useAccessStore();

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

  const getProviderAliases = (provider: string) => {
    const aliases = new Set<string>();
    if (!provider) return aliases;

    aliases.add(provider);

    const byId = accessStore.customProviders.find((p) => p.id === provider);
    if (byId?.name) aliases.add(byId.name);

    const byName = accessStore.customProviders.find((p) => p.name === provider);
    if (byName?.id) aliases.add(byName.id);

    if (!provider.startsWith("custom_")) {
      aliases.add(normalizeProviderName(provider));
    }

    return aliases;
  };

  const isSameProvider = (a: string, b: string) => {
    const aAliases = getProviderAliases(a);
    const bAliases = getProviderAliases(b);
    for (const alias of aAliases) {
      if (bAliases.has(alias)) return true;
    }
    return false;
  };

  // 构建当前选中模型的value，需要与option的value格式一致
  const value = (() => {
    const currentModel = props.modelConfig.model;
    const currentProviderName = props.modelConfig.providerName;

    // 查找匹配的模型，确保value格式一致
    for (const providerGroup of Object.values(groupModels)) {
      for (const model of providerGroup) {
        if (model.name === currentModel) {
          const modelProviderId =
            model.provider?.id || model.provider?.providerName;
          if (
            isSameProvider(
              (currentProviderName || "") as string,
              (modelProviderId || "") as string,
            )
          ) {
            return `${model.name}@${modelProviderId}`;
          }
        }
      }
    }

    // 如果没找到匹配的，使用原始格式
    return `${currentModel}@${currentProviderName}`;
  })();

  // 构建对话摘要模型的value
  const compressModelValue = (() => {
    // 如果没配置摘要模型，使用当前对话模型作为默认值（与标题生成模型逻辑一致）
    const currentModel =
      props.modelConfig.compressModel || props.modelConfig.model;
    const currentProviderName =
      props.modelConfig.compressProviderName || props.modelConfig.providerName;

    // 查找匹配的模型，确保value格式一致
    for (const providerGroup of Object.values(groupModels)) {
      for (const model of providerGroup) {
        if (model.name === currentModel) {
          const modelProviderId =
            model.provider?.id || model.provider?.providerName;
          if (
            isSameProvider(
              (currentProviderName || "") as string,
              (modelProviderId || "") as string,
            )
          ) {
            return `${model.name}@${modelProviderId}`;
          }
        }
      }
    }

    // 如果没找到匹配的，使用原始格式
    return `${currentModel}@${currentProviderName}`;
  })();

  // 构建提示词优化模型的value
  const optimizeModelValue = (() => {
    // 如果没配置优化模型，使用当前对话模型作为默认值（与标题生成模型逻辑一致）
    const currentModel =
      props.modelConfig.optimizeModel || props.modelConfig.model;
    const currentProviderName =
      props.modelConfig.optimizeProviderName || props.modelConfig.providerName;

    // 查找匹配的模型，确保value格式一致
    for (const providerGroup of Object.values(groupModels)) {
      for (const model of providerGroup) {
        if (model.name === currentModel) {
          const modelProviderId =
            model.provider?.id || model.provider?.providerName;
          if (
            isSameProvider(
              (currentProviderName || "") as string,
              (modelProviderId || "") as string,
            )
          ) {
            return `${model.name}@${modelProviderId}`;
          }
        }
      }
    }

    // 如果没找到匹配的，使用原始格式
    return `${currentModel}@${currentProviderName}`;
  })();

  // 构建标题生成模型的value
  const topicModelValue = (() => {
    const currentModel =
      props.modelConfig.topicModel || props.modelConfig.model;
    const currentProviderName =
      props.modelConfig.topicProviderName || props.modelConfig.providerName;

    for (const providerGroup of Object.values(groupModels)) {
      for (const model of providerGroup) {
        if (model.name === currentModel) {
          const modelProviderId =
            model.provider?.id || model.provider?.providerName;
          if (
            isSameProvider(
              (currentProviderName || "") as string,
              (modelProviderId || "") as string,
            )
          ) {
            return `${model.name}@${modelProviderId}`;
          }
        }
      }
    }

    return `${currentModel}@${currentProviderName}`;
  })();

  return (
    <>
      {props.showModelSelector && (
        <ListItem title={Locale.Settings.Model}>
          <Select
            className={styles["select-default-model"]}
            aria-label={Locale.Settings.Model}
            value={value}
            align="left"
            onChange={(e) => {
              const [model, providerName] = getModelProvider(
                e.currentTarget.value,
              );
              props.updateConfig((config) => {
                config.model = ModalConfigValidator.model(model);
                config.providerName = providerName!;

                // 检查新模型是否支持thinking功能，如果支持且thinkingBudget未设置，则设置默认值
                const modelCapabilities = getModelCapabilities(config.model);
                if (
                  modelCapabilities.reasoning &&
                  modelCapabilities.reasoningField &&
                  config.thinkingBudget === undefined
                ) {
                  config.thinkingBudget = -1; // 默认为动态思考
                }

                // 根据新模型自动更新压缩阈值
                const autoThreshold = getModelCompressThreshold(
                  config.model,
                  config.compressThresholdRatio,
                );
                config.compressMessageLengthThreshold = autoThreshold;
              });
            }}
          >
            {Object.keys(groupModels).map((providerName, index) => (
              <optgroup label={providerName} key={index}>
                {groupModels[providerName].map((v, i) => {
                  const contextConfig = getModelContextTokens(v.name);
                  const contextTokensDisplay = contextConfig
                    ? formatTokenCount(contextConfig.contextTokens)
                    : null;

                  return (
                    <option
                      value={`${v.name}@${
                        v.provider?.id || v.provider?.providerName
                      }`}
                      key={i}
                    >
                      {v.displayName}
                      {contextTokensDisplay ? ` (${contextTokensDisplay})` : ""}
                    </option>
                  );
                })}
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

      {props.modelConfig?.providerName == ServiceProvider.Google.id ? null : (
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
        title={Locale.Settings.AutoTitleMinUserTokens.Title}
        subTitle={Locale.Settings.AutoTitleMinUserTokens.SubTitle}
      >
        <input
          aria-label={Locale.Settings.AutoTitleMinUserTokens.Title}
          type="number"
          min={1}
          max={10000}
          value={props.modelConfig.autoTitleMinUserTokens ?? 20}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.autoTitleMinUserTokens =
                  ModalConfigValidator.autoTitleMinUserTokens(
                    e.currentTarget.valueAsNumber,
                  )),
            )
          }
        ></input>
      </ListItem>

      <ListItem
        title={Locale.Settings.AutoTitleMinUserMessages.Title}
        subTitle={Locale.Settings.AutoTitleMinUserMessages.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.AutoTitleMinUserMessages.Title}
          title={(props.modelConfig.autoTitleMinUserMessages ?? 1).toString()}
          value={props.modelConfig.autoTitleMinUserMessages ?? 1}
          min="1"
          max="20"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.autoTitleMinUserMessages =
                  ModalConfigValidator.autoTitleMinUserMessages(
                    e.target.valueAsNumber,
                  )),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.AutoTitleRefreshInterval.Title}
        subTitle={Locale.Settings.AutoTitleRefreshInterval.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.AutoTitleRefreshInterval.Title}
          title={(props.modelConfig.autoTitleRefreshInterval ?? 4).toString()}
          value={props.modelConfig.autoTitleRefreshInterval ?? 4}
          min="1"
          max="20"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.autoTitleRefreshInterval =
                  ModalConfigValidator.autoTitleRefreshInterval(
                    e.target.valueAsNumber,
                  )),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={(() => {
          const autoThreshold = getModelCompressThreshold(
            props.modelConfig.model,
            props.modelConfig.compressThresholdRatio,
          );
          const currentThreshold =
            props.modelConfig.compressMessageLengthThreshold;
          const isAuto = currentThreshold === autoThreshold;
          return `${Locale.Settings.CompressThreshold.SubTitle}${
            isAuto
              ? ` (当前: 自动 - ${formatTokenCount(autoThreshold)} Token)`
              : ` (当前: 自定义)`
          }`;
        })()}
      >
        <input
          aria-label={Locale.Settings.CompressThreshold.Title}
          type="number"
          min={500}
          max={10000000}
          value={props.modelConfig.compressMessageLengthThreshold}
          placeholder={getModelCompressThreshold(
            props.modelConfig.model,
            props.modelConfig.compressThresholdRatio,
          ).toString()}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.compressMessageLengthThreshold =
                  e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThresholdRatio.Title}
        subTitle={Locale.Settings.CompressThresholdRatio.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.CompressThresholdRatio.Title}
          title={`${Math.round(
            (props.modelConfig.compressThresholdRatio ?? 0.5) * 100,
          )}%`}
          value={Math.round(
            (props.modelConfig.compressThresholdRatio ?? 0.5) * 100,
          )}
          min="10"
          max="90"
          step="5"
          onChange={(e) =>
            props.updateConfig((config) => {
              const ratio = ModalConfigValidator.compressThresholdRatio(
                e.target.valueAsNumber / 100,
              );
              config.compressThresholdRatio = ratio;
              config.compressMessageLengthThreshold = getModelCompressThreshold(
                config.model,
                ratio,
              );
            })
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.SummaryMinUserMessages.Title}
        subTitle={Locale.Settings.SummaryMinUserMessages.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.SummaryMinUserMessages.Title}
          title={(props.modelConfig.summaryMinUserMessages ?? 1).toString()}
          value={props.modelConfig.summaryMinUserMessages ?? 1}
          min="1"
          max="20"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.summaryMinUserMessages =
                  ModalConfigValidator.summaryMinUserMessages(
                    e.target.valueAsNumber,
                  )),
            )
          }
        ></InputRange>
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
          align="left"
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
              {groupModels[providerName].map((v, i) => {
                const contextConfig = getModelContextTokens(v.name);
                const contextTokensDisplay = contextConfig
                  ? formatTokenCount(contextConfig.contextTokens)
                  : null;

                return (
                  <option
                    value={`${v.name}@${
                      v.provider?.id || v.provider?.providerName
                    }`}
                    key={i}
                  >
                    {v.displayName}
                    {contextTokensDisplay ? ` (${contextTokensDisplay})` : ""}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </Select>
      </ListItem>
      <ListItem
        title={Locale.Settings.OptimizeModel.Title}
        subTitle={Locale.Settings.OptimizeModel.SubTitle}
      >
        <Select
          className={styles["select-optimize-model"]}
          aria-label={Locale.Settings.OptimizeModel.Title}
          value={optimizeModelValue}
          align="left"
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (value === "") {
              // 使用全局提示词优化模型配置
              props.updateConfig((config) => {
                config.optimizeModel = "";
                config.optimizeProviderName = "";
              });
            } else {
              const [model, providerName] = getModelProvider(value);
              props.updateConfig((config) => {
                config.optimizeModel = ModalConfigValidator.model(model);
                config.optimizeProviderName = normalizeProviderName(
                  providerName!,
                );
              });
            }
          }}
        >
          {props.showGlobalOption && (
            <option value="">使用全局提示词优化模型配置</option>
          )}
          {Object.keys(groupModels).map((providerName, index) => (
            <optgroup label={providerName} key={index}>
              {groupModels[providerName].map((v, i) => {
                const contextConfig = getModelContextTokens(v.name);
                const contextTokensDisplay = contextConfig
                  ? formatTokenCount(contextConfig.contextTokens)
                  : null;

                return (
                  <option
                    value={`${v.name}@${
                      v.provider?.id || v.provider?.providerName
                    }`}
                    key={i}
                  >
                    {v.displayName}
                    {contextTokensDisplay ? ` (${contextTokensDisplay})` : ""}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </Select>
      </ListItem>
      <ListItem
        title={"标题生成模型"}
        subTitle={"用于生成会话标题；不配置时使用聊天模型"}
      >
        <Select
          className={styles["select-topic-model"]}
          aria-label={"标题生成模型"}
          value={topicModelValue}
          align="left"
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (value === "") {
              props.updateConfig((config) => {
                config.topicModel = "";
                config.topicProviderName = "";
              });
            } else {
              const [model, providerName] = getModelProvider(value);
              props.updateConfig((config) => {
                config.topicModel = ModalConfigValidator.model(model);
                config.topicProviderName = providerName!;
              });
            }
          }}
        >
          {props.showGlobalOption && (
            <option value="">使用全局标题模型配置</option>
          )}
          {Object.keys(groupModels).map((providerName, index) => (
            <optgroup label={providerName} key={index}>
              {groupModels[providerName].map((v, i) => {
                const contextConfig = getModelContextTokens(v.name);
                const contextTokensDisplay = contextConfig
                  ? formatTokenCount(contextConfig.contextTokens)
                  : null;

                return (
                  <option
                    value={`${v.name}@${
                      v.provider?.id || v.provider?.providerName
                    }`}
                    key={i}
                  >
                    {v.displayName}
                    {contextTokensDisplay ? ` (${contextTokensDisplay})` : ""}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </Select>
      </ListItem>
    </>
  );
}
