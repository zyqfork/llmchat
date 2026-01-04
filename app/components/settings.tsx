import React, { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
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
import { getModelCapabilitiesWithCustomConfig } from "../config/model-capabilities";
import { normalizeProviderName } from "../client/api";
import {
  getModelCompressThreshold,
  getModelContextTokens,
} from "../config/model-context-tokens";
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
} from "../store";
import { ColorScheme } from "../constant";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import { copyToClipboard, clientUpdate, semverCompare } from "../utils";
import { groupBy } from "lodash-es";
import Link from "next/link";
import {
  Anthropic,
  Azure,
  ByteDance,
  Alibaba,
  Moonshot,
  XAI,
  Google,
  GoogleSafetySettingsThreshold,
  OPENAI_BASE_URL,
  Path,
  RELEASE_URL,
  STORAGE_KEY,
  ServiceProvider,
  SlotID,
  UPDATE_URL,
  SAAS_CHAT_URL,
  DeepSeek,
  SiliconFlow,
  Ollama,
} from "../constant";
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { useSyncStore } from "../store/sync";
import { nanoid } from "nanoid";
import { useMaskStore } from "../store/mask";
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
      });
    }
  };

  return (
    <div className="modal-mask">
      <div className={styles["modal-container"]}>
        <div className={styles["modal-header"]}>
          <div className={styles["modal-title"]}>
            {Locale.Settings.Access.CustomProvider.Modal.Title}
          </div>
          <button className={styles["modal-close-button"]} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles["modal-content"]}>
          <div className={styles["form-group"]}>
            <label>
              {Locale.Settings.Access.CustomProvider.Modal.Name.Title} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={
                Locale.Settings.Access.CustomProvider.Modal.Name.Placeholder
              }
              className={errors.name ? styles["error"] : ""}
            />
            {errors.name && (
              <div className={styles["error-message"]}>{errors.name}</div>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label>
              {Locale.Settings.Access.CustomProvider.Modal.Type.Title} *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as CustomProviderType,
                })
              }
            >
              {providerTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className={styles["form-group"]}>
            <label>
              {Locale.Settings.Access.CustomProvider.Modal.ApiKey.Title} *
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              placeholder={
                Locale.Settings.Access.CustomProvider.Modal.ApiKey.Placeholder
              }
              className={errors.apiKey ? styles["error"] : ""}
            />
            {errors.apiKey && (
              <div className={styles["error-message"]}>{errors.apiKey}</div>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label>
              {Locale.Settings.Access.CustomProvider.Modal.Endpoint.Title}{" "}
              {Locale.Settings.Access.CustomProvider.Modal.Endpoint.Optional}
            </label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) =>
                setFormData({ ...formData, endpoint: e.target.value })
              }
              placeholder={
                Locale.Settings.Access.CustomProvider.Modal.Endpoint.Placeholder
              }
            />
          </div>
        </div>

        <div className={styles["modal-footer"]}>
          <button className={styles["cancel-button"]} onClick={onClose}>
            {Locale.Settings.Access.CustomProvider.Modal.Cancel}
          </button>
          <button className={styles["confirm-button"]} onClick={handleSubmit}>
            {Locale.Settings.Access.CustomProvider.Modal.Confirm}
          </button>
        </div>
      </div>
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

function CheckButton() {
  const syncStore = useSyncStore();

  const couldCheck = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [checkState, setCheckState] = useState<
    "none" | "checking" | "success" | "failed"
  >("none");

  async function check() {
    setCheckState("checking");
    const valid = await syncStore.check();
    setCheckState(valid ? "success" : "failed");
  }

  if (!couldCheck) return null;

  return (
    <IconButton
      text={Locale.Settings.Sync.Config.Modal.Check}
      bordered
      onClick={check}
      icon={
        checkState === "none" ? (
          <ConnectionIcon />
        ) : checkState === "checking" ? (
          <LoadingIcon />
        ) : checkState === "success" ? (
          <CloudSuccessIcon />
        ) : checkState === "failed" ? (
          <CloudFailIcon />
        ) : (
          <ConnectionIcon />
        )
      }
    ></IconButton>
  );
}

function SyncConfigModal(props: { onClose?: () => void }) {
  const syncStore = useSyncStore();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Sync.Config.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <CheckButton key="check" />,
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
      </Modal>
    </div>
  );
}

function SyncItems() {
  const syncStore = useSyncStore();
  const chatStore = useChatStore();
  const promptStore = usePromptStore();
  const maskStore = useMaskStore();
  const couldSync = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    const messageCount = sessions.reduce((p, c) => p + c.messages.length, 0);

    return {
      chat: sessions.length,
      message: messageCount,
      prompt: Object.keys(promptStore.prompts).length,
      mask: Object.keys(maskStore.masks).length,
    };
  }, [chatStore.sessions, maskStore.masks, promptStore.prompts]);

  return (
    <>
      <List>
        <ListItem
          title={Locale.Settings.Sync.CloudState}
          subTitle={
            syncStore.lastProvider
              ? `${new Date(syncStore.lastSyncTime).toLocaleString()} [${
                  syncStore.lastProvider
                }]`
              : Locale.Settings.Sync.NotSyncYet
          }
        >
          <div style={{ display: "flex" }}>
            <IconButton
              aria={Locale.Settings.Sync.CloudState + Locale.UI.Config}
              icon={<ConfigIcon />}
              text={Locale.UI.Config}
              onClick={() => {
                setShowSyncConfigModal(true);
              }}
            />
            {couldSync && (
              <IconButton
                icon={<ResetIcon />}
                text={Locale.UI.Sync}
                onClick={async () => {
                  try {
                    await syncStore.sync();
                    showToast(Locale.Settings.Sync.Success);
                  } catch (e) {
                    showToast(Locale.Settings.Sync.Fail);
                    console.error("[Sync]", e);
                  }
                }}
              />
            )}
          </div>
        </ListItem>

        <ListItem
          title={Locale.Settings.Sync.LocalState}
          subTitle={Locale.Settings.Sync.Overview(stateOverview)}
        >
          <div style={{ display: "flex" }}>
            <IconButton
              aria={Locale.Settings.Sync.LocalState + Locale.UI.Export}
              icon={<UploadIcon />}
              text={Locale.UI.Export}
              onClick={() => {
                syncStore.export();
              }}
            />
            <IconButton
              aria={Locale.Settings.Sync.LocalState + Locale.UI.Import}
              icon={<DownloadIcon />}
              text={Locale.UI.Import}
              onClick={() => {
                syncStore.import();
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
        console.log("Switch to provider config:", provider);

        // 自动展开该厂商的配置（同时处理标准厂商和自定义厂商）
        // 使用setTimeout确保在标签切换后再展开
        setTimeout(() => {
          setCollapsedProviders((prev) => ({
            ...prev,
            [provider as ServiceProvider]: false,
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
  const [currentProvider, setCurrentProvider] = useState<
    ServiceProvider | string | null
  >(null);
  const [showAddCustomProvider, setShowAddCustomProvider] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState<string | null>(null);
  const [modelConfigForm, setModelConfigForm] = useState({
    modelId: "",
    category: "",
    capabilities: {
      vision: false,
      web: false,
      reasoning: false,
      tools: false,
    },
    contextTokens: undefined as number | undefined,
  });
  const [collapsedProviders, setCollapsedProviders] = useState<
    Record<ServiceProvider, boolean>
  >({
    [ServiceProvider.OpenAI]: true, // 默认全部折叠
    [ServiceProvider.Azure]: true,
    [ServiceProvider.Google]: true,
    [ServiceProvider.Anthropic]: true,
    [ServiceProvider.ByteDance]: true,
    [ServiceProvider.Alibaba]: true,
    [ServiceProvider.Moonshot]: true,
    [ServiceProvider.XAI]: true,
    [ServiceProvider.DeepSeek]: true,
    [ServiceProvider.SiliconFlow]: true,
    [ServiceProvider.Ollama]: true,
  });

  // 自定义服务商的折叠状态 - 默认全部折叠
  const [collapsedCustomProviders, setCollapsedCustomProviders] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    accessStore.customProviders.forEach((provider) => {
      initialState[provider.id] = true; // 默认折叠
    });
    return initialState;
  });

  // 当自定义服务商列表变化时，更新折叠状态
  useEffect(() => {
    setCollapsedCustomProviders((prev) => {
      const newState = { ...prev };
      accessStore.customProviders.forEach((provider) => {
        if (!(provider.id in newState)) {
          newState[provider.id] = true; // 新添加的服务商默认折叠
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
          console.error("Navigation error:", error);
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

  const clientConfig = useMemo(() => getClientConfig(), []);
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

  const openAIConfigComponent = (
    <>
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
          value={accessStore.openaiUrl}
          placeholder={OPENAI_BASE_URL}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.openaiUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.OpenAI.ApiKey.Title}
        subTitle={Locale.Settings.Access.OpenAI.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.OpenAI.ApiKey.Title}
          value={accessStore.openaiApiKey}
          type="text"
          placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.openaiApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.OpenAI.UseProxy.Title}
        subTitle={Locale.Settings.Access.OpenAI.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.OpenAI.UseProxy.Title}
          type="checkbox"
          checked={accessStore.openaiUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.openaiUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.openaiUseProxy && (
        <ListItem
          title={Locale.Settings.Access.OpenAI.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.OpenAI.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.OpenAI.ProxyUrl.Title}
            type="text"
            value={accessStore.openaiProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.openaiProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const azureConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Azure.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.Azure.Endpoint.SubTitle +
              Azure.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.Azure.Endpoint.Title}
          type="text"
          value={accessStore.azureUrl}
          placeholder={Azure.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Azure.ApiKey.Title}
        subTitle={Locale.Settings.Access.Azure.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Azure.ApiKey.Title}
          value={accessStore.azureApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Azure.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.azureApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Azure.ApiVerion.Title}
        subTitle={Locale.Settings.Access.Azure.ApiVerion.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Azure.ApiVerion.Title}
          type="text"
          value={accessStore.azureApiVersion}
          placeholder="2023-08-01-preview"
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Azure.UseProxy.Title}
        subTitle={Locale.Settings.Access.Azure.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Azure.UseProxy.Title}
          type="checkbox"
          checked={accessStore.azureUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.azureUseProxy && (
        <ListItem
          title={Locale.Settings.Access.Azure.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.Azure.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.Azure.ProxyUrl.Title}
            type="text"
            value={accessStore.azureProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.azureProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const googleConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Google.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.Google.Endpoint.SubTitle +
              Google.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.Google.Endpoint.Title}
          type="text"
          value={accessStore.googleUrl}
          placeholder={Google.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Google.ApiKey.Title}
        subTitle={Locale.Settings.Access.Google.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Google.ApiKey.Title}
          value={accessStore.googleApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.googleApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Google.ApiVersion.Title}
        subTitle={Locale.Settings.Access.Google.ApiVersion.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Google.ApiVersion.Title}
          type="text"
          value={accessStore.googleApiVersion}
          placeholder="2023-08-01-preview"
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
        subTitle={Locale.Settings.Access.Google.GoogleSafetySettings.SubTitle}
      >
        <Select
          aria-label={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
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
      <ListItem
        title={Locale.Settings.Access.Google.UseProxy.Title}
        subTitle={Locale.Settings.Access.Google.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Google.UseProxy.Title}
          type="checkbox"
          checked={accessStore.googleUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.googleUseProxy && (
        <ListItem
          title={Locale.Settings.Access.Google.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.Google.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.Google.ProxyUrl.Title}
            type="text"
            value={accessStore.googleProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.googleProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const anthropicConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Anthropic.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.Anthropic.Endpoint.SubTitle +
              Anthropic.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.Anthropic.Endpoint.Title}
          type="text"
          value={accessStore.anthropicUrl}
          placeholder={Anthropic.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Anthropic.ApiKey.Title}
        subTitle={Locale.Settings.Access.Anthropic.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Anthropic.ApiKey.Title}
          value={accessStore.anthropicApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Anthropic.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.anthropicApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Anthropic.ApiVerion.Title}
        subTitle={Locale.Settings.Access.Anthropic.ApiVerion.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Anthropic.ApiVerion.Title}
          type="text"
          value={accessStore.anthropicApiVersion}
          placeholder={Anthropic.Vision}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Anthropic.UseProxy.Title}
        subTitle={Locale.Settings.Access.Anthropic.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Anthropic.UseProxy.Title}
          type="checkbox"
          checked={accessStore.anthropicUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.anthropicUseProxy && (
        <ListItem
          title={Locale.Settings.Access.Anthropic.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.Anthropic.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.Anthropic.ProxyUrl.Title}
            type="text"
            value={accessStore.anthropicProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.anthropicProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const byteDanceConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.ByteDance.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.ByteDance.Endpoint.SubTitle +
              ByteDance.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.ByteDance.Endpoint.Title}
          type="text"
          value={accessStore.bytedanceUrl}
          placeholder={ByteDance.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.bytedanceUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.ByteDance.ApiKey.Title}
        subTitle={Locale.Settings.Access.ByteDance.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.ByteDance.ApiKey.Title}
          value={accessStore.bytedanceApiKey}
          type="text"
          placeholder={Locale.Settings.Access.ByteDance.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.bytedanceApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.ByteDance.UseProxy.Title}
        subTitle={Locale.Settings.Access.ByteDance.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.ByteDance.UseProxy.Title}
          type="checkbox"
          checked={accessStore.bytedanceUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.bytedanceUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.bytedanceUseProxy && (
        <ListItem
          title={Locale.Settings.Access.ByteDance.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.ByteDance.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.ByteDance.ProxyUrl.Title}
            type="text"
            value={accessStore.bytedanceProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.bytedanceProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const alibabaConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Alibaba.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.Alibaba.Endpoint.SubTitle +
              Alibaba.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.Alibaba.Endpoint.Title}
          type="text"
          value={accessStore.alibabaUrl}
          placeholder={Alibaba.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.alibabaUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Alibaba.ApiKey.Title}
        subTitle={Locale.Settings.Access.Alibaba.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Alibaba.ApiKey.Title}
          value={accessStore.alibabaApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Alibaba.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.alibabaApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Alibaba.UseProxy.Title}
        subTitle={Locale.Settings.Access.Alibaba.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Alibaba.UseProxy.Title}
          type="checkbox"
          checked={accessStore.alibabaUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.alibabaUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.alibabaUseProxy && (
        <ListItem
          title={Locale.Settings.Access.Alibaba.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.Alibaba.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.Alibaba.ProxyUrl.Title}
            type="text"
            value={accessStore.alibabaProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.alibabaProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const moonshotConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Moonshot.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.Moonshot.Endpoint.SubTitle +
              Moonshot.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.Moonshot.Endpoint.Title}
          type="text"
          value={accessStore.moonshotUrl}
          placeholder={Moonshot.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.moonshotUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Moonshot.ApiKey.Title}
        subTitle={Locale.Settings.Access.Moonshot.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Moonshot.ApiKey.Title}
          value={accessStore.moonshotApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Moonshot.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.moonshotApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Moonshot.UseProxy.Title}
        subTitle={Locale.Settings.Access.Moonshot.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Moonshot.UseProxy.Title}
          type="checkbox"
          checked={accessStore.moonshotUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.moonshotUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.moonshotUseProxy && (
        <ListItem
          title={Locale.Settings.Access.Moonshot.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.Moonshot.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.Moonshot.ProxyUrl.Title}
            type="text"
            value={accessStore.moonshotProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.moonshotProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const deepseekConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.DeepSeek.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.DeepSeek.Endpoint.SubTitle +
              DeepSeek.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.DeepSeek.Endpoint.Title}
          type="text"
          value={accessStore.deepseekUrl}
          placeholder={DeepSeek.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.deepseekUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.DeepSeek.ApiKey.Title}
        subTitle={Locale.Settings.Access.DeepSeek.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.DeepSeek.ApiKey.Title}
          value={accessStore.deepseekApiKey}
          type="text"
          placeholder={Locale.Settings.Access.DeepSeek.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.deepseekApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.DeepSeek.UseProxy.Title}
        subTitle={Locale.Settings.Access.DeepSeek.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.DeepSeek.UseProxy.Title}
          type="checkbox"
          checked={accessStore.deepseekUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.deepseekUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.deepseekUseProxy && (
        <ListItem
          title={Locale.Settings.Access.DeepSeek.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.DeepSeek.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.DeepSeek.ProxyUrl.Title}
            type="text"
            value={accessStore.deepseekProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.deepseekProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const XAIConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.XAI.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.XAI.Endpoint.SubTitle + XAI.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.XAI.Endpoint.Title}
          type="text"
          value={accessStore.xaiUrl}
          placeholder={XAI.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.xaiUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.XAI.ApiKey.Title}
        subTitle={Locale.Settings.Access.XAI.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.XAI.ApiKey.Title}
          value={accessStore.xaiApiKey}
          type="text"
          placeholder={Locale.Settings.Access.XAI.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.xaiApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.XAI.UseProxy.Title}
        subTitle={Locale.Settings.Access.XAI.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.XAI.UseProxy.Title}
          type="checkbox"
          checked={accessStore.xaiUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.xaiUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.xaiUseProxy && (
        <ListItem
          title={Locale.Settings.Access.XAI.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.XAI.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.XAI.ProxyUrl.Title}
            type="text"
            value={accessStore.xaiProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.xaiProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const siliconflowConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.SiliconFlow.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.SiliconFlow.Endpoint.SubTitle +
              SiliconFlow.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.SiliconFlow.Endpoint.Title}
          type="text"
          value={accessStore.siliconflowUrl}
          placeholder={SiliconFlow.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.siliconflowUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.SiliconFlow.ApiKey.Title}
        subTitle={Locale.Settings.Access.SiliconFlow.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.SiliconFlow.ApiKey.Title}
          value={accessStore.siliconflowApiKey}
          type="text"
          placeholder={Locale.Settings.Access.SiliconFlow.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.siliconflowApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.SiliconFlow.UseProxy.Title}
        subTitle={Locale.Settings.Access.SiliconFlow.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.SiliconFlow.UseProxy.Title}
          type="checkbox"
          checked={accessStore.siliconflowUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) =>
                (access.siliconflowUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.siliconflowUseProxy && (
        <ListItem
          title={Locale.Settings.Access.SiliconFlow.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.SiliconFlow.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.SiliconFlow.ProxyUrl.Title}
            type="text"
            value={accessStore.siliconflowProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) =>
                  (access.siliconflowProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

  const ollamaConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Ollama.Endpoint.Title}
        subTitle={
          <span className={styles["long-text-wrap"]}>
            {Locale.Settings.Access.Ollama.Endpoint.SubTitle +
              Ollama.ExampleEndpoint}
          </span>
        }
      >
        <input
          aria-label={Locale.Settings.Access.Ollama.Endpoint.Title}
          type="text"
          value={accessStore.ollamaUrl}
          placeholder={Ollama.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.ollamaUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Ollama.ApiKey.Title}
        subTitle={Locale.Settings.Access.Ollama.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Ollama.ApiKey.Title}
          value={accessStore.ollamaApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Ollama.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.ollamaApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Ollama.UseProxy.Title}
        subTitle={Locale.Settings.Access.Ollama.UseProxy.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Ollama.UseProxy.Title}
          type="checkbox"
          checked={accessStore.ollamaUseProxy}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.ollamaUseProxy = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      {accessStore.ollamaUseProxy && (
        <ListItem
          title={Locale.Settings.Access.Ollama.ProxyUrl.Title}
          subTitle={Locale.Settings.Access.Ollama.ProxyUrl.SubTitle}
        >
          <input
            aria-label={Locale.Settings.Access.Ollama.ProxyUrl.Title}
            type="text"
            value={accessStore.ollamaProxyUrl}
            placeholder="http://localhost:port"
            onChange={(e) =>
              accessStore.update(
                (access) => (access.ollamaProxyUrl = e.currentTarget.value),
              )
            }
          ></input>
        </ListItem>
      )}
    </>
  );

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
              aria-label={Locale.Settings.Avatar}
              tabIndex={0}
              className={styles.avatar}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
              }}
            >
              <Avatar avatar={config.avatar} />
            </div>
          </Popover>
        </ListItem>

        <ListItem title={Locale.Settings.SystemAvatar}>
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
              aria-label={Locale.Settings.SystemAvatar}
              tabIndex={0}
              className={styles.avatar}
              onClick={() => {
                setShowSystemEmojiPicker(!showSystemEmojiPicker);
              }}
            >
              <Avatar avatar={config.systemAvatar} />
            </div>
          </Popover>
        </ListItem>

        <ListItem title={Locale.Settings.AssistantAvatar}>
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
              aria-label={Locale.Settings.AssistantAvatar}
              tabIndex={0}
              className={styles.avatar}
              onClick={() => {
                setShowAssistantEmojiPicker(!showAssistantEmojiPicker);
              }}
            >
              <Avatar avatar={config.assistantAvatar} />
            </div>
          </Popover>
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
          <input
            aria-label={Locale.Settings.FontFamily.Title}
            type="text"
            value={config.fontFamily}
            placeholder={Locale.Settings.FontFamily.Placeholder}
            onChange={(e) =>
              updateConfig(
                (config) => (config.fontFamily = e.currentTarget.value),
              )
            }
          ></input>
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
  const renderMaskSettings = () => (
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
            updateConfig(
              (config) =>
                (config.useModelIconAsAvatar = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
    </List>
  );

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
        <ListItem
          title={Locale.Settings.Access.CustomProvider.Config.Type}
          subTitle={`${Locale.Settings.Access.CustomProvider.Config.BasedOn} ${
            typeLabels[customProvider.type as keyof typeof typeLabels]
          } API`}
        >
          <span>
            {typeLabels[customProvider.type as keyof typeof typeLabels]}
          </span>
        </ListItem>

        <ListItem
          title={Locale.Settings.Access.CustomProvider.Modal.ApiKey.Title}
          subTitle={
            Locale.Settings.Access.CustomProvider.Config.ApiKeyDescription
          }
        >
          <PasswordInput
            value={customProvider.apiKey}
            type="text"
            placeholder={
              Locale.Settings.Access.CustomProvider.Modal.ApiKey.Placeholder
            }
            onChange={(e) => {
              accessStore.updateCustomProvider(customProvider.id, {
                apiKey: e.currentTarget.value,
              });
            }}
          />
        </ListItem>

        {customProvider.endpoint && (
          <ListItem
            title={Locale.Settings.Access.CustomProvider.Modal.Endpoint.Title}
            subTitle={
              Locale.Settings.Access.CustomProvider.Config.EndpointDescription
            }
          >
            <input
              type="text"
              value={customProvider.endpoint}
              placeholder={
                Locale.Settings.Access.CustomProvider.Config.EndpointPlaceholder
              }
              onChange={(e) => {
                accessStore.updateCustomProvider(customProvider.id, {
                  endpoint: e.currentTarget.value,
                });
              }}
            />
          </ListItem>
        )}

        <ListItem
          title={Locale.Settings.Access.CustomProvider.Config.Delete.Title}
          subTitle={
            Locale.Settings.Access.CustomProvider.Config.Delete.SubTitle
          }
        >
          <IconButton
            icon={<ClearIcon />}
            text={Locale.Settings.Access.CustomProvider.Config.Delete.Button}
            type="danger"
            onClick={() => {
              if (
                confirm(
                  `${Locale.Settings.Access.CustomProvider.Config.Delete.Confirm} "${customProvider.name}" ${Locale.Settings.Access.CustomProvider.Config.Delete.ConfirmSuffix}`,
                )
              ) {
                accessStore.removeCustomProvider(customProvider.id);
              }
            }}
          />
        </ListItem>
      </>
    );
  };

  // 服务提供商配置（包含自定义服务商）
  const builtinProviderConfigs = [
    {
      provider: ServiceProvider.OpenAI,
      name: "OpenAI",
      description: Locale.Settings.Access.Provider.Description.OpenAI,
      configComponent: openAIConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.Azure,
      name: "Azure OpenAI",
      description: Locale.Settings.Access.Provider.Description.Azure,
      configComponent: azureConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.Google,
      name: "Google",
      description: Locale.Settings.Access.Provider.Description.Google,
      configComponent: googleConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.Anthropic,
      name: "Anthropic",
      description: Locale.Settings.Access.Provider.Description.Anthropic,
      configComponent: anthropicConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.ByteDance,
      name: Locale.Settings.Access.Provider.Name.ByteDance,
      description: Locale.Settings.Access.Provider.Description.ByteDance,
      configComponent: byteDanceConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.Alibaba,
      name: Locale.Settings.Access.Provider.Name.Alibaba,
      description: Locale.Settings.Access.Provider.Description.Alibaba,
      configComponent: alibabaConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.Moonshot,
      name: Locale.Settings.Access.Provider.Name.Moonshot,
      description: Locale.Settings.Access.Provider.Description.Moonshot,
      configComponent: moonshotConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.DeepSeek,
      name: "DeepSeek",
      description: Locale.Settings.Access.Provider.Description.DeepSeek,
      configComponent: deepseekConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.XAI,
      name: "xAI",
      description: Locale.Settings.Access.Provider.Description.XAI,
      configComponent: XAIConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.SiliconFlow,
      name: "SiliconFlow",
      description: Locale.Settings.Access.Provider.Description.SiliconFlow,
      configComponent: siliconflowConfigComponent,
      isCustom: false,
    },
    {
      provider: ServiceProvider.Ollama,
      name: "Ollama",
      description: Locale.Settings.Access.Provider.Description.Ollama,
      configComponent: ollamaConfigComponent,
      isCustom: false,
    },
  ];

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
                : accessStore.enabledProviders?.[
                    config.provider as ServiceProvider
                  ] || false;
              const isCollapsed = config.isCustom
                ? collapsedCustomProviders[config.provider as string] ?? true
                : collapsedProviders[config.provider as ServiceProvider] ||
                  false;

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
                        size={20}
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
                          if (config.isCustom) {
                            accessStore.updateCustomProvider(config.provider, {
                              enabled: e.target.checked,
                            });
                          } else {
                            accessStore.update((access) => {
                              if (!access.enabledProviders) {
                                access.enabledProviders = {
                                  [ServiceProvider.OpenAI]: false,
                                  [ServiceProvider.Azure]: false,
                                  [ServiceProvider.Google]: false,
                                  [ServiceProvider.Anthropic]: false,
                                  [ServiceProvider.ByteDance]: false,
                                  [ServiceProvider.Alibaba]: false,
                                  [ServiceProvider.Moonshot]: false,
                                  [ServiceProvider.XAI]: false,
                                  [ServiceProvider.DeepSeek]: false,
                                  [ServiceProvider.SiliconFlow]: false,
                                  [ServiceProvider.Ollama]: false,
                                } as Record<ServiceProvider, boolean>;
                              }
                              access.enabledProviders[
                                config.provider as ServiceProvider
                              ] = e.target.checked;
                            });
                          }
                        }}
                      />
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
                                [config.provider as ServiceProvider]:
                                  !prev[config.provider as ServiceProvider],
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
                                      capabilities={getModelCapabilitiesWithCustomConfig(
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
  ]);*/
  // 临时解决方案
  const availableModels = useEnabledModels();

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

  // 打开模型配置弹窗
  const openModelConfig = (
    provider: ServiceProvider | string,
    modelName: string,
  ) => {
    const currentCapabilities = getModelCapabilitiesWithCustomConfig(modelName);

    // 获取当前上下文Token数配置
    const currentContextConfig = getModelContextTokens(modelName);
    const currentContextTokens = currentContextConfig?.contextTokens;

    setModelConfigForm({
      modelId: modelName,
      category: "", // 在设置页面中不显示分组
      capabilities: {
        vision: currentCapabilities.vision || false,
        web: currentCapabilities.web || false,
        reasoning: currentCapabilities.reasoning || false,
        tools: currentCapabilities.tools || false,
      },
      contextTokens: currentContextTokens,
    });
    setShowModelConfig(modelName);
  };

  // 模型配置设置
  const renderModelConfigSettings = () => {
    // 构建当前选中模型的value，需要与option的value格式一致
    const currentModelValue = (() => {
      const currentModel = config.modelConfig.model;
      const currentProviderName = config.modelConfig.providerName;

      // 查找匹配的模型，确保value格式一致
      for (const providerGroup of Object.values(groupModels)) {
        for (const model of providerGroup) {
          if (model.name === currentModel) {
            const modelProviderId =
              model.provider?.id || model.provider?.providerName;
            const normalizedCurrentProvider = normalizeProviderName(
              currentProviderName as string,
            );
            const normalizedModelProvider = normalizeProviderName(
              modelProviderId as string,
            );

            if (normalizedCurrentProvider === normalizedModelProvider) {
              return `${model.name}@${modelProviderId}`;
            }
          }
        }
      }

      // 如果没找到匹配的，使用原始格式
      return `${currentModel}@${currentProviderName}`;
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
                config.modelConfig.providerName = normalizeProviderName(
                  providerName!,
                );
                // 根据新模型自动更新压缩阈值
                const autoThreshold = getModelCompressThreshold(model);
                config.modelConfig.compressMessageLengthThreshold =
                  autoThreshold;
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
        <ModelConfigList
          modelConfig={config.modelConfig}
          updateConfig={(updater) => {
            const modelConfig = { ...config.modelConfig };
            updater(modelConfig);
            config.update((config) => (config.modelConfig = modelConfig));
          }}
          showModelSelector={false}
        />
      </List>
    );
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
                  console.error("Navigation error:", e);
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
              } = require("../config/model-context-tokens");
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
