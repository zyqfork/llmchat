import { useState, useEffect, useMemo } from "react";

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

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  useUpdateStore,
  useAccessStore,
  useAppConfig,
} from "../store";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import { copyToClipboard, clientUpdate, semverCompare } from "../utils";
import Link from "next/link";
import {
  Anthropic,
  Azure,
  ByteDance,
  Alibaba,
  Moonshot,
  // XAI, // 暂时禁用
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
            <select
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
            </select>
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

  function checkUpdate(force = false) {
    setCheckingUpdate(true);
    updateStore.getLatestVersion(force).then(() => {
      setCheckingUpdate(false);
    });

    console.log("[Update] local version ", updateStore.version);
    console.log("[Update] remote version ", updateStore.remoteVersion);
  }

  const accessStore = useAccessStore();
  const shouldHideBalanceQuery = useMemo(() => {
    const isOpenAiUrl = accessStore.openaiUrl.includes(OPENAI_BASE_URL);

    return (
      accessStore.hideBalanceQuery ||
      isOpenAiUrl ||
      accessStore.provider === ServiceProvider.Azure
    );
  }, [
    accessStore.hideBalanceQuery,
    accessStore.openaiUrl,
    accessStore.provider,
  ]);

  const usage = {
    used: updateStore.used,
    subscription: updateStore.subscription,
  };
  const [loadingUsage, setLoadingUsage] = useState(false);
  function checkUsage(force = false) {
    if (shouldHideBalanceQuery) {
      return;
    }

    setLoadingUsage(true);
    updateStore.updateUsage(force).finally(() => {
      setLoadingUsage(false);
    });
  }

  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const [shouldShowPromptModal, setShowPromptModal] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<ServiceProvider | null>(null);
  const [collapsedProviders, setCollapsedProviders] = useState<
    Record<ServiceProvider, boolean>
  >({
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
  });

  const showUsage = accessStore.isAuthorized();
  useEffect(() => {
    // checks per minutes
    checkUpdate();
    showUsage && checkUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
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
          accessStore.update(
            (access) => (access.accessCode = e.currentTarget.value),
          );
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
        subTitle={Locale.Settings.Access.OpenAI.Endpoint.SubTitle}
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
    </>
  );

  const azureConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Azure.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Azure.Endpoint.SubTitle + Azure.ExampleEndpoint
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
    </>
  );

  const googleConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Google.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Google.Endpoint.SubTitle +
          Google.ExampleEndpoint
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
    </>
  );

  const anthropicConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Anthropic.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Anthropic.Endpoint.SubTitle +
          Anthropic.ExampleEndpoint
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
    </>
  );

  const byteDanceConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.ByteDance.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.ByteDance.Endpoint.SubTitle +
          ByteDance.ExampleEndpoint
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
    </>
  );

  const alibabaConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Alibaba.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Alibaba.Endpoint.SubTitle +
          Alibaba.ExampleEndpoint
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
    </>
  );

  const moonshotConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.Moonshot.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Moonshot.Endpoint.SubTitle +
          Moonshot.ExampleEndpoint
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
    </>
  );

  const deepseekConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.DeepSeek.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.DeepSeek.Endpoint.SubTitle +
          DeepSeek.ExampleEndpoint
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
    </>
  );

  // XAI 配置组件暂时禁用
  // const XAIConfigComponent = (
  //   <>
  //     <ListItem
  //       title={Locale.Settings.Access.XAI.Endpoint.Title}
  //       subTitle={
  //         Locale.Settings.Access.XAI.Endpoint.SubTitle + XAI.ExampleEndpoint
  //       }
  //     >
  //       <input
  //         aria-label={Locale.Settings.Access.XAI.Endpoint.Title}
  //         type="text"
  //         value={accessStore.xaiUrl}
  //         placeholder={XAI.ExampleEndpoint}
  //         onChange={(e) =>
  //           accessStore.update(
  //             (access) => (access.xaiUrl = e.currentTarget.value),
  //           )
  //         }
  //       ></input>
  //     </ListItem>
  //     <ListItem
  //       title={Locale.Settings.Access.XAI.ApiKey.Title}
  //       subTitle={Locale.Settings.Access.XAI.ApiKey.SubTitle}
  //     >
  //       <PasswordInput
  //         aria-label={Locale.Settings.Access.XAI.ApiKey.Title}
  //         value={accessStore.xaiApiKey}
  //         type="text"
  //         placeholder={Locale.Settings.Access.XAI.ApiKey.Placeholder}
  //         onChange={(e) => {
  //           accessStore.update(
  //             (access) => (access.xaiApiKey = e.currentTarget.value),
  //           );
  //         }}
  //       />
  //     </ListItem>
  //   </>
  // );

  const siliconflowConfigComponent = (
    <>
      <ListItem
        title={Locale.Settings.Access.SiliconFlow.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.SiliconFlow.Endpoint.SubTitle +
          SiliconFlow.ExampleEndpoint
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
    </>
  );

  // 分页标签配置
  const tabConfig = [
    { key: SettingsTab.General, label: "通用配置", icon: "⚙️" },
    { key: SettingsTab.Sync, label: "云同步", icon: "☁️" },
    { key: SettingsTab.Mask, label: "助手", icon: "🎭" },
    { key: SettingsTab.Prompt, label: "提示词", icon: "💬" },
    { key: SettingsTab.ModelService, label: "模型服务", icon: "🔧" },
    { key: SettingsTab.ModelConfig, label: "模型配置", icon: "🤖" },
    { key: SettingsTab.Voice, label: "语音", icon: "🔊" },
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
  const renderPromptSettings = () => (
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
          subTitle={Locale.Settings.Prompt.ListCount(builtinCount, customCount)}
        >
          <IconButton
            aria={Locale.Settings.Prompt.List + Locale.Settings.Prompt.Edit}
            icon={<EditIcon />}
            text={Locale.Settings.Prompt.Edit}
            onClick={() => setShowPromptModal(true)}
          />
        </ListItem>
      </List>
      {shouldShowPromptModal && (
        <UserPromptModal onClose={() => setShowPromptModal(false)} />
      )}
    </>
  );

  // 服务提供商配置
  const providerConfigs = [
    {
      provider: ServiceProvider.OpenAI,
      name: "OpenAI",
      description: "OpenAI GPT 系列模型",
      configComponent: openAIConfigComponent,
    },
    {
      provider: ServiceProvider.Azure,
      name: "Azure OpenAI",
      description: "微软 Azure OpenAI 服务",
      configComponent: azureConfigComponent,
    },
    {
      provider: ServiceProvider.Google,
      name: "Google",
      description: "Google Gemini 系列模型",
      configComponent: googleConfigComponent,
    },
    {
      provider: ServiceProvider.Anthropic,
      name: "Anthropic",
      description: "Anthropic Claude 系列模型",
      configComponent: anthropicConfigComponent,
    },
    {
      provider: ServiceProvider.ByteDance,
      name: "字节跳动",
      description: "字节跳动豆包系列模型",
      configComponent: byteDanceConfigComponent,
    },
    {
      provider: ServiceProvider.Alibaba,
      name: "阿里云",
      description: "阿里云通义千问系列模型",
      configComponent: alibabaConfigComponent,
    },
    {
      provider: ServiceProvider.Moonshot,
      name: "月之暗面",
      description: "Moonshot Kimi 系列模型",
      configComponent: moonshotConfigComponent,
    },
    {
      provider: ServiceProvider.DeepSeek,
      name: "DeepSeek",
      description: "DeepSeek 系列模型",
      configComponent: deepseekConfigComponent,
    },
    // XAI 暂时禁用
    // {
    //   provider: ServiceProvider.XAI,
    //   name: "xAI",
    //   description: "xAI Grok 系列模型",
    //   configComponent: XAIConfigComponent,
    // },
    {
      provider: ServiceProvider.SiliconFlow,
      name: "SiliconFlow",
      description: "SiliconFlow 硅基流动",
      configComponent: siliconflowConfigComponent,
    },
  ];

  // 模型服务设置
  const renderModelServiceSettings = () => (
    <>
      <List id={SlotID.CustomModel}>{accessCodeComponent}</List>

      {!accessStore.hideUserApiKey && (
        <div className={styles["provider-cards"]}>
          {providerConfigs.map((config) => {
            const isEnabled =
              accessStore.enabledProviders?.[config.provider] || false;
            const isCollapsed = collapsedProviders[config.provider] || false;

            return (
              <div
                key={config.provider}
                className={`${styles["provider-card"]} ${
                  isEnabled ? styles["provider-card-active"] : ""
                }`}
              >
                <div
                  className={styles["provider-card-header"]}
                  onClick={() => {
                    if (isEnabled) {
                      setCollapsedProviders((prev) => ({
                        ...prev,
                        [config.provider]: !prev[config.provider],
                      }));
                    }
                  }}
                >
                  <div className={styles["provider-info"]}>
                    <span className={styles["provider-icon"]}>
                      <ProviderIcon provider={config.provider} size={24} />
                    </span>
                    <div>
                      <div className={styles["provider-name-container"]}>
                        <h3 className={styles["provider-name"]}>
                          {config.name}
                        </h3>
                        {isEnabled && (
                          <span className={styles["provider-badge"]}>
                            已启用
                          </span>
                        )}
                      </div>
                      <p className={styles["provider-description"]}>
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div className={styles["provider-controls"]}>
                    <div className={styles["provider-toggle"]}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => {
                          e.stopPropagation();
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
                              } as Record<ServiceProvider, boolean>;
                            }
                            access.enabledProviders[config.provider] =
                              e.target.checked;
                          });
                        }}
                        className={styles["provider-checkbox"]}
                      />
                    </div>
                    {isEnabled && (
                      <button
                        className={`${styles["collapse-button"]} ${
                          isCollapsed ? styles["collapsed"] : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedProviders((prev) => ({
                            ...prev,
                            [config.provider]: !prev[config.provider],
                          }));
                        }}
                      >
                        <DownIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isEnabled && (
                  <div
                    className={`${styles["provider-config"]} ${
                      isCollapsed ? styles["collapsed"] : styles["expanded"]
                    }`}
                  >
                    <List>
                      {config.configComponent}

                      {/* 启用模型列表 */}
                      <ListItem
                        title="启用的模型"
                        subTitle="当前服务商中已启用的模型列表"
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
                                ).map((modelName) => (
                                  <span
                                    key={modelName}
                                    className={styles["model-tag"]}
                                  >
                                    {modelName}
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
                                暂无启用的模型
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
                            管理
                          </button>
                        </div>
                      </ListItem>
                    </List>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <List>
        {!shouldHideBalanceQuery && !clientConfig?.isApp ? (
          <ListItem
            title={Locale.Settings.Usage.Title}
            subTitle={
              showUsage
                ? loadingUsage
                  ? Locale.Settings.Usage.IsChecking
                  : Locale.Settings.Usage.SubTitle(
                      usage?.used ?? "[?]",
                      usage?.subscription ?? "[?]",
                    )
                : Locale.Settings.Usage.NoAccess
            }
          >
            {!showUsage || loadingUsage ? (
              <div />
            ) : (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                text={Locale.Settings.Usage.Check}
                onClick={() => checkUsage(true)}
              />
            )}
          </ListItem>
        ) : null}
      </List>
    </>
  );

  // 准备分组模型数据 - 基于启用的提供商和模型
  const allModels = useAllModels();
  const enabledProviders = accessStore.enabledProviders || {};
  const enabledModels = accessStore.enabledModels || {};

  // 按提供商分组，只显示已启用的提供商和已配置的模型
  const groupedModels: Record<string, any[]> = {};

  allModels.forEach((model) => {
    const providerName = model.provider?.providerName as ServiceProvider;
    if (!providerName || !enabledProviders[providerName]) return;

    const providerEnabledModels = enabledModels[providerName] || [];
    // 只有明确配置了可用模型的提供商才显示，且只显示已配置的模型
    if (
      providerEnabledModels.length > 0 &&
      providerEnabledModels.includes(model.name)
    ) {
      if (!groupedModels[providerName]) {
        groupedModels[providerName] = [];
      }
      groupedModels[providerName].push({
        name: model.name,
        displayName: model.displayName,
        providerName: model.provider?.providerName,
      });
    }
  });

  // 模型配置设置
  const renderModelConfigSettings = () => (
    <List>
      <ListItem title={Locale.Settings.Model}>
        <Select
          aria-label={Locale.Settings.Model}
          value={`${config.modelConfig.model}@${config.modelConfig?.providerName}`}
          align="left"
          onChange={(e) => {
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );
            config.update((config) => {
              config.modelConfig.model = model as any;
              config.modelConfig.providerName = providerName as ServiceProvider;
            });
          }}
        >
          {Object.entries(groupedModels).map(([providerName, models]) => (
            <optgroup label={providerName} key={providerName}>
              {models.map((model) => (
                <option
                  value={`${model.name}@${model.providerName}`}
                  key={`${model.name}@${model.providerName}`}
                >
                  {model.displayName}
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
              onClick={() => navigate(Path.Home)}
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
    </ErrorBoundary>
  );
}
