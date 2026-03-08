import React, { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import FireIcon from "../icons/fire.svg";
import EyeIcon from "../icons/eye.svg";
import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import ConfigIcon from "../icons/config.svg";
import ConfirmIcon from "../icons/confirm.svg";
import DownIcon from "../icons/down.svg";

import ConnectionIcon from "../icons/connection.svg";
import CloudSuccessIcon from "../icons/cloud-success.svg";
import CloudFailIcon from "../icons/cloud-fail.svg";
import { trackSettingsPageGuideToCPaymentClick } from "../utils/auth-settings-events";
import {
  Input,
  List,
  ListItem,
  Modal,
  PasswordInput,
  Popover,
  Select,
  showConfirm,
  showToast,
} from "./ui-lib";
import { ModelConfigList } from "./model-config";
import { ProviderIcon } from "./provider-icon";
import { ModelCapabilityIcons } from "./model-capability-icons";
import { getModelCapabilities } from "../constant";
import { normalizeProviderName, LLMModel } from "../client/api";
import {
  getModelCompressThreshold,
  getModelContextTokens,
} from "../config/model-config";
import { ModelConfigModal } from "./model-config-modal";

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  useUpdateStore,
  useAccessStore,
  useAppConfig,
  CustomProviderType,
  ChatConfig,
} from "../store";
import { ColorScheme } from "../constant";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import { copyToClipboard, clientUpdate, semverCompare } from "../utils";
import { logger } from "../utils/logger";
import { groupBy } from "lodash-es";
import Link from "next/link";
import {
  ServiceProvider,
  getAllProviders,
  getProviderConfig,
  ProviderConfig,
  GoogleSafetySettingsThreshold,
  OPENAI_BASE_URL,
  Path,
  RELEASE_URL,
  STORAGE_KEY,
  SlotID,
  UPDATE_URL,
  SAAS_CHAT_URL,
} from "../constant";
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { useSyncStore } from "../store/sync";
import { nanoid } from "nanoid";
import { useMaskStore, DEFAULT_MASK_ID } from "../store/mask";
import { getBuiltinMasks } from "../masks";
import { MaskConfig, MaskAvatar } from "./mask";
import { getMaskEffectiveModel } from "../utils/model-resolver";
import { ProviderType } from "../utils/cloud";
import { TTSConfigList } from "./tts-config";
import { RealtimeConfigList } from "./realtime-chat/realtime-config";
import { ModelManager } from "./model-manager";
import { useAllModels } from "../utils/hooks";
import { getModelProvider } from "../utils/model";
import { useEnabledModels } from "../utils/hooks";

// 设置页面的分类枚举
enum SettingsTab {
  General = "general",
  Sync = "sync",
  Mask = "mask",
  Prompt = "prompt",
  ModelService = "model-service",
  ModelConfig = "model-config",
  Voice = "voice",
}

// 自定义服务商添加弹窗组件
interface AddCustomProviderModalProps {
  onClose: () => void;
  onAdd: (provider: {
    name: string;
    type: CustomProviderType;
    apiKey: string;
    endpoint?: string;
    enabled: boolean;
    config?: {
      useResponseApi?: boolean;
      apiPath?: string;
      useProxy?: boolean;
      proxyUrl?: string;
      azureApiVersion?: string;
      googleSafetySettings?: GoogleSafetySettingsThreshold;
      anthropicVersion?: string;
    };
  }) => void;
}

function AddCustomProviderModal({
  onClose,
  onAdd,
}: AddCustomProviderModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "openai" as CustomProviderType,
    apiKey: "",
    endpoint: "",
    // OpenAI 兼容服务商的额外配置
    useResponseApi: false,
    apiPath: "",
    useProxy: false,
    proxyUrl: "",
    // Google 服务商的额外配置
    googleSafetySettings:
      GoogleSafetySettingsThreshold.BLOCK_NONE as GoogleSafetySettingsThreshold,
    // Anthropic 服务商的额外配置
    anthropicVersion: "2023-06-01",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const accessStore = useAccessStore();

  const providerTypeOptions = [
    {
      value: "openai",
      label: "OpenAI",
      description: Locale.Settings.Access.CustomProvider.Modal.Type.OpenAI,
    },
    {
      value: "google",
      label: "Google",
      description: Locale.Settings.Access.CustomProvider.Modal.Type.Google,
    },
    {
      value: "anthropic",
      label: "Anthropic",
      description: Locale.Settings.Access.CustomProvider.Modal.Type.Anthropic,
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name =
        Locale.Settings.Access.CustomProvider.Modal.Name.Required;
    } else if (!accessStore.isCustomProviderNameUnique(formData.name.trim())) {
      newErrors.name = Locale.Settings.Access.CustomProvider.Modal.Name.Unique;
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey =
        Locale.Settings.Access.CustomProvider.Modal.ApiKey.Required;
    }

    // 如果启用了代理但没有填写代理地址
    if (formData.useProxy && !formData.proxyUrl.trim()) {
      newErrors.proxyUrl = "启用代理时必须填写代理地址";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAdd({
        name: formData.name.trim(),
        type: formData.type,
        apiKey: formData.apiKey.trim(),
        endpoint: formData.endpoint.trim() || undefined,
        enabled: true,
        // 添加额外的配置信息
        config: {
          useResponseApi: formData.useResponseApi,
          apiPath: formData.apiPath.trim() || undefined,
          useProxy: formData.useProxy,
          proxyUrl: formData.proxyUrl.trim() || undefined,
          googleSafetySettings:
            formData.type === "google"
              ? formData.googleSafetySettings
              : undefined,
          anthropicVersion:
            formData.type === "anthropic"
              ? formData.anthropicVersion.trim() || undefined
              : undefined,
        },
      });
    }
  };

  // 检查是否是 OpenAI 兼容类型
  const isOpenAICompatible = formData.type === "openai";
  const isGoogle = formData.type === "google";
  const isAnthropic = formData.type === "anthropic";

  // 根据服务商类型获取默认基础路径
  const getDefaultEndpoint = () => {
    if (isGoogle) return "https://generativelanguage.googleapis.com/";
    if (isAnthropic) return "https://api.anthropic.com/v1";
    return "https://api.openai.com/v1";
  };

  // 根据 Response API 选择自动设置默认 API 路径
  const getDefaultApiPath = () => {
    if (!isOpenAICompatible) return "";
    return formData.useResponseApi ? "/responses" : "/chat/completions";
  };

  // 当 Response API 选项改变时，自动更新 API 路径（如果用户没有手动修改过）
  const handleResponseApiChange = (useResponseApi: boolean) => {
    const newFormData = { ...formData, useResponseApi };

    // 如果 API 路径为空或者是默认值，则自动更新
    const currentDefaultPath = formData.useResponseApi
      ? "/responses"
      : "/chat/completions";
    if (!formData.apiPath || formData.apiPath === currentDefaultPath) {
      newFormData.apiPath = useResponseApi ? "/responses" : "/chat/completions";
    }

    setFormData(newFormData);
  };

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Access.CustomProvider.Modal.Title}
        onClose={onClose}
        actions={[
          <IconButton
            key="confirm"
            text={Locale.Settings.Access.CustomProvider.Modal.Confirm}
            onClick={handleSubmit}
            type="primary"
            bordered
          />,
        ]}
      >
        <List>
          <ListItem
            title={
              Locale.Settings.Access.CustomProvider.Modal.Name.Title + " *"
            }
            subTitle={
              errors.name ? (
                <span style={{ color: "var(--red)" }}>{errors.name}</span>
              ) : undefined
            }
          >
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={
                Locale.Settings.Access.CustomProvider.Modal.Name.Placeholder
              }
            />
          </ListItem>

          <ListItem
            title={
              Locale.Settings.Access.CustomProvider.Modal.Type.Title + " *"
            }
          >
            <Select
              value={formData.type}
              align="left"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.currentTarget.value as CustomProviderType,
                })
              }
            >
              {providerTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.description}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem title="基础路径 (Base Path)" subTitle="留空使用默认地址">
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) =>
                setFormData({ ...formData, endpoint: e.target.value })
              }
              placeholder={getDefaultEndpoint()}
            />
          </ListItem>

          {isOpenAICompatible && (
            <>
              <ListItem
                title="使用 Response API"
                subTitle="启用后该服务商的所有模型调用都将使用 Response API"
              >
                <input
                  type="checkbox"
                  checked={formData.useResponseApi}
                  onChange={(e) => handleResponseApiChange(e.target.checked)}
                />
              </ListItem>

              <ListItem title="API 路径" subTitle="API 端点路径，可自定义">
                <input
                  type="text"
                  value={formData.apiPath}
                  onChange={(e) =>
                    setFormData({ ...formData, apiPath: e.target.value })
                  }
                  placeholder={getDefaultApiPath()}
                />
              </ListItem>
            </>
          )}

          {isGoogle && (
            <ListItem
              title={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
              subTitle={
                Locale.Settings.Access.Google.GoogleSafetySettings.SubTitle
              }
            >
              <Select
                value={formData.googleSafetySettings}
                align="left"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    googleSafetySettings: e.currentTarget
                      .value as GoogleSafetySettingsThreshold,
                  })
                }
              >
                {Object.entries(GoogleSafetySettingsThreshold).map(([k, v]) => (
                  <option value={v} key={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </ListItem>
          )}

          {isAnthropic && (
            <ListItem
              title="Anthropic Version"
              subTitle="API 版本号，默认 2023-06-01"
            >
              <input
                type="text"
                value={formData.anthropicVersion}
                onChange={(e) =>
                  setFormData({ ...formData, anthropicVersion: e.target.value })
                }
                placeholder="2023-06-01"
              />
            </ListItem>
          )}

          <ListItem title="启用代理" subTitle="通过代理地址转发请求">
            <input
              type="checkbox"
              checked={formData.useProxy}
              onChange={(e) =>
                setFormData({ ...formData, useProxy: e.target.checked })
              }
            />
          </ListItem>

          {formData.useProxy && (
            <ListItem
              title="代理地址 *"
              subTitle={
                errors.proxyUrl ? (
                  <span style={{ color: "var(--red)" }}>{errors.proxyUrl}</span>
                ) : undefined
              }
            >
              <input
                type="text"
                value={formData.proxyUrl}
                onChange={(e) =>
                  setFormData({ ...formData, proxyUrl: e.target.value })
                }
                placeholder="http://localhost:port"
              />
            </ListItem>
          )}

          <ListItem
            title={
              Locale.Settings.Access.CustomProvider.Modal.ApiKey.Title + " *"
            }
            subTitle={
              errors.apiKey ? (
                <span style={{ color: "var(--red)" }}>{errors.apiKey}</span>
              ) : undefined
            }
          >
            <PasswordInput
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.currentTarget.value })
              }
              placeholder={
                Locale.Settings.Access.CustomProvider.Modal.ApiKey.Placeholder
              }
            />
          </ListItem>
        </List>
      </Modal>
    </div>
  );
}

function EditPromptModal(props: { id: string; onClose: () => void }) {
  const promptStore = usePromptStore();
  const prompt = promptStore.get(props.id);

  return prompt ? (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.EditModal.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            key=""
            onClick={props.onClose}
            text={Locale.UI.Confirm}
            bordered
          />,
        ]}
      >
        <div className={styles["edit-prompt-modal"]}>
          <input
            type="text"
            value={prompt.title}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-title"]}
            onInput={(e) =>
              promptStore.updatePrompt(
                props.id,
                (prompt) => (prompt.title = e.currentTarget.value),
              )
            }
          ></input>
          <Input
            value={prompt.content}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-content"]}
            rows={10}
            onInput={(e) =>
              promptStore.updatePrompt(
                props.id,
                (prompt) => (prompt.content = e.currentTarget.value),
              )
            }
          ></Input>
        </div>
      </Modal>
    </div>
  ) : null;
}

// 系统提示词编辑弹窗
function SystemPromptEditModal(props: {
  type: "optimize" | "topic" | "summarize";
  value: string;
  defaultValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [promptValue, setPromptValue] = useState(props.value);
  const title =
    props.type === "optimize"
      ? Locale.Settings.Prompt.SystemPrompts.OptimizeModel.Title
      : props.type === "topic"
      ? Locale.Settings.Prompt.SystemPrompts.Topic.Title
      : Locale.Settings.Prompt.SystemPrompts.Summarize.Title;
  const subTitle =
    props.type === "optimize"
      ? Locale.Settings.Prompt.SystemPrompts.OptimizeModel.SubTitle
      : props.type === "topic"
      ? Locale.Settings.Prompt.SystemPrompts.Topic.SubTitle
      : Locale.Settings.Prompt.SystemPrompts.Summarize.SubTitle;

  return (
    <div className="modal-mask">
      <Modal
        title={title}
        onClose={props.onClose}
        actions={[
          <IconButton
            key="save"
            onClick={() => {
              props.onSave(promptValue);
            }}
            text="保存"
            type="primary"
            bordered
          />,
          <IconButton
            key="cancel"
            onClick={props.onClose}
            text="取消"
            bordered
          />,
        ]}
      >
        <div className={styles["edit-prompt-modal"]}>
          <div className={styles["edit-prompt-subtitle"]}>{subTitle}</div>
          <Input
            value={promptValue}
            className={styles["edit-prompt-content"]}
            rows={10}
            onInput={(e) => setPromptValue(e.currentTarget.value)}
          ></Input>
          <div className={styles["edit-prompt-hint"]}>
            留空将使用默认提示词：{props.defaultValue}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function UserPromptModal(props: { onClose?: () => void }) {
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = userPrompts.concat(builtinPrompts);
  const [searchInput, setSearchInput] = useState("");
  const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
  const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;

  const [editingPromptId, setEditingPromptId] = useState<string>();

  useEffect(() => {
    if (searchInput.length > 0) {
      const searchResult = SearchService.search(searchInput);
      setSearchPrompts(searchResult);
    } else {
      setSearchPrompts([]);
    }
  }, [searchInput]);

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="add"
            onClick={() => {
              const promptId = promptStore.add({
                id: nanoid(),
                createdAt: Date.now(),
                title: "Empty Prompt",
                content: "Empty Prompt Content",
              });
              setEditingPromptId(promptId);
            }}
            icon={<AddIcon />}
            bordered
            text={Locale.Settings.Prompt.Modal.Add}
          />,
        ]}
      >
        <div className={styles["user-prompt-modal"]}>
          <input
            type="text"
            className={styles["user-prompt-search"]}
            placeholder={Locale.Settings.Prompt.Modal.Search}
            value={searchInput}
            onInput={(e) => setSearchInput(e.currentTarget.value)}
          ></input>

          <div className={styles["user-prompt-list"]}>
            {prompts.map((v, _) => (
              <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                <div className={styles["user-prompt-header"]}>
                  <div className={styles["user-prompt-title"]}>{v.title}</div>
                  <div className={styles["user-prompt-content"] + " one-line"}>
                    {v.content}
                  </div>
                </div>

                <div className={styles["user-prompt-buttons"]}>
                  {v.isUser && (
                    <IconButton
                      icon={<ClearIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => promptStore.remove(v.id!)}
                    />
                  )}
                  {v.isUser ? (
                    <IconButton
                      icon={<EditIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  ) : (
                    <IconButton
                      icon={<EyeIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  )}
                  <IconButton
                    icon={<CopyIcon />}
                    className={styles["user-prompt-button"]}
                    onClick={() => copyToClipboard(v.content)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {editingPromptId !== undefined && (
        <EditPromptModal
          id={editingPromptId!}
          onClose={() => setEditingPromptId(undefined)}
        />
      )}
    </div>
  );
}

function DangerItems() {
  const chatStore = useChatStore();
  const appConfig = useAppConfig();

  return (
    <List>
      <ListItem
        title={Locale.Settings.Danger.Reset.Title}
        subTitle={Locale.Settings.Danger.Reset.SubTitle}
      >
        <IconButton
          aria={Locale.Settings.Danger.Reset.Title}
          text={Locale.Settings.Danger.Reset.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
              appConfig.reset();
            }
          }}
          type="danger"
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Danger.Clear.Title}
        subTitle={Locale.Settings.Danger.Clear.SubTitle}
      >
        <IconButton
          aria={Locale.Settings.Danger.Clear.Title}
          text={Locale.Settings.Danger.Clear.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
              chatStore.clearAllData();
            }
          }}
          type="danger"
        />
      </ListItem>
    </List>
  );
}

function SyncConfigModal(props: { onClose?: () => void }) {
  const syncStore = useSyncStore();

  const [checkState, setCheckState] = useState<
    "none" | "checking" | "success" | "failed"
  >("none");

  async function handleCheck() {
    setCheckState("checking");
    try {
      const valid = await syncStore.check();
      setCheckState(valid ? "success" : "failed");
      if (valid) {
        showToast(Locale.Settings.Sync.CheckSuccess);
      } else {
        showToast(Locale.Settings.Sync.CheckFailed);
      }
    } catch (e) {
      setCheckState("failed");
      showToast(Locale.Settings.Sync.CheckFailed);
    }
  }

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Sync.Config.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="check"
            onClick={handleCheck}
            icon={
              checkState === "none" ? (
                <ConnectionIcon />
              ) : checkState === "checking" ? (
                <LoadingIcon />
              ) : checkState === "success" ? (
                <CloudSuccessIcon />
              ) : (
                <CloudFailIcon />
              )
            }
            bordered
            text={Locale.Settings.Sync.Config.Modal.Check}
          />,
          <IconButton
            key="confirm"
            onClick={props.onClose}
            icon={<ConfirmIcon />}
            bordered
            text={Locale.UI.Confirm}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Settings.Sync.Config.SyncType.Title}
            subTitle={Locale.Settings.Sync.Config.SyncType.SubTitle}
          >
            <Select
              value={syncStore.provider}
              onChange={(e) => {
                syncStore.update(
                  (config) =>
                    (config.provider = e.target.value as ProviderType),
                );
                setCheckState("none");
              }}
            >
              {Object.entries(ProviderType).map(([k, v]) => (
                <option value={v} key={k}>
                  {k}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem
            title={Locale.Settings.Sync.Config.Proxy.Title}
            subTitle={Locale.Settings.Sync.Config.Proxy.SubTitle}
          >
            <input
              type="checkbox"
              checked={syncStore.useProxy}
              onChange={(e) => {
                syncStore.update(
                  (config) => (config.useProxy = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
          {syncStore.useProxy ? (
            <ListItem
              title={Locale.Settings.Sync.Config.ProxyUrl.Title}
              subTitle={Locale.Settings.Sync.Config.ProxyUrl.SubTitle}
            >
              <input
                type="text"
                value={syncStore.proxyUrl}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.proxyUrl = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
          ) : null}
        </List>

        {/* 聊天数据同步分组 */}
        <List>
          <ListItem
            title={Locale.Settings.Sync.Config.SyncChat.Title}
            subTitle={Locale.Settings.Sync.Config.SyncChat.SubTitle}
          >
            <input
              type="checkbox"
              checked={syncStore.syncChat}
              onChange={(e) => {
                syncStore.update(
                  (config) => (config.syncChat = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>

          {syncStore.syncChat && (
            <ListItem
              title={Locale.Settings.Sync.Config.AutoSync.Title}
              subTitle={Locale.Settings.Sync.Config.AutoSync.SubTitle}
            >
              <input
                type="checkbox"
                checked={syncStore.autoSyncChat}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.autoSyncChat = e.currentTarget.checked),
                  );
                }}
              ></input>
            </ListItem>
          )}
        </List>

        {/* 配置数据同步分组 */}
        <List>
          <ListItem
            title={Locale.Settings.Sync.Config.SyncConfig.Title}
            subTitle={Locale.Settings.Sync.Config.SyncConfig.SubTitle}
          >
            <input
              type="checkbox"
              checked={syncStore.syncConfig}
              onChange={(e) => {
                syncStore.update(
                  (config) => (config.syncConfig = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.Sync.Config.Encryption.Title}
            subTitle={Locale.Settings.Sync.Config.Encryption.SubTitle}
          >
            <PasswordInput
              value={syncStore.encryptionPassword}
              placeholder={Locale.Settings.Sync.Config.Encryption.Placeholder}
              onChange={(e) => {
                syncStore.update(
                  (config) =>
                    (config.encryptionPassword = e.currentTarget.value),
                );
              }}
            ></PasswordInput>
          </ListItem>
        </List>

        {syncStore.provider === ProviderType.WebDAV && (
          <>
            <List>
              <ListItem title={Locale.Settings.Sync.Config.WebDav.Endpoint}>
                <input
                  type="text"
                  value={syncStore.webdav.endpoint}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.endpoint = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>

              <ListItem title={Locale.Settings.Sync.Config.WebDav.UserName}>
                <input
                  type="text"
                  value={syncStore.webdav.username}
                  placeholder={STORAGE_KEY}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.username = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>

              <ListItem title={Locale.Settings.Sync.Config.WebDav.Password}>
                <PasswordInput
                  value={syncStore.webdav.password}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.password = e.currentTarget.value),
                    );
                  }}
                ></PasswordInput>
              </ListItem>
            </List>
          </>
        )}

        {syncStore.provider === ProviderType.UpStash && (
          <List>
            <ListItem title={Locale.Settings.Sync.Config.UpStash.Endpoint}>
              <input
                type="text"
                value={syncStore.upstash.endpoint}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.endpoint = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.UpStash.UserName}>
              <input
                type="text"
                value={syncStore.upstash.username}
                placeholder={STORAGE_KEY}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.username = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
            <ListItem title={Locale.Settings.Sync.Config.UpStash.Password}>
              <PasswordInput
                value={syncStore.upstash.apiKey}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.upstash.apiKey = e.currentTarget.value),
                  );
                }}
              ></PasswordInput>
            </ListItem>
          </List>
        )}

        {syncStore.provider === ProviderType.GitHub && (
          <List>
            <ListItem title={Locale.Settings.Sync.Config.GitHub.Token}>
              <PasswordInput
                value={syncStore.github.token}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.github.token = e.currentTarget.value),
                  );
                }}
              ></PasswordInput>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.GitHub.Repo}>
              <input
                type="text"
                value={syncStore.github.repo}
                placeholder="owner/repo"
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.github.repo = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.GitHub.Branch}>
              <input
                type="text"
                value={syncStore.github.branch}
                placeholder="main"
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.github.branch = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.GitHub.Path}>
              <input
                type="text"
                value={syncStore.github.path}
                placeholder="backup"
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.github.path = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.GitHub.UserName}>
              <input
                type="text"
                value={syncStore.github.username}
                placeholder={STORAGE_KEY}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.github.username = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
          </List>
        )}

        {syncStore.provider === ProviderType.S3 && (
          <List>
            <ListItem title={Locale.Settings.Sync.Config.S3.Endpoint}>
              <input
                type="text"
                value={syncStore.s3.endpoint}
                placeholder="https://s3.amazonaws.com"
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.s3.endpoint = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.S3.Bucket}>
              <input
                type="text"
                value={syncStore.s3.bucket}
                placeholder="my-bucket"
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.s3.bucket = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.S3.Region}>
              <input
                type="text"
                value={syncStore.s3.region}
                placeholder="us-east-1"
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.s3.region = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.S3.AccessKey}>
              <input
                type="text"
                value={syncStore.s3.accessKey}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.s3.accessKey = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.S3.SecretKey}>
              <PasswordInput
                value={syncStore.s3.secretKey}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.s3.secretKey = e.currentTarget.value),
                  );
                }}
              ></PasswordInput>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.S3.UserName}>
              <input
                type="text"
                value={syncStore.s3.username}
                placeholder={STORAGE_KEY}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.s3.username = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
          </List>
        )}
      </Modal>
    </div>
  );
}

function SyncItems() {
  const syncStore = useSyncStore();
  const chatStore = useChatStore();
  const accessStore = useAccessStore();
  const maskStore = useMaskStore();
  const promptStore = usePromptStore();
  const appConfig = useAppConfig();

  const couldSync = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  // 统计聊天数据
  const chatOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    const messageCount = sessions.reduce((p, c) => p + c.messages.length, 0);
    return {
      sessions: sessions.length,
      messages: messageCount,
    };
  }, [chatStore.sessions]);

  // 统计配置数据
  const configOverview = useMemo(() => {
    // 模型服务配置：统计配置了 API Key 的服务商数量
    let configuredProviders = 0;
    // 动态生成 provider keys 从 ServiceProvider 配置
    const providerKeys = getAllProviders().map(
      (provider) => provider.storeKeys.apiKey,
    );
    providerKeys.forEach((key) => {
      if ((accessStore as any)[key]) {
        configuredProviders++;
      }
    });

    // 自定义服务商数量
    const customProviders = accessStore.customProviders?.length || 0;

    // 助手数量（用户自定义的）
    const userMasks = Object.values(maskStore.masks).filter(
      (m: any) => !m.builtin,
    ).length;

    // 提示词数量（用户自定义的）
    const userPrompts = promptStore.getUserPrompts().length;

    // MCP 配置数量
    let mcpCount = 0;
    try {
      const mcpRaw = localStorage.getItem("mcp_config");
      if (mcpRaw) {
        const mcpConfig = JSON.parse(mcpRaw);
        mcpCount = Object.keys(mcpConfig.mcpServers || {}).length;
      }
    } catch (e) {
      // ignore
    }

    // 检查通用配置修改数量
    let generalConfigCount = 0;
    // 主题
    if (appConfig.theme !== "auto") generalConfigCount++;
    // 配色
    if (appConfig.colorScheme !== "default") generalConfigCount++;
    // 字体大小
    if (appConfig.fontSize !== 14) generalConfigCount++;
    // 字体
    if (appConfig.fontFamily) generalConfigCount++;
    // TTS
    if (appConfig.ttsConfig?.enable) generalConfigCount++;
    // 实时语音
    if (appConfig.realtimeConfig?.enable) generalConfigCount++;
    // 头像
    if (appConfig.avatar !== "1f603") generalConfigCount++;

    return {
      providers: configuredProviders + customProviders,
      masks: userMasks,
      prompts: userPrompts,
      mcp: mcpCount,
      generalConfig: generalConfigCount,
    };
  }, [accessStore, maskStore.masks, promptStore, appConfig]);

  // 生成配置数据描述
  const configDesc = useMemo(() => {
    const parts: string[] = [];
    if (configOverview.providers > 0) {
      parts.push(`${configOverview.providers} 个模型服务`);
    }
    if (configOverview.generalConfig > 0) {
      parts.push(`${configOverview.generalConfig} 项通用配置`);
    }
    if (configOverview.masks > 0) {
      parts.push(`${configOverview.masks} 个助手`);
    }
    if (configOverview.prompts > 0) {
      parts.push(`${configOverview.prompts} 条提示词`);
    }
    if (configOverview.mcp > 0) {
      parts.push(`${configOverview.mcp} 个 MCP 服务`);
    }
    return parts.length > 0 ? parts.join("，") : "暂无配置数据";
  }, [configOverview]);

  // 上传数据（根据配置决定上传聊天和/或配置）
  const handleUpload = async () => {
    if (!couldSync) return;

    const willSyncChat = syncStore.syncChat;
    const willSyncConfig = syncStore.syncConfig;

    if (!willSyncChat && !willSyncConfig) {
      showToast("请先在配置中开启同步聊天或同步配置");
      return;
    }

    const syncItems = [];
    if (willSyncChat) syncItems.push("聊天数据");
    if (willSyncConfig) syncItems.push("配置数据");

    if (!confirm(`确定要上传 ${syncItems.join(" 和 ")} 到云端吗？`)) return;

    try {
      if (willSyncChat) {
        await syncStore.uploadChat();
      }
      if (willSyncConfig) {
        await syncStore.uploadConfig();
      }
      syncStore.markSyncTime();
      showToast(Locale.Settings.Sync.UploadSuccess);
    } catch (e) {
      showToast(Locale.Settings.Sync.UploadFailed);
      logger.error("[Upload]", e);
    }
  };

  // 下载数据（根据配置决定下载聊天和/或配置）
  const handleDownload = async () => {
    if (!couldSync) return;

    const willSyncChat = syncStore.syncChat;
    const willSyncConfig = syncStore.syncConfig;

    if (!willSyncChat && !willSyncConfig) {
      showToast("请先在配置中开启同步聊天或同步配置");
      return;
    }

    const syncItems = [];
    if (willSyncChat) syncItems.push("聊天数据");
    if (willSyncConfig) syncItems.push("配置数据");

    if (!confirm(`确定要下载云端 ${syncItems.join(" 和 ")} 吗？`)) return;

    try {
      if (willSyncChat) {
        await syncStore.downloadAndMergeChat();
      }
      if (willSyncConfig) {
        await syncStore.downloadConfig();
      }
      syncStore.markSyncTime();
      showToast(Locale.Settings.Sync.DownloadSuccess);
      setTimeout(() => location.reload(), 1000);
    } catch (e: any) {
      if (e.message === "Remote config is empty") {
        showToast(Locale.Settings.Sync.EmptyRemote);
      } else {
        showToast(Locale.Settings.Sync.DownloadFailed);
      }
      logger.error("[Download]", e);
    }
  };

  // 生成同步状态描述
  const syncStatusDesc = useMemo(() => {
    const items = [];
    if (syncStore.syncChat) {
      items.push(syncStore.autoSyncChat ? "聊天(自动)" : "聊天");
    }
    if (syncStore.syncConfig) {
      items.push("配置");
    }
    return items.length > 0 ? `已开启: ${items.join(", ")}` : "未开启同步";
  }, [syncStore.syncChat, syncStore.syncConfig, syncStore.autoSyncChat]);

  return (
    <>
      <List>
        <ListItem
          title={Locale.Settings.Sync.CloudState}
          subTitle={
            syncStore.lastProvider
              ? `${new Date(syncStore.lastSyncTime).toLocaleString()} [${
                  syncStore.lastProvider
                }] · ${syncStatusDesc}`
              : `${Locale.Settings.Sync.NotSyncYet} · ${syncStatusDesc}`
          }
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <IconButton
              aria={Locale.Settings.Sync.CloudState + Locale.UI.Config}
              icon={<ConfigIcon />}
              text={Locale.UI.Config}
              onClick={() => {
                setShowSyncConfigModal(true);
              }}
            />
            {couldSync && (
              <>
                <IconButton
                  icon={<UploadIcon />}
                  text={Locale.Settings.Sync.Upload}
                  onClick={handleUpload}
                />
                <IconButton
                  icon={<DownloadIcon />}
                  text={Locale.Settings.Sync.Download}
                  onClick={handleDownload}
                />
              </>
            )}
          </div>
        </ListItem>

        <ListItem
          title={Locale.Settings.Sync.ChatData}
          subTitle={`${chatOverview.sessions} 次对话，${chatOverview.messages} 条消息`}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <IconButton
              aria={Locale.Settings.Sync.ChatData + Locale.UI.Export}
              icon={<UploadIcon />}
              text={Locale.UI.Export}
              onClick={() => {
                syncStore.exportChatData();
              }}
            />
            <IconButton
              aria={Locale.Settings.Sync.ChatData + Locale.UI.Import}
              icon={<DownloadIcon />}
              text={Locale.UI.Import}
              onClick={() => {
                syncStore.importChatData();
              }}
            />
          </div>
        </ListItem>

        <ListItem title={Locale.Settings.Sync.ConfigData} subTitle={configDesc}>
          <div style={{ display: "flex", gap: "8px" }}>
            <IconButton
              aria={Locale.Settings.Sync.ConfigData + Locale.UI.Export}
              icon={<UploadIcon />}
              text={Locale.UI.Export}
              onClick={() => {
                syncStore.exportConfigData();
              }}
            />
            <IconButton
              aria={Locale.Settings.Sync.ConfigData + Locale.UI.Import}
              icon={<DownloadIcon />}
              text={Locale.UI.Import}
              onClick={() => {
                syncStore.importConfigData();
              }}
            />
          </div>
        </ListItem>
      </List>

      {showSyncConfigModal && (
        <SyncConfigModal onClose={() => setShowSyncConfigModal(false)} />
      )}
    </>
  );
}

function MaskManageSection() {
  const maskStore = useMaskStore();
  const masks = useMaskStore((s) => s.masks);
  const chatStore = useChatStore();
  const config = useAppConfig();
  const [editingMaskId, setEditingMaskId] = useState<string | undefined>();
  const editingMask = editingMaskId ? masks[editingMaskId] : undefined;

  // 自定义助手：仅用户创建的（排除默认助手），按添加时间倒序
  const customMasks = Object.values(masks)
    .filter((m) => m.id !== DEFAULT_MASK_ID)
    .sort((a, b) => b.createdAt - a.createdAt);
  // 内置助手：默认助手 + 预设列表
  const defaultMask = masks[DEFAULT_MASK_ID];
  const builtinMasks = (defaultMask ? [defaultMask] : []).concat(
    getBuiltinMasks(),
  );

  return (
    <>
      <List>
        <ListItem
          title={Locale.Settings.Mask.ModelIcon.Title}
          subTitle={Locale.Settings.Mask.ModelIcon.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Mask.ModelIcon.Title}
            type="checkbox"
            checked={config.useModelIconAsAvatar}
            onChange={(e) =>
              config.update(
                (c) => (c.useModelIconAsAvatar = e.currentTarget.checked),
              )
            }
          />
        </ListItem>
      </List>

      <List>
        <ListItem
          title={Locale.Mask.Management}
          subTitle={Locale.Mask.Page.SubTitle(customMasks.length)}
        >
          <IconButton
            icon={<AddIcon />}
            text={Locale.Mask.NewMask}
            bordered
            onClick={() => {
              const created = maskStore.create();
              setEditingMaskId(created.id);
            }}
          />
        </ListItem>
      </List>

      {/* 自定义助手：可删除，与内置助手视觉隔离 */}
      <div className={styles["mask-group"]} data-group="custom">
        <div className={styles["mask-group-title"]}>
          {Locale.Mask.GroupCustom}
        </div>
        <List>
          {customMasks.map((m) => (
            <ListItem
              key={m.id}
              title={m.name}
              subTitle={`${getMaskEffectiveModel(m)} / ${Locale.Mask.Item.Info(
                m.context.length,
              )} / ${Locale.Mask.ConversationCount(
                chatStore.getSessionsByMask(m.id).length,
              )}`}
              icon={
                <MaskAvatar
                  avatar={m.avatar}
                  model={getMaskEffectiveModel(m) as any}
                />
              }
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <IconButton
                  icon={<EditIcon />}
                  text={Locale.Mask.Item.Edit}
                  onClick={() => setEditingMaskId(m.id)}
                />
                <IconButton
                  icon={<DeleteIcon />}
                  text={Locale.Mask.Item.Delete}
                  onClick={async () => {
                    if (await showConfirm(Locale.Mask.Item.DeleteConfirm)) {
                      maskStore.delete(m.id);
                    }
                  }}
                />
              </div>
            </ListItem>
          ))}
        </List>
      </div>

      {/* 内置助手：仅查看，修改后变为新增自定义助手 */}
      <div className={styles["mask-group"]} data-group="builtin">
        <div className={styles["mask-group-title"]}>
          {Locale.Mask.GroupBuiltin}
        </div>
        <List>
          {builtinMasks.map((m) => (
            <ListItem
              key={m.id}
              title={m.name}
              subTitle={`${getMaskEffectiveModel(m)} / ${Locale.Mask.Item.Info(
                m.context.length,
              )}${
                m.id === DEFAULT_MASK_ID
                  ? ` / ${Locale.Mask.ConversationCount(
                      chatStore.getSessionsByMask(m.id).length,
                    )}`
                  : ""
              }`}
              icon={
                <MaskAvatar
                  avatar={m.avatar}
                  model={getMaskEffectiveModel(m) as any}
                />
              }
            >
              <IconButton
                icon={<EditIcon />}
                text={Locale.Mask.Item.View}
                onClick={() => {
                  if (masks[m.id]) {
                    setEditingMaskId(m.id);
                  } else {
                    const created = maskStore.create({ ...m });
                    setEditingMaskId(created.id);
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </div>

      {editingMask && (
        <div className="modal-mask">
          <Modal
            title={
              editingMask.id === DEFAULT_MASK_ID
                ? Locale.Mask.DefaultName
                : Locale.Mask.EditModal.Title
            }
            onClose={() => setEditingMaskId(undefined)}
            actions={
              editingMask.id !== DEFAULT_MASK_ID
                ? [
                    <IconButton
                      key="copy"
                      icon={<CopyIcon />}
                      bordered
                      text={Locale.Mask.EditModal.Clone}
                      onClick={() => {
                        maskStore.create(editingMask);
                        setEditingMaskId(undefined);
                      }}
                    />,
                  ]
                : []
            }
          >
            <MaskConfig
              mask={editingMask}
              updateMask={(updater) =>
                maskStore.updateMask(editingMaskId!, updater)
              }
              readonly={editingMask.id === DEFAULT_MASK_ID}
            />
          </Modal>
        </div>
      )}
    </>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSystemEmojiPicker, setShowSystemEmojiPicker] = useState(false);
  const [showAssistantEmojiPicker, setShowAssistantEmojiPicker] =
    useState(false);
  const [currentTab, setCurrentTab] = useState<SettingsTab>(
    SettingsTab.General,
  );
  const config = useAppConfig();
  const updateConfig = config.update;

  const updateStore = useUpdateStore();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const currentVersion = updateStore.formatVersion(updateStore.version);
  const remoteId = updateStore.formatVersion(updateStore.remoteVersion);
  const hasNewVersion = semverCompare(currentVersion, remoteId) === -1;
  const updateUrl = getClientConfig()?.isApp ? RELEASE_URL : UPDATE_URL;

  // 监听从聊天页面跳转到模型服务配置的事件
  useEffect(() => {
    const handleSwitchToModelService = (event: CustomEvent) => {
      const provider = event.detail?.provider;

      // 切换到模型服务标签
      setCurrentTab(SettingsTab.ModelService);

      if (provider) {
        logger.debug("Switch to provider config:", provider);

        // 自动展开该厂商的配置（同时处理标准厂商和自定义厂商）
        // 使用setTimeout确保在标签切换后再展开
        setTimeout(() => {
          setCollapsedProviders((prev) => ({
            ...prev,
            [provider]: false,
          }));

          setCollapsedCustomProviders((prev) => ({
            ...prev,
            [provider]: false,
          }));
        }, 50);

        // 等待展开动画完成后再滚动定位
        setTimeout(() => {
          const providerElement = document.querySelector(
            `[data-provider="${provider}"]`,
          );

          if (providerElement) {
            providerElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });

            // 添加高亮效果
            providerElement.classList.add(styles["provider-highlight"]);
            setTimeout(() => {
              providerElement.classList.remove(styles["provider-highlight"]);
            }, 1000);
          } else {
            // 如果第一次没找到，再延迟一次尝试
            setTimeout(() => {
              const retryElement = document.querySelector(
                `[data-provider="${provider}"]`,
              );
              if (retryElement) {
                retryElement.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });

                retryElement.classList.add(styles["provider-highlight"]);
                setTimeout(() => {
                  retryElement.classList.remove(styles["provider-highlight"]);
                }, 1000);
              }
            }, 200);
          }
        }, 400); // 增加延迟，等待展开动画完成
      }
    };

    window.addEventListener(
      "switchToModelService",
      handleSwitchToModelService as EventListener,
    );

    return () => {
      window.removeEventListener(
        "switchToModelService",
        handleSwitchToModelService as EventListener,
      );
    };
  }, []);

  function checkUpdate(force = false) {
    setCheckingUpdate(true);
    updateStore.getLatestVersion(force).then(() => {
      setCheckingUpdate(false);
    });
  }

  const accessStore = useAccessStore();

  // 确保访问存储状态是最新的
  useEffect(() => {
    accessStore.fetch();
  }, [accessStore]);

  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    [accessStore],
  );

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const [shouldShowPromptModal, setShowPromptModal] = useState(false);
  const [editingSystemPrompt, setEditingSystemPrompt] = useState<
    "optimize" | "topic" | "summarize" | null
  >(null);
  const [showModelManager, setShowModelManager] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [showAddCustomProvider, setShowAddCustomProvider] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState<string | null>(null);
  const [modelConfigForm, setModelConfigForm] = useState({
    modelId: "",
    category: "",
    capabilities: {
      vision: false,
      reasoning: false,
      tools: false,
    },
    contextTokens: undefined as number | undefined,
  });
  const [collapsedProviders, setCollapsedProviders] = useState<
    Record<string, boolean>
  >(() => {
    // 动态生成初始折叠状态 - 只有启用的厂商才展开
    const initialState: Record<string, boolean> = {};
    getAllProviders().forEach((provider) => {
      const isEnabled = accessStore.enabledProviders?.[provider.name] || false;
      // 启用的厂商默认展开，未启用的默认折叠
      initialState[provider.name] = !isEnabled;
    });
    return initialState;
  });

  // 自定义服务商的折叠状态 - 只有启用的厂商才展开
  const [collapsedCustomProviders, setCollapsedCustomProviders] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    accessStore.customProviders.forEach((provider) => {
      // 启用的厂商默认展开，未启用的默认折叠
      initialState[provider.id] = !provider.enabled;
    });
    return initialState;
  });

  // 当自定义服务商列表变化时，更新折叠状态
  useEffect(() => {
    setCollapsedCustomProviders((prev) => {
      const newState = { ...prev };
      accessStore.customProviders.forEach((provider) => {
        if (!(provider.id in newState)) {
          // 新添加的服务商：启用的展开，未启用的折叠
          newState[provider.id] = !provider.enabled;
        }
      });
      return newState;
    });
  }, [accessStore.customProviders]);

  useEffect(() => {
    // checks per minutes
    checkUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        try {
          navigate(Path.Home);
        } catch (error) {
          logger.error("Navigation error:", error);
          window.location.href = "/";
        }
      }
    };
    if (clientConfig?.isApp) {
      // Force to set custom endpoint to true if it's app
      accessStore.update((state) => {
        state.useCustomConfig = true;
      });
    }
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientConfig = getClientConfig();
  const showAccessCode = enabledAccessControl && !clientConfig?.isApp;

  const accessCodeComponent = showAccessCode && (
    <ListItem
      title={Locale.Settings.Access.AccessCode.Title}
      subTitle={Locale.Settings.Access.AccessCode.SubTitle}
    >
      <PasswordInput
        value={accessStore.accessCode}
        type="text"
        placeholder={Locale.Settings.Access.AccessCode.Placeholder}
        onChange={(e) => {
          accessStore.updateAccessCode(e.currentTarget.value);
        }}
      />
    </ListItem>
  );

  const useCustomConfigComponent = // Conditionally render the following ListItem based on clientConfig.isApp
    !clientConfig?.isApp && ( // only show if isApp is false
      <ListItem
        title={Locale.Settings.Access.CustomEndpoint.Title}
        subTitle={Locale.Settings.Access.CustomEndpoint.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.CustomEndpoint.Title}
          type="checkbox"
          checked={accessStore.useCustomConfig}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.useCustomConfig = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
    );

  // 动态生成厂商配置组件
  const createProviderConfigComponent = (provider: ProviderConfig) => {
    const storeKeys = provider.storeKeys;
    const ui = provider.ui || {};

    return (
      <>
        {/* 端点配置 */}
        {ui.showEndpoint !== false && (
          <ListItem
            title={Locale.Settings.Access.OpenAI.Endpoint.Title}
            subTitle={
              <span className={styles["long-text-wrap"]}>
                {Locale.Settings.Access.OpenAI.Endpoint.SubTitle}
              </span>
            }
          >
            <input
              aria-label={Locale.Settings.Access.OpenAI.Endpoint.Title}
              type="text"
              value={(accessStore as any)[storeKeys.baseUrl] || ""}
              placeholder={(provider as any).defaultBaseUrl}
              onChange={(e) =>
                accessStore.update(
                  (access) =>
                    ((access as any)[storeKeys.baseUrl] =
                      e.currentTarget.value),
                )
              }
            />
          </ListItem>
        )}

        {/* Response API 选项 */}
        {ui.showResponseApi && storeKeys.apiType && (
          <ListItem
            title={Locale.Settings.Access.OpenAI.UseResponseApi.Title}
            subTitle={Locale.Settings.Access.OpenAI.UseResponseApi.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Access.OpenAI.UseResponseApi.Title}
              type="checkbox"
              checked={(accessStore as any)[storeKeys.apiType!] === "response"}
              onChange={(e) => {
                accessStore.update(
                  (access) =>
                    ((access as any)[storeKeys.apiType!] = e.currentTarget
                      .checked
                      ? "response"
                      : "chat"),
                );
              }}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
              }}
            />
          </ListItem>
        )}

        {/* API 路径配置 */}
        {ui.showApiPath !== false && storeKeys.apiPath && (
          <ListItem
            title={Locale.Settings.Access.OpenAI.ApiPath.Title}
            subTitle={Locale.Settings.Access.OpenAI.ApiPath.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Access.OpenAI.ApiPath.Title}
              type="text"
              value={(accessStore as any)[storeKeys.apiPath!] || ""}
              placeholder={
                storeKeys.apiType &&
                (accessStore as any)[storeKeys.apiType!] === "response"
                  ? "/responses"
                  : "/chat/completions"
              }
              onChange={(e) =>
                accessStore.update(
                  (access) =>
                    ((access as any)[storeKeys.apiPath!] =
                      e.currentTarget.value),
                )
              }
            />
          </ListItem>
        )}

        {/* API Key */}
        <ListItem
          title={Locale.Settings.Access.OpenAI.ApiKey.Title}
          subTitle={Locale.Settings.Access.OpenAI.ApiKey.SubTitle}
        >
          <PasswordInput
            aria-label={Locale.Settings.Access.OpenAI.ApiKey.Title}
            value={(accessStore as any)[storeKeys.apiKey] || ""}
            type="text"
            placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
            onChange={(e) => {
              accessStore.update(
                (access) =>
                  ((access as any)[storeKeys.apiKey] = e.currentTarget.value),
              );
            }}
          />
        </ListItem>

        {/* Azure API Version */}
        {provider.id === "azure" && storeKeys.apiVersion && (
          <ListItem
            title={Locale.Settings.Access.Azure.ApiVerion.Title}
            subTitle={Locale.Settings.Access.Azure.ApiVerion.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Access.Azure.ApiVerion.Title}
              type="text"
              value={(accessStore as any)[storeKeys.apiVersion!] || ""}
              placeholder="2023-08-01-preview"
              onChange={(e) =>
                accessStore.update(
                  (access) =>
                    ((access as any)[storeKeys.apiVersion!] =
                      e.currentTarget.value),
                )
              }
            />
          </ListItem>
        )}

        {/* Google API Version */}
        {provider.id === "google" && (
          <ListItem
            title={Locale.Settings.Access.Google.ApiVersion.Title}
            subTitle={Locale.Settings.Access.Google.ApiVersion.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Access.Google.ApiVersion.Title}
              type="text"
              value={(accessStore as any).googleApiVersion || ""}
              placeholder="2023-08-01-preview"
              onChange={(e) =>
                accessStore.update(
                  (access) =>
                    ((access as any).googleApiVersion = e.currentTarget.value),
                )
              }
            />
          </ListItem>
        )}

        {/* Google Safety Settings */}
        {provider.id === "google" && (
          <ListItem
            title={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
            subTitle={
              Locale.Settings.Access.Google.GoogleSafetySettings.SubTitle
            }
          >
            <Select
              aria-label={
                Locale.Settings.Access.Google.GoogleSafetySettings.Title
              }
              value={accessStore.googleSafetySettings}
              onChange={(e) => {
                accessStore.update(
                  (access) =>
                    (access.googleSafetySettings = e.target
                      .value as GoogleSafetySettingsThreshold),
                );
              }}
            >
              {Object.entries(GoogleSafetySettingsThreshold).map(([k, v]) => (
                <option value={v} key={k}>
                  {k}
                </option>
              ))}
            </Select>
          </ListItem>
        )}

        {/* Anthropic API Version */}
        {provider.id === "anthropic" && (
          <ListItem
            title={Locale.Settings.Access.Anthropic.ApiVerion.Title}
            subTitle={Locale.Settings.Access.Anthropic.ApiVerion.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Access.Anthropic.ApiVerion.Title}
              type="text"
              value={(accessStore as any).anthropicApiVersion || ""}
              placeholder="2023-06-01"
              onChange={(e) =>
                accessStore.update(
                  (access) =>
                    ((access as any).anthropicApiVersion =
                      e.currentTarget.value),
                )
              }
            />
          </ListItem>
        )}

        {/* 代理配置 */}
        {ui.showProxy !== false && storeKeys.useProxy && (
          <ListItem
            title={Locale.Settings.Access.OpenAI.UseProxy.Title}
            subTitle={Locale.Settings.Access.OpenAI.UseProxy.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Access.OpenAI.UseProxy.Title}
              type="checkbox"
              checked={(accessStore as any)[storeKeys.useProxy!] || false}
              onChange={(e) =>
                accessStore.update(
                  (access) =>
                    ((access as any)[storeKeys.useProxy!] =
                      e.currentTarget.checked),
                )
              }
            />
          </ListItem>
        )}

        {/* 代理 URL */}
        {ui.showProxy !== false &&
          storeKeys.useProxy &&
          storeKeys.proxyUrl &&
          (accessStore as any)[storeKeys.useProxy!] && (
            <ListItem
              title={Locale.Settings.Access.OpenAI.ProxyUrl.Title}
              subTitle={Locale.Settings.Access.OpenAI.ProxyUrl.SubTitle}
            >
              <input
                aria-label={Locale.Settings.Access.OpenAI.ProxyUrl.Title}
                type="text"
                value={(accessStore as any)[storeKeys.proxyUrl!] || ""}
                placeholder="http://localhost:port"
                onChange={(e) =>
                  accessStore.update(
                    (access) =>
                      ((access as any)[storeKeys.proxyUrl!] =
                        e.currentTarget.value),
                  )
                }
              />
            </ListItem>
          )}
      </>
    );
  };

  // 分页标签配置
  const tabConfig = [
    {
      key: SettingsTab.General,
      label: Locale.Settings.Tab.General,
      icon: "⚙️",
    },
    { key: SettingsTab.Sync, label: Locale.Settings.Tab.Sync, icon: "☁️" },
    { key: SettingsTab.Mask, label: Locale.Settings.Tab.Mask, icon: "🎭" },
    { key: SettingsTab.Prompt, label: Locale.Settings.Tab.Prompt, icon: "💬" },
    {
      key: SettingsTab.ModelService,
      label: Locale.Settings.Tab.ModelService,
      icon: "🔧",
    },
    {
      key: SettingsTab.ModelConfig,
      label: Locale.Settings.Tab.ModelConfig,
      icon: "🤖",
    },
    { key: SettingsTab.Voice, label: Locale.Settings.Tab.Voice, icon: "🔊" },
  ];

  // 渲染分页内容
  const renderTabContent = () => {
    switch (currentTab) {
      case SettingsTab.General:
        return renderGeneralSettings();
      case SettingsTab.Sync:
        return renderSyncSettings();
      case SettingsTab.Mask:
        return renderMaskSettings();
      case SettingsTab.Prompt:
        return renderPromptSettings();
      case SettingsTab.ModelService:
        return renderModelServiceSettings();
      case SettingsTab.ModelConfig:
        return renderModelConfigSettings();
      case SettingsTab.Voice:
        return renderVoiceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  // 通用配置
  const renderGeneralSettings = () => (
    <>
      <List>
        <ListItem title={Locale.Settings.Avatar}>
          <div className={styles["avatar-group"]}>
            <Popover
              onClose={() => setShowSystemEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.systemAvatar = avatar));
                    setShowSystemEmojiPicker(false);
                  }}
                />
              }
              open={showSystemEmojiPicker}
            >
              <div
                aria-label={Locale.Settings.AvatarTip.System}
                title={Locale.Settings.AvatarTip.System}
                tabIndex={0}
                className={styles.avatar}
                onClick={() => {
                  setShowSystemEmojiPicker(!showSystemEmojiPicker);
                }}
              >
                <Avatar avatar={config.systemAvatar} />
              </div>
            </Popover>

            <Popover
              onClose={() => setShowAssistantEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.assistantAvatar = avatar));
                    setShowAssistantEmojiPicker(false);
                  }}
                />
              }
              open={showAssistantEmojiPicker}
            >
              <div
                aria-label={Locale.Settings.AvatarTip.Assistant}
                title={Locale.Settings.AvatarTip.Assistant}
                tabIndex={0}
                className={styles.avatar}
                onClick={() => {
                  setShowAssistantEmojiPicker(!showAssistantEmojiPicker);
                }}
              >
                <Avatar avatar={config.assistantAvatar} />
              </div>
            </Popover>

            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.avatar = avatar));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                aria-label={Locale.Settings.AvatarTip.User}
                title={Locale.Settings.AvatarTip.User}
                tabIndex={0}
                className={styles.avatar}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                }}
              >
                <Avatar avatar={config.avatar} />
              </div>
            </Popover>
          </div>
        </ListItem>

        <ListItem
          title={Locale.Settings.Update.Version(currentVersion ?? "unknown")}
          subTitle={
            checkingUpdate
              ? Locale.Settings.Update.IsChecking
              : hasNewVersion
              ? Locale.Settings.Update.FoundUpdate(remoteId ?? "ERROR")
              : Locale.Settings.Update.IsLatest
          }
        >
          {checkingUpdate ? (
            <LoadingIcon />
          ) : hasNewVersion ? (
            clientConfig?.isApp ? (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                text={Locale.Settings.Update.GoToUpdate}
                onClick={() => clientUpdate()}
              />
            ) : (
              <Link href={updateUrl} target="_blank" className="link">
                {Locale.Settings.Update.GoToUpdate}
              </Link>
            )
          ) : (
            <IconButton
              icon={<ResetIcon></ResetIcon>}
              text={Locale.Settings.Update.CheckUpdate}
              onClick={() => checkUpdate(true)}
            />
          )}
        </ListItem>

        <ListItem title={Locale.Settings.SendKey}>
          <Select
            aria-label={Locale.Settings.SendKey}
            value={config.submitKey}
            onChange={(e) => {
              updateConfig(
                (config) =>
                  (config.submitKey = e.target.value as any as SubmitKey),
              );
            }}
          >
            {Object.values(SubmitKey).map((v) => (
              <option value={v} key={v}>
                {v}
              </option>
            ))}
          </Select>
        </ListItem>

        <ListItem title={Locale.Settings.Theme}>
          <Select
            aria-label={Locale.Settings.Theme}
            value={config.theme}
            onChange={(e) => {
              updateConfig(
                (config) => (config.theme = e.target.value as any as Theme),
              );
            }}
          >
            {Object.values(Theme).map((v) => (
              <option value={v} key={v}>
                {v}
              </option>
            ))}
          </Select>
        </ListItem>

        <ListItem title={Locale.Settings.ColorScheme?.Title || "Color Scheme"}>
          <Select
            aria-label={Locale.Settings.ColorScheme?.Title || "Color Scheme"}
            value={config.colorScheme}
            onChange={(e) => {
              updateConfig(
                (config) => (config.colorScheme = e.target.value as any),
              );
            }}
          >
            {Object.values(ColorScheme).map((v) => (
              <option value={v} key={v}>
                {Locale.Settings.ColorScheme?.Options?.[v] || v}
              </option>
            ))}
          </Select>
        </ListItem>

        <ListItem title={Locale.Settings.Lang.Name}>
          <Select
            aria-label={Locale.Settings.Lang.Name}
            value={getLang()}
            onChange={(e) => {
              changeLang(e.target.value as any);
            }}
          >
            {AllLangs.map((lang) => (
              <option value={lang} key={lang}>
                {ALL_LANG_OPTIONS[lang]}
              </option>
            ))}
          </Select>
        </ListItem>

        <ListItem
          title={Locale.Settings.FontSize.Title}
          subTitle={Locale.Settings.FontSize.SubTitle}
        >
          <InputRange
            aria={Locale.Settings.FontSize.Title}
            title={`${config.fontSize ?? 14}px`}
            value={config.fontSize}
            min="12"
            max="40"
            step="1"
            onChange={(e) =>
              updateConfig(
                (config) =>
                  (config.fontSize = Number.parseInt(e.currentTarget.value)),
              )
            }
          ></InputRange>
        </ListItem>

        <ListItem
          title={Locale.Settings.FontFamily.Title}
          subTitle={Locale.Settings.FontFamily.SubTitle}
        >
          <Select
            aria-label={Locale.Settings.FontFamily.Title}
            value={
              // 检查当前值是否在预设列表中
              [
                "",
                "Microsoft YaHei",
                "SimSun",
                "SimHei",
                "KaiTi",
                "FangSong",
                "PingFang SC",
                "Hiragino Sans GB",
                "Source Han Sans SC",
                "Source Han Serif SC",
                "Noto Sans SC",
                "Arial",
                "Helvetica Neue",
                "Georgia",
                "Times New Roman",
                "Consolas",
              ].includes(config.fontFamily)
                ? config.fontFamily
                : "__custom__"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "__custom__") {
                const customFont = prompt("请输入字体名称", config.fontFamily);
                if (customFont !== null) {
                  updateConfig((config) => (config.fontFamily = customFont));
                }
              } else {
                updateConfig((config) => (config.fontFamily = value));
              }
            }}
          >
            <option value="">默认字体</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimSun">宋体</option>
            <option value="SimHei">黑体</option>
            <option value="KaiTi">楷体</option>
            <option value="FangSong">仿宋</option>
            <option value="PingFang SC">苹方</option>
            <option value="Hiragino Sans GB">冬青黑体</option>
            <option value="Source Han Sans SC">思源黑体</option>
            <option value="Source Han Serif SC">思源宋体</option>
            <option value="Noto Sans SC">Noto Sans SC</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica Neue">Helvetica</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Consolas">Consolas</option>
            <option value="__custom__">
              {config.fontFamily &&
              ![
                "",
                "Microsoft YaHei",
                "SimSun",
                "SimHei",
                "KaiTi",
                "FangSong",
                "PingFang SC",
                "Hiragino Sans GB",
                "Source Han Sans SC",
                "Source Han Serif SC",
                "Noto Sans SC",
                "Arial",
                "Helvetica Neue",
                "Georgia",
                "Times New Roman",
                "Consolas",
              ].includes(config.fontFamily)
                ? `自定义: ${config.fontFamily}`
                : "自定义..."}
            </option>
          </Select>
        </ListItem>

        <ListItem
          title={Locale.Settings.AutoGenerateTitle.Title}
          subTitle={Locale.Settings.AutoGenerateTitle.SubTitle}
        >
          <input
            aria-label={Locale.Settings.AutoGenerateTitle.Title}
            type="checkbox"
            checked={config.enableAutoGenerateTitle}
            onChange={(e) =>
              updateConfig(
                (config) =>
                  (config.enableAutoGenerateTitle = e.currentTarget.checked),
              )
            }
          ></input>
        </ListItem>

        <ListItem
          title={Locale.Settings.SendPreviewBubble.Title}
          subTitle={Locale.Settings.SendPreviewBubble.SubTitle}
        >
          <input
            aria-label={Locale.Settings.SendPreviewBubble.Title}
            type="checkbox"
            checked={config.sendPreviewBubble}
            onChange={(e) =>
              updateConfig(
                (config) =>
                  (config.sendPreviewBubble = e.currentTarget.checked),
              )
            }
          ></input>
        </ListItem>

        <ListItem
          title={Locale.Mask.Config.Artifacts.Title}
          subTitle={Locale.Mask.Config.Artifacts.SubTitle}
        >
          <input
            aria-label={Locale.Mask.Config.Artifacts.Title}
            type="checkbox"
            checked={config.enableArtifacts}
            onChange={(e) =>
              updateConfig(
                (config) => (config.enableArtifacts = e.currentTarget.checked),
              )
            }
          ></input>
        </ListItem>

        <ListItem
          title={Locale.Mask.Config.CodeFold.Title}
          subTitle={Locale.Mask.Config.CodeFold.SubTitle}
        >
          <input
            aria-label={Locale.Mask.Config.CodeFold.Title}
            type="checkbox"
            checked={config.enableCodeFold}
            data-testid="enable-code-fold-checkbox"
            onChange={(e) =>
              updateConfig(
                (config) => (config.enableCodeFold = e.currentTarget.checked),
              )
            }
          ></input>
        </ListItem>

        {/* 访问码配置 - 当启用访问控制时显示 */}
        {(accessStore.enabledAccessControl() ||
          accessStore.hasServerProviderConfig) && (
          <ListItem
            title={Locale.Settings.AccessCode.Title}
            subTitle={Locale.Settings.AccessCode.SubTitle}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <PasswordInput
                value={accessStore.accessCode}
                type="text"
                placeholder={Locale.Settings.AccessCode.Placeholder}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.accessCode = e.currentTarget.value),
                  );
                }}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: accessStore.accessCode ? "#4CAF50" : "#FF9800",
                }}
              >
                {accessStore.accessCode
                  ? Locale.Settings.AccessCode.Status.Valid
                  : Locale.Settings.AccessCode.Status.Enabled}
              </span>
            </div>
          </ListItem>
        )}
      </List>
      <DangerItems />
    </>
  );

  // 云同步设置
  const renderSyncSettings = () => <SyncItems />;

  // 助手设置
  const renderMaskSettings = () => <MaskManageSection />;

  // 提示词设置
  const renderPromptSettings = () => {
    const getSystemPromptValue = (type: "optimize" | "topic" | "summarize") => {
      if (type === "optimize") {
        return (
          config.modelConfig.optimizeModelPrompt ||
          Locale.Settings.OptimizeModel.Prompt.Placeholder
        );
      } else if (type === "topic") {
        return config.modelConfig.topicPrompt || Locale.Store.Prompt.Topic;
      } else {
        return (
          config.modelConfig.summarizePrompt || Locale.Store.Prompt.Summarize
        );
      }
    };

    const getSystemPromptDefault = (
      type: "optimize" | "topic" | "summarize",
    ) => {
      if (type === "optimize") {
        return Locale.Settings.OptimizeModel.Prompt.Placeholder;
      } else if (type === "topic") {
        return Locale.Store.Prompt.Topic;
      } else {
        return Locale.Store.Prompt.Summarize;
      }
    };

    const saveSystemPrompt = (
      type: "optimize" | "topic" | "summarize",
      value: string,
    ) => {
      if (type === "optimize") {
        updateConfig(
          (config) =>
            (config.modelConfig.optimizeModelPrompt =
              value === Locale.Settings.OptimizeModel.Prompt.Placeholder
                ? ""
                : value),
        );
      } else if (type === "topic") {
        updateConfig(
          (config) =>
            (config.modelConfig.topicPrompt =
              value === Locale.Store.Prompt.Topic ? "" : value),
        );
      } else if (type === "summarize") {
        updateConfig(
          (config) =>
            (config.modelConfig.summarizePrompt =
              value === Locale.Store.Prompt.Summarize ? "" : value),
        );
      }
      setEditingSystemPrompt(null);
    };

    return (
      <>
        <List>
          <ListItem
            title={Locale.Settings.Prompt.Disable.Title}
            subTitle={Locale.Settings.Prompt.Disable.SubTitle}
          >
            <input
              aria-label={Locale.Settings.Prompt.Disable.Title}
              type="checkbox"
              checked={config.disablePromptHint}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.disablePromptHint = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.Prompt.List}
            subTitle={Locale.Settings.Prompt.ListCount(
              builtinCount,
              customCount,
            )}
          >
            <IconButton
              aria={Locale.Settings.Prompt.List + Locale.Settings.Prompt.Edit}
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => setShowPromptModal(true)}
            />
          </ListItem>

          <ListItem
            title={Locale.Settings.Prompt.SystemPrompts.Summarize.Title}
            subTitle={Locale.Settings.Prompt.SystemPrompts.Summarize.SubTitle}
          >
            <IconButton
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => setEditingSystemPrompt("summarize")}
            />
          </ListItem>

          <ListItem
            title={Locale.Settings.Prompt.SystemPrompts.Topic.Title}
            subTitle={Locale.Settings.Prompt.SystemPrompts.Topic.SubTitle}
          >
            <IconButton
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => setEditingSystemPrompt("topic")}
            />
          </ListItem>

          <ListItem
            title={Locale.Settings.Prompt.SystemPrompts.OptimizeModel.Title}
            subTitle={
              Locale.Settings.Prompt.SystemPrompts.OptimizeModel.SubTitle
            }
          >
            <IconButton
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => setEditingSystemPrompt("optimize")}
            />
          </ListItem>
        </List>
        {shouldShowPromptModal && (
          <UserPromptModal onClose={() => setShowPromptModal(false)} />
        )}
        {editingSystemPrompt && (
          <SystemPromptEditModal
            type={editingSystemPrompt}
            value={getSystemPromptValue(editingSystemPrompt)}
            defaultValue={getSystemPromptDefault(editingSystemPrompt)}
            onSave={(value) => saveSystemPrompt(editingSystemPrompt, value)}
            onClose={() => setEditingSystemPrompt(null)}
          />
        )}
      </>
    );
  };

  // 创建自定义服务商配置组件
  const createCustomProviderConfigComponent = (customProvider: any) => {
    const typeLabels = {
      openai: "OpenAI",
      google: "Google",
      anthropic: "Anthropic",
    };

    return (
      <>
        {/* 基础路径配置 */}
        <ListItem
          title="基础路径 (Base Path)"
          subTitle={
            <span className={styles["long-text-wrap"]}>
              自定义端点，留空使用默认端点
            </span>
          }
        >
          <input
            type="text"
            value={customProvider.endpoint || ""}
            placeholder="https://api.openai.com/v1"
            onChange={(e) => {
              accessStore.updateCustomProvider(customProvider.id, {
                endpoint: e.currentTarget.value,
              });
            }}
          />
        </ListItem>

        {/* OpenAI 兼容服务商的额外配置 */}
        {customProvider.type === "openai" && (
          <>
            <ListItem
              title="使用 Response API"
              subTitle="启用后该服务商的所有模型调用都将使用 Response API"
            >
              <input
                type="checkbox"
                checked={customProvider.config?.useResponseApi || false}
                onChange={(e) => {
                  const newConfig = { ...customProvider.config };
                  newConfig.useResponseApi = e.target.checked;
                  // 自动更新 API 路径
                  if (
                    !newConfig.apiPath ||
                    newConfig.apiPath === "/responses" ||
                    newConfig.apiPath === "/chat/completions"
                  ) {
                    newConfig.apiPath = e.target.checked
                      ? "/responses"
                      : "/chat/completions";
                  }
                  accessStore.updateCustomProvider(customProvider.id, {
                    config: newConfig,
                  });
                }}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
            </ListItem>

            <ListItem title="API 路径" subTitle="API 路径配置，留空使用默认">
              <input
                type="text"
                value={customProvider.config?.apiPath || ""}
                placeholder={
                  customProvider.config?.useResponseApi
                    ? "/responses"
                    : "/chat/completions"
                }
                onChange={(e) => {
                  const newConfig = { ...customProvider.config };
                  newConfig.apiPath = e.currentTarget.value;
                  accessStore.updateCustomProvider(customProvider.id, {
                    config: newConfig,
                  });
                }}
              />
            </ListItem>

            <ListItem title="启用代理" subTitle="通过代理服务器访问 API">
              <input
                type="checkbox"
                checked={customProvider.config?.useProxy || false}
                onChange={(e) => {
                  const newConfig = { ...customProvider.config };
                  newConfig.useProxy = e.target.checked;
                  accessStore.updateCustomProvider(customProvider.id, {
                    config: newConfig,
                  });
                }}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
            </ListItem>

            {customProvider.config?.useProxy && (
              <ListItem title="代理地址" subTitle="代理服务器的完整地址">
                <input
                  type="text"
                  value={customProvider.config?.proxyUrl || ""}
                  placeholder="http://localhost:port"
                  onChange={(e) => {
                    const newConfig = { ...customProvider.config };
                    newConfig.proxyUrl = e.currentTarget.value;
                    accessStore.updateCustomProvider(customProvider.id, {
                      config: newConfig,
                    });
                  }}
                />
              </ListItem>
            )}
          </>
        )}

        {/* API Key 配置 */}
        <ListItem title="API Key" subTitle="用于访问 API 的密钥">
          <PasswordInput
            value={customProvider.apiKey}
            type="text"
            placeholder="请输入 API Key"
            onChange={(e) => {
              accessStore.updateCustomProvider(customProvider.id, {
                apiKey: e.currentTarget.value,
              });
            }}
          />
        </ListItem>
      </>
    );
  };

  // 动态生成服务提供商配置
  const builtinProviderConfigs = getAllProviders().map((provider) => ({
    provider: provider.name, // 使用provider name作为标识
    name: provider.name,
    description: `${provider.name} API服务`, // 可以后续从locale中获取
    configComponent: createProviderConfigComponent(provider), // 使用动态生成的配置组件
    isCustom: false,
  }));

  // 合并内置服务商和自定义服务商
  const customProviderConfigs = accessStore.customProviders.map(
    (customProvider) => ({
      provider: customProvider.id as any, // 使用自定义ID作为provider
      name: customProvider.name,
      description: `${
        Locale.Settings.Access.Provider.Description.Custom
      } ${customProvider.type.toUpperCase()} ${
        Locale.Settings.Access.Provider.Terms.Provider
      }`,
      configComponent: createCustomProviderConfigComponent(customProvider),
      isCustom: true,
    }),
  );

  const providerConfigs = [...builtinProviderConfigs, ...customProviderConfigs];

  // 模型服务设置
  const renderModelServiceSettings = () => (
    <>
      <List id={SlotID.CustomModel}>
        {accessCodeComponent}

        {!accessStore.hideUserApiKey && (
          <>
            {providerConfigs.map((config) => {
              // 对于自定义服务商，使用不同的启用状态逻辑
              const isEnabled = config.isCustom
                ? accessStore.customProviders.find(
                    (p) => p.id === config.provider,
                  )?.enabled || false
                : accessStore.enabledProviders?.[config.provider] || false;
              const isCollapsed = config.isCustom
                ? collapsedCustomProviders[config.provider as string] ?? true
                : collapsedProviders[config.provider] || false;

              return (
                <div
                  key={config.provider}
                  data-provider={config.provider}
                  className={styles["provider-section"]}
                >
                  {/* 服务商标题行 */}
                  <ListItem
                    title={config.name}
                    subTitle={config.description}
                    icon={
                      <ProviderIcon
                        provider={config.provider}
                        size={28}
                        customProviderType={
                          config.isCustom
                            ? accessStore.customProviders.find(
                                (p) => p.id === config.provider,
                              )?.type
                            : undefined
                        }
                      />
                    }
                  >
                    <div className={styles["provider-controls"]}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => {
                          const newEnabledState = e.target.checked;
                          if (config.isCustom) {
                            accessStore.updateCustomProvider(config.provider, {
                              enabled: newEnabledState,
                            });
                            // 启用时展开，禁用时折叠
                            setCollapsedCustomProviders((prev) => ({
                              ...prev,
                              [config.provider as string]: !newEnabledState,
                            }));
                          } else {
                            accessStore.update((access) => {
                              if (!access.enabledProviders) {
                                // 动态初始化 enabledProviders
                                const initialProviders: Record<
                                  string,
                                  boolean
                                > = {};
                                getAllProviders().forEach((provider) => {
                                  initialProviders[provider.name] = false;
                                });
                                access.enabledProviders = initialProviders;
                              }
                              access.enabledProviders[config.provider] =
                                newEnabledState;
                            });
                            // 启用时展开，禁用时折叠
                            setCollapsedProviders((prev) => ({
                              ...prev,
                              [config.provider]: !newEnabledState,
                            }));
                          }
                        }}
                      />

                      {/* 自定义服务商的删除按钮 */}
                      {config.isCustom && (
                        <IconButton
                          icon={<ClearIcon />}
                          className={styles["delete-provider-button"]}
                          onClick={() => {
                            if (
                              confirm(
                                `确定要删除自定义服务商 "${config.name}" 吗？`,
                              )
                            ) {
                              accessStore.removeCustomProvider(config.provider);
                            }
                          }}
                          type="danger"
                        />
                      )}

                      {isEnabled && (
                        <IconButton
                          icon={<DownIcon />}
                          className={`${styles["collapse-icon-button"]} ${
                            isCollapsed ? styles["collapsed"] : ""
                          }`}
                          onClick={() => {
                            if (config.isCustom) {
                              setCollapsedCustomProviders((prev) => ({
                                ...prev,
                                [config.provider as string]:
                                  !prev[config.provider as string],
                              }));
                            } else {
                              setCollapsedProviders((prev) => ({
                                ...prev,
                                [config.provider]: !prev[config.provider],
                              }));
                            }
                          }}
                        />
                      )}
                    </div>
                  </ListItem>

                  {/* 展开的配置项 */}
                  {isEnabled && !isCollapsed && (
                    <div className={styles["provider-config-section"]}>
                      {config.configComponent}

                      {/* 启用模型列表 */}
                      <ListItem
                        title={Locale.Settings.Access.Provider.Models.Title}
                        subTitle={
                          Locale.Settings.Access.Provider.Models.SubTitle
                        }
                      >
                        <div className={styles["enabled-models"]}>
                          <div className={styles["model-list"]}>
                            {(
                              accessStore.enabledModels?.[config.provider] || []
                            ).length > 0 ? (
                              <div className={styles["model-tags"]}>
                                {(
                                  accessStore.enabledModels?.[
                                    config.provider
                                  ] || []
                                ).map((modelName: string) => (
                                  <span
                                    key={modelName}
                                    className={styles["model-tag"]}
                                  >
                                    <span
                                      className={styles["model-delete-icon"]}
                                      onClick={(
                                        e: React.MouseEvent<HTMLSpanElement>,
                                      ) => {
                                        e.stopPropagation();
                                        accessStore.update((state) => {
                                          const currentModels =
                                            state.enabledModels[
                                              config.provider
                                            ] || [];
                                          state.enabledModels[config.provider] =
                                            currentModels.filter(
                                              (m) => m !== modelName,
                                            );
                                        });
                                      }}
                                    >
                                      −
                                    </span>
                                    <span
                                      className={styles["model-name"]}
                                      title={modelName}
                                      onClick={() => {
                                        openModelConfig(
                                          config.provider,
                                          modelName,
                                        );
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {modelName}
                                    </span>
                                    <ModelCapabilityIcons
                                      capabilities={getModelCapabilities(
                                        modelName,
                                      )}
                                      size={12}
                                      colorful={false}
                                    />
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className={styles["no-models"]}>
                                {
                                  Locale.Settings.Access.Provider.Models
                                    .NoModels
                                }
                              </span>
                            )}
                          </div>
                          <button
                            className={styles["manage-button"]}
                            onClick={() => {
                              setCurrentProvider(config.provider);
                              setShowModelManager(true);
                            }}
                          >
                            {Locale.Settings.Access.Provider.Models.Manage}
                          </button>
                        </div>
                      </ListItem>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 添加自定义服务商 */}
            <ListItem
              title={Locale.Settings.Access.CustomProvider.Add.Title}
              subTitle={Locale.Settings.Access.CustomProvider.Add.Description}
            >
              <IconButton
                icon={<AddIcon />}
                text={Locale.Settings.Access.CustomProvider.Add.Title}
                onClick={() => setShowAddCustomProvider(true)}
                bordered
              />
            </ListItem>
          </>
        )}
      </List>
    </>
  );

  // 准备分组模型数据 - 基于启用的提供商和模型
  //const allModels = useAllModels();

  // 只显示已启用服务商的已启用模型
  /*  const availableModels = useMemo(() => {
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
        : enabledProviders[providerName];

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
  ]);*/
  // 临时解决方案
  const availableModels = useEnabledModels();

  const groupModels = React.useMemo(
    () =>
      groupBy(availableModels, (model) => {
        const isCustomProvider = model.provider?.id?.startsWith("custom_");
        if (isCustomProvider) {
          const customProvider = accessStore.customProviders.find(
            (p) => p.id === model.provider?.id,
          );
          return customProvider?.name || model.provider?.providerName;
        }
        return model.provider?.providerName;
      }),
    [availableModels, accessStore.customProviders],
  );

  // 模型配置设置渲染函数
  const renderModelConfigSettings = () => {
    const getProviderAliases = (provider: string) => {
      const aliases = new Set<string>();
      if (!provider) return aliases;

      aliases.add(provider);

      // 支持 custom provider 的 id/name 双向匹配
      const byId = accessStore.customProviders.find((p) => p.id === provider);
      if (byId?.name) aliases.add(byId.name);

      const byName = accessStore.customProviders.find(
        (p) => p.name === provider,
      );
      if (byName?.id) aliases.add(byName.id);

      // 内置 provider 仍保留归一化匹配
      if (!provider.startsWith("custom_")) {
        aliases.add(normalizeProviderName(provider));
      }

      return aliases;
    };

    // 构建当前选中模型的value，需要与option的value格式一致
    const currentModelValue = (() => {
      const currentModel = config.modelConfig.model;
      const currentProviderName = (config.modelConfig.providerName ||
        "") as string;

      const isSameProvider = (a: string, b: string) => {
        const aAliases = getProviderAliases(a);
        const bAliases = getProviderAliases(b);
        for (const alias of aAliases) {
          if (bAliases.has(alias)) return true;
        }
        return false;
      };

      // 仅当当前模型能在可选列表中匹配时才返回 value，避免显示不存在的项
      for (const providerGroup of Object.values(groupModels)) {
        for (const model of providerGroup) {
          if (model.name === currentModel) {
            const modelProviderId = String(
              model.provider?.id || model.provider?.providerName || "",
            );

            if (
              modelProviderId &&
              currentProviderName &&
              isSameProvider(currentProviderName, modelProviderId)
            ) {
              return `${model.name}@${modelProviderId}`;
            }
          }
        }
      }

      return "";
    })();

    return (
      <List>
        <ListItem title={Locale.Settings.Model}>
          <Select
            className={styles["select-default-model"]}
            aria-label={Locale.Settings.Model}
            value={currentModelValue}
            align="left"
            onChange={(e) => {
              const [model, providerName] = getModelProvider(
                e.currentTarget.value,
              );
              config.update((config) => {
                config.modelConfig.model = model as any;
                // 保留原始 provider id，避免自定义 provider 在刷新后被错误归一化
                config.modelConfig.providerName = providerName!;
                // 根据新模型自动更新压缩阈值
                const autoThreshold = getModelCompressThreshold(
                  model,
                  config.modelConfig.compressThresholdRatio,
                );
                config.modelConfig.compressMessageLengthThreshold =
                  autoThreshold;
              });
              window.dispatchEvent(
                new CustomEvent("modelConfigUpdated", {
                  detail: { modelName: model },
                }),
              );
            }}
          >
            {currentModelValue === "" && (
              <option value="">
                {Object.keys(groupModels).length > 0
                  ? "请选择模型"
                  : "暂无可用模型"}
              </option>
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
        <ModelConfigList
          modelConfig={config.modelConfig}
          updateConfig={(updater) => {
            const modelConfig = { ...config.modelConfig };
            updater(modelConfig);
            config.update((config) => (config.modelConfig = modelConfig));
            window.dispatchEvent(
              new CustomEvent("modelConfigUpdated", {
                detail: { modelName: modelConfig.model },
              }),
            );
          }}
          showModelSelector={false}
        />
      </List>
    );
  };

  // 打开模型配置弹窗
  const openModelConfig = (provider: string, modelName: string) => {
    const currentCapabilities = getModelCapabilities(modelName);

    // 获取当前上下文Token数配置
    const currentContextConfig = getModelContextTokens(modelName);
    const currentContextTokens = currentContextConfig?.contextTokens;

    setModelConfigForm({
      modelId: modelName,
      category: "", // 在设置页面中不显示分组
      capabilities: {
        vision: currentCapabilities.vision || false,
        reasoning: currentCapabilities.reasoning || false,
        tools: currentCapabilities.tools || false,
      },
      contextTokens: currentContextTokens,
    });
    setShowModelConfig(modelName);
  };

  // 语音设置
  const renderVoiceSettings = () => (
    <>
      <List>
        <RealtimeConfigList
          realtimeConfig={config.realtimeConfig}
          updateConfig={(updater) => {
            const realtimeConfig = { ...config.realtimeConfig };
            updater(realtimeConfig);
            config.update((config) => (config.realtimeConfig = realtimeConfig));
          }}
        />
      </List>
      <List>
        <TTSConfigList
          ttsConfig={config.ttsConfig}
          updateConfig={(updater) => {
            const ttsConfig = { ...config.ttsConfig };
            updater(ttsConfig);
            config.update((config) => (config.ttsConfig = ttsConfig));
          }}
        />
      </List>
    </>
  );

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.Settings.Title}
          </div>
          <div className="window-header-sub-title">
            {Locale.Settings.SubTitle}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button"></div>
          <div className="window-action-button"></div>
          <div className="window-action-button">
            <IconButton
              aria={Locale.UI.Close}
              icon={<CloseIcon />}
              onClick={() => {
                try {
                  navigate(Path.Home);
                } catch (e) {
                  logger.error("Navigation error:", e);
                  // 如果导航失败，尝试强制刷新
                  window.location.href = "/";
                }
              }}
              bordered
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        {/* 分页导航 */}
        <div className={styles["settings-tabs"]}>
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              className={`${styles["settings-tab"]} ${
                currentTab === tab.key ? styles["settings-tab-active"] : ""
              }`}
              onClick={() => setCurrentTab(tab.key)}
            >
              <span className={styles["tab-icon"]}>{tab.icon}</span>
              <span className={styles["tab-label"]}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 分页内容 */}
        <div className={styles["settings-content"]}>{renderTabContent()}</div>
      </div>

      {/* 模型管理器 */}
      {showModelManager && currentProvider && (
        <ModelManager
          provider={currentProvider}
          onClose={() => {
            setShowModelManager(false);
            setCurrentProvider(null);
          }}
        />
      )}

      {/* 自定义服务商添加弹窗 */}
      {showAddCustomProvider && (
        <AddCustomProviderModal
          onClose={() => setShowAddCustomProvider(false)}
          onAdd={(provider) => {
            accessStore.addCustomProvider(provider);
            setShowAddCustomProvider(false);
          }}
        />
      )}

      {/* 模型配置弹窗 - 使用可复用组件 */}
      {showModelConfig && (
        <ModelConfigModal
          modelName={modelConfigForm.modelId}
          category=""
          showCategory={false}
          showDelete={false}
          onSave={(config) => {
            const modelName = modelConfigForm.modelId;

            // 保存能力配置到本地存储
            const capabilitiesKey = `model_capabilities_${modelName}`;
            localStorage.setItem(
              capabilitiesKey,
              JSON.stringify(config.capabilities),
            );

            // 保存上下文Token数配置
            if (config.contextTokens !== undefined) {
              const {
                saveCustomContextTokens,
              } = require("../config/model-config");
              saveCustomContextTokens(modelName, config.contextTokens);
            }

            // 关闭配置面板
            setShowModelConfig(null);
            showToast("模型配置已保存");
          }}
          onClose={() => setShowModelConfig(null)}
        />
      )}
    </ErrorBoundary>
  );
}
