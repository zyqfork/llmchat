import { RealtimeConfig } from "@/app/store";

import Locale from "@/app/locales";
import { ListItem, Select, PasswordInput } from "@/app/components/ui-lib";

import { InputRange } from "@/app/components/input-range";
import { Voice } from "rt-client";
import { ServiceProvider } from "@/app/constant";
import {
  QWEN_REALTIME_VOICES,
  QwenVoice,
} from "@/app/lib/qwen-realtime-client";
import { QWEN_OMNI_REALTIME_MODELS } from "@/app/lib/qwen-omni-realtime-client";

const providers = [
  { value: ServiceProvider.OpenAI.id, label: "OpenAI" },
  { value: ServiceProvider.Azure.id, label: "Azure" },
  { value: ServiceProvider.Alibaba.id, label: "通义千问 (Qwen)" },
];

const openaiModels = ["gpt-4o-realtime-preview-2024-10-01"];

const openaiVoices = ["alloy", "shimmer", "echo"];

export function RealtimeConfigList(props: {
  realtimeConfig: RealtimeConfig;
  updateConfig: (updater: (config: RealtimeConfig) => void) => void;
}) {
  const isAzure = props.realtimeConfig.provider === ServiceProvider.Azure.id;
  const isQwen = props.realtimeConfig.provider === ServiceProvider.Alibaba.id;
  const isOpenAI = props.realtimeConfig.provider === ServiceProvider.OpenAI.id;

  const azureConfigComponent = isAzure && (
    <>
      <ListItem
        title={Locale.Settings.Realtime.Azure.Endpoint.Title}
        subTitle={Locale.Settings.Realtime.Azure.Endpoint.SubTitle}
      >
        <input
          value={props.realtimeConfig?.azure?.endpoint}
          type="text"
          placeholder={Locale.Settings.Realtime.Azure.Endpoint.Title}
          onChange={(e) => {
            props.updateConfig(
              (config) => (config.azure.endpoint = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Realtime.Azure.Deployment.Title}
        subTitle={Locale.Settings.Realtime.Azure.Deployment.SubTitle}
      >
        <input
          value={props.realtimeConfig?.azure?.deployment}
          type="text"
          placeholder={Locale.Settings.Realtime.Azure.Deployment.Title}
          onChange={(e) => {
            props.updateConfig(
              (config) => (config.azure.deployment = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const qwenModel = props.realtimeConfig?.qwen?.model ?? "";

  const qwenConfigComponent = isQwen && (
    <>
      <ListItem
        title={Locale.Settings.Realtime.Qwen.Model.Title}
        subTitle={Locale.Settings.Realtime.Qwen.Model.SubTitle}
      >
        <Select
          aria-label={Locale.Settings.Realtime.Qwen.Model.Title}
          value={qwenModel}
          onChange={(e) => {
            props.updateConfig(
              (config) => (config.qwen.model = e.target.value),
            );
          }}
        >
          {QWEN_OMNI_REALTIME_MODELS.map((v, i) => (
            <option value={v} key={i}>
              {v}
            </option>
          ))}
        </Select>
      </ListItem>
      <ListItem
        title={Locale.Settings.Realtime.Qwen.AsrLanguage.Title}
        subTitle={Locale.Settings.Realtime.Qwen.OmniLanguage.SubTitle}
      >
        <Select
          aria-label={Locale.Settings.Realtime.Qwen.AsrLanguage.Title}
          value={props.realtimeConfig?.qwen?.asrLanguage ?? "zh"}
          onChange={(e) => {
            props.updateConfig(
              (config) => (config.qwen.asrLanguage = e.target.value),
            );
          }}
        >
          <option value="zh">中文 (zh)</option>
          <option value="en">English (en)</option>
          <option value="ja">日本語 (ja)</option>
          <option value="ko">한국어 (ko)</option>
          <option value="yue">粤语 (yue)</option>
        </Select>
      </ListItem>
      <ListItem
        title={Locale.Settings.Realtime.Qwen.Voice.Title}
        subTitle={Locale.Settings.Realtime.Qwen.Voice.SubTitle}
      >
        <Select
          aria-label={Locale.Settings.Realtime.Qwen.Voice.Title}
          value={props.realtimeConfig?.qwen?.voice}
          onChange={(e) => {
            props.updateConfig(
              (config) => (config.qwen.voice = e.target.value as QwenVoice),
            );
          }}
        >
          {QWEN_REALTIME_VOICES.map((v, i) => (
            <option value={v.value} key={i}>
              {v.label} - {v.description}
            </option>
          ))}
        </Select>
      </ListItem>
      <ListItem
        title={Locale.Settings.Realtime.Qwen.Region.Title}
        subTitle={Locale.Settings.Realtime.Qwen.Region.SubTitle}
      >
        <Select
          aria-label={Locale.Settings.Realtime.Qwen.Region.Title}
          value={props.realtimeConfig?.qwen?.region}
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.qwen.region = e.target.value as
                  | "beijing"
                  | "singapore"),
            );
          }}
        >
          <option value="beijing">
            {Locale.Settings.Realtime.Qwen.Region.Beijing}
          </option>
          <option value="singapore">
            {Locale.Settings.Realtime.Qwen.Region.Singapore}
          </option>
        </Select>
      </ListItem>
    </>
  );

  return (
    <>
      <ListItem
        title={Locale.Settings.Realtime.Enable.Title}
        subTitle={Locale.Settings.Realtime.Enable.SubTitle}
      >
        <input
          type="checkbox"
          checked={props.realtimeConfig.enable}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.enable = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>

      {props.realtimeConfig.enable && (
        <>
          <ListItem
            title={Locale.Settings.Realtime.Provider.Title}
            subTitle={Locale.Settings.Realtime.Provider.SubTitle}
          >
            <Select
              aria-label={Locale.Settings.Realtime.Provider.Title}
              value={props.realtimeConfig.provider}
              onChange={(e) => {
                props.updateConfig(
                  (config) => (config.provider = e.target.value as string),
                );
              }}
            >
              {providers.map((p, i) => (
                <option value={p.value} key={i}>
                  {p.label}
                </option>
              ))}
            </Select>
          </ListItem>

          {/* OpenAI/Azure 模型选择 */}
          {(isOpenAI || isAzure) && (
            <ListItem
              title={Locale.Settings.Realtime.Model.Title}
              subTitle={Locale.Settings.Realtime.Model.SubTitle}
            >
              <Select
                aria-label={Locale.Settings.Realtime.Model.Title}
                value={props.realtimeConfig.model}
                onChange={(e) => {
                  props.updateConfig(
                    (config) => (config.model = e.target.value),
                  );
                }}
              >
                {openaiModels.map((v, i) => (
                  <option value={v} key={i}>
                    {v}
                  </option>
                ))}
              </Select>
            </ListItem>
          )}

          <ListItem
            title={Locale.Settings.Realtime.ApiKey.Title}
            subTitle={Locale.Settings.Realtime.ApiKey.SubTitle}
          >
            <PasswordInput
              aria-label={Locale.Settings.Realtime.ApiKey.Title}
              value={props.realtimeConfig.apiKey}
              type="text"
              placeholder={Locale.Settings.Realtime.ApiKey.Placeholder}
              onChange={(e) => {
                props.updateConfig(
                  (config) => (config.apiKey = e.currentTarget.value),
                );
              }}
            />
          </ListItem>

          {azureConfigComponent}
          {qwenConfigComponent}

          {/* OpenAI/Azure 语音选择 */}
          {(isOpenAI || isAzure) && (
            <ListItem
              title={Locale.Settings.TTS.Voice.Title}
              subTitle={Locale.Settings.TTS.Voice.SubTitle}
            >
              <Select
                value={props.realtimeConfig.voice}
                onChange={(e) => {
                  props.updateConfig(
                    (config) => (config.voice = e.target.value as Voice),
                  );
                }}
              >
                {openaiVoices.map((v, i) => (
                  <option value={v} key={i}>
                    {v}
                  </option>
                ))}
              </Select>
            </ListItem>
          )}

          {/* OpenAI/Azure 温度设置 */}
          {(isOpenAI || isAzure) && (
            <ListItem
              title={Locale.Settings.Realtime.Temperature.Title}
              subTitle={Locale.Settings.Realtime.Temperature.SubTitle}
            >
              <InputRange
                aria={Locale.Settings.Temperature.Title}
                value={props.realtimeConfig?.temperature?.toFixed(1)}
                min="0.6"
                max="1"
                step="0.1"
                onChange={(e) => {
                  props.updateConfig(
                    (config) =>
                      (config.temperature = e.currentTarget.valueAsNumber),
                  );
                }}
              ></InputRange>
            </ListItem>
          )}
        </>
      )}
    </>
  );
}
