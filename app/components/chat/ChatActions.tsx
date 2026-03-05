import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useNavigate } from "react-router-dom";
import {
  ModelType,
  Theme,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "../../store";
import {
  getModelContextTokens,
  formatTokenCount,
  getModelCompressThreshold,
} from "../../config/model-config";
import Locale from "../../locales";
import {
  Selector,
  ModelSelectorModal,
  MultiModelSelectorModal,
  showToast,
} from "../ui-lib";
import { ChatControllerPool } from "../../client/controller";
import { DalleQuality, DalleStyle, ModelSize } from "../../typing";
import {
  isVisionModel,
  isWebSearchModel,
  getModelCapabilities,
  ServiceProvider,
} from "../../constant";
import { useEnabledModels } from "../../utils/hooks";
import { getModelProvider } from "../../utils/model";
import {
  getModelSizes,
  isDalle3,
  supportsCustomSize,
  useMobileScreen,
} from "../../utils";
import { Avatar } from "../emoji";
import { ModelProviderIcon } from "../provider-icon";
import { getAvailableClientsCount } from "../../mcp/actions.client";

import ChatSettingsIcon from "../../icons/chat-settings.svg";
import StopIcon from "../../icons/pause.svg";
import BottomIcon from "../../icons/bottom.svg";
import LoadingButtonIcon from "../../icons/loading.svg";
import ImageIcon from "../../icons/image.svg";
import PromptIcon from "../../icons/prompt.svg";
import SizeIcon from "../../icons/size.svg";
import QualityIcon from "../../icons/hd.svg";
import StyleIcon from "../../icons/palette.svg";
import ShortcutkeyIcon from "../../icons/shortcutkey.svg";
import BrainIcon from "../../icons/brain.svg";
import SearchIcon from "../../icons/zoom.svg";
import McpToolIcon from "../../icons/tool.svg";
import LightningIcon from "../../icons/lightning.svg";
import BreakIcon from "../../icons/break.svg";
import HeadphoneIcon from "../../icons/headphone.svg";
import ConnectionIcon from "../../icons/connection.svg";

import { ChatAction } from "./ChatAction";
import { SessionConfigModel } from "./SessionConfigModel";
import { TokenCounter } from "./TokenCounter";
import styles from "../chat.module.scss";

const MCPAction = ({ onTogglePanel }: { onTogglePanel: () => void }) => {
  const [count, setCount] = useState<number>(0);
  const chatStore = useChatStore();
  const mcpEnabled = chatStore.getSessionMcpEnabled();

  useEffect(() => {
    const updateCount = async () => {
      const count = await getAvailableClientsCount();
      setCount(count);
    };
    updateCount();
  }, []);

  return (
    <ChatAction
      onClick={onTogglePanel}
      text={`MCP${count ? ` (${count})` : ""}`}
      icon={<McpToolIcon />}
      dataAttribute="data-mcp-button"
      active={mcpEnabled}
    />
  );
};

const MultiModelAction = ({
  onToggle,
  onOpenSelector,
}: {
  onToggle: () => void;
  onOpenSelector: () => void;
}) => {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const multiModelMode = session.multiModelMode;
  const isEnabled = multiModelMode?.enabled || false;
  const selectedCount = multiModelMode?.selectedModels?.length || 0;

  const handleClick = () => {
    if (isEnabled) {
      onToggle();
    } else {
      chatStore.updateTargetSession(session, (session) => {
        if (!session.multiModelMode) {
          session.multiModelMode = {
            enabled: true,
            selectedModels: [],
            modelMessages: {},
            modelStats: {},
            modelMemoryPrompts: {},
            modelSummarizeIndexes: {},
          };
        } else {
          session.multiModelMode.enabled = true;
        }
      });
      onOpenSelector();
    }
  };

  return (
    <ChatAction
      onClick={handleClick}
      text={`${
        isEnabled
          ? Locale.Chat.MultiModel.Enabled
          : Locale.Chat.MultiModel.Disabled
      }${
        selectedCount > 0
          ? ` ${Locale.Chat.MultiModel.Count(selectedCount)}`
          : ""
      }`}
      icon={<ConnectionIcon />}
      dataAttribute="data-multi-model-button"
      active={isEnabled}
    />
  );
};

export function ChatActions(props: {
  uploadImage: () => void;
  setAttachImages: (images: string[]) => void;
  setUploading: (uploading: boolean) => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  uploading: boolean;
  setShowShortcutKeyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUserInput: (input: string) => void;
  setShowChatSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
  showMcpPanel: boolean;
  setShowMcpPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showShortcutKeyPanel: boolean;
  setShowShortcutKeyPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showThinkingPanel: boolean;
  setShowThinkingPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showMultiModelPanel: boolean;
  setShowMultiModelPanel: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMultiModelMode: () => void;
  showModelSelector: boolean;
  setShowModelSelector: React.Dispatch<React.SetStateAction<boolean>>;
  userInput: string;
  couldStop: boolean;
  setCouldStop: React.Dispatch<React.SetStateAction<boolean>>;
  optimizePrompt: () => void;
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const accessStore = useAccessStore();

  const session = chatStore.currentSession();

  const [showChatSettings, setShowChatSettings] = useState(false);
  const [modelConfigUpdateCounter, setModelConfigUpdateCounter] = useState(0);

  useEffect(() => {
    const handleModelConfigUpdated = () => {
      setModelConfigUpdateCounter((prev) => prev + 1);
    };

    window.addEventListener(
      "modelConfigUpdated",
      handleModelConfigUpdated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "modelConfigUpdated",
        handleModelConfigUpdated as EventListener,
      );
    };
  }, []);

  const theme = config.theme;

  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  const stopAll = () => {
    ChatControllerPool.stopAll();
    props.setCouldStop(false);
  };

  const currentModel = session.mask.modelConfig.model;
  const currentProviderName =
    session.mask.modelConfig?.providerName || ServiceProvider.OpenAI.id;

  const enabledModels = useEnabledModels();
  const models = useMemo(() => {
    const defaultModel = enabledModels.find((m) => m.isDefault);

    if (defaultModel) {
      const arr = [
        defaultModel,
        ...enabledModels.filter((m) => m !== defaultModel),
      ];
      return arr;
    } else {
      return enabledModels;
    }
  }, [enabledModels]);
  const currentModelName = useMemo(() => {
    const model = models.find(
      (m) =>
        m.name == currentModel &&
        (m?.provider?.providerName == currentProviderName ||
          m?.provider?.id == currentProviderName),
    );
    return model?.displayName ?? "";
  }, [models, currentModel, currentProviderName]);

  const modelGroups = useMemo(() => {
    const groupedModels: Record<string, any[]> = {};

    models.forEach((model) => {
      const providerId = model.provider?.id;
      const providerName = model.provider?.providerName;

      if (!providerId || !providerName) {
        return;
      }

      const isCustomProvider = providerId.startsWith("custom_");
      const customProvider = isCustomProvider
        ? accessStore.customProviders.find((p) => p.id === providerId)
        : null;

      const displayName = isCustomProvider
        ? customProvider?.name || providerName
        : providerName;

      if (!groupedModels[displayName]) {
        groupedModels[displayName] = [];
      }

      const contextConfig = getModelContextTokens(model.name);
      const contextTokensDisplay = contextConfig
        ? formatTokenCount(contextConfig.contextTokens)
        : null;

      groupedModels[displayName].push({
        title: model.displayName,
        subTitle: contextTokensDisplay
          ? Locale.Chat.UI.ContextTooltip.ContextTokens(contextTokensDisplay)
          : undefined,
        searchText: model.displayName,
        value: `${model.name}@${providerId}`,
        icon: <Avatar model={model.name} />,
      });
    });

    const result = Object.entries(groupedModels).map(
      ([providerName, models]) => ({
        groupName: providerName,
        items: models,
      }),
    );

    return result;
  }, [models, accessStore.customProviders, modelConfigUpdateCounter]);

  const [showUploadImage, setShowUploadImage] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const modelSizes = getModelSizes(currentModel);
  const dalle3Qualitys: DalleQuality[] = ["standard", "hd"];
  const dalle3Styles: DalleStyle[] = ["vivid", "natural"];
  const currentSize =
    session.mask.modelConfig?.size ?? ("1024x1024" as ModelSize);
  const currentQuality = session.mask.modelConfig?.quality ?? "standard";
  const currentStyle = session.mask.modelConfig?.style ?? "vivid";

  const isMobileScreen = useMobileScreen();

  const { setAttachImages, setUploading } = props;
  useEffect(() => {
    const show = isVisionModel(currentModel);
    setShowUploadImage(show);
    if (!show) {
      setAttachImages([]);
      setUploading(false);
    }
  }, [currentModel, setAttachImages, setUploading]);

  useEffect(() => {
    const handleModelConfigUpdated = (event: CustomEvent) => {
      const { modelName } = event.detail;
      if (modelName === currentModel) {
        const show = isVisionModel(currentModel);
        setShowUploadImage(show);
        if (!show) {
          setAttachImages([]);
          setUploading(false);
        }
      }
    };

    window.addEventListener(
      "modelConfigUpdated",
      handleModelConfigUpdated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "modelConfigUpdated",
        handleModelConfigUpdated as EventListener,
      );
    };
  }, [currentModel, setAttachImages, setUploading]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const modelAvailability = useMemo(() => {
    const isUnavailableModel = !models.some((m) => m.name === currentModel);
    const nextModel =
      isUnavailableModel && models.length > 0
        ? models.find((model) => model.isDefault) || models[0]
        : null;
    return { isUnavailableModel, nextModel };
  }, [models, currentModel]);

  const updateSessionModel = useDebouncedCallback((nextModel: any) => {
    chatStore.updateTargetSession(sessionRef.current, (session) => {
      session.mask.modelConfig.model = nextModel.name;
      session.mask.modelConfig.providerName = nextModel?.provider?.id as string;

      const modelCapabilities = getModelCapabilities(
        session.mask.modelConfig.model,
      );
      if (
        modelCapabilities.reasoning &&
        modelCapabilities.reasoningField &&
        session.mask.modelConfig.thinkingBudget === undefined
      ) {
        session.mask.modelConfig.thinkingBudget = -1;
      }

      const autoThreshold = getModelCompressThreshold(nextModel.name);
      session.mask.modelConfig.compressMessageLengthThreshold = autoThreshold;
    });
    showToast(nextModel.name);
  }, 100);

  const leftActions = (
    <>
      <ChatAction
        onClick={() => setShowChatSettings(true)}
        text={Locale.ChatSettings.Name}
        icon={<ChatSettingsIcon />}
      />
      {props.couldStop && (
        <ChatAction
          onClick={stopAll}
          text={Locale.Chat.InputActions.Stop}
          icon={<StopIcon />}
        />
      )}
      {!props.hitBottom && (
        <ChatAction
          onClick={props.scrollToBottom}
          text={Locale.Chat.InputActions.ToBottom}
          icon={<BottomIcon />}
        />
      )}

      {showUploadImage && (
        <ChatAction
          onClick={props.uploadImage}
          text={Locale.Chat.InputActions.UploadImage}
          icon={props.uploading ? <LoadingButtonIcon /> : <ImageIcon />}
        />
      )}

      <ChatAction
        onClick={props.showPromptHints}
        text={Locale.Chat.InputActions.Prompt}
        icon={<PromptIcon />}
      />

      {supportsCustomSize(currentModel) && (
        <ChatAction
          onClick={() => setShowSizeSelector(true)}
          text={currentSize}
          icon={<SizeIcon />}
        />
      )}

      {showSizeSelector && (
        <Selector
          defaultSelectedValue={currentSize}
          items={modelSizes.map((m) => ({
            title: m,
            value: m,
          }))}
          onClose={() => setShowSizeSelector(false)}
          onSelection={(s) => {
            if (s.length === 0) return;
            const size = s[0];
            chatStore.updateTargetSession(session, (session) => {
              session.mask.modelConfig.size = size;
            });
            showToast(size);
          }}
        />
      )}

      {isDalle3(currentModel) && (
        <ChatAction
          onClick={() => setShowQualitySelector(true)}
          text={currentQuality}
          icon={<QualityIcon />}
        />
      )}

      {showQualitySelector && (
        <Selector
          defaultSelectedValue={currentQuality}
          items={dalle3Qualitys.map((m) => ({
            title: m,
            value: m,
          }))}
          onClose={() => setShowQualitySelector(false)}
          onSelection={(q) => {
            if (q.length === 0) return;
            const quality = q[0];
            chatStore.updateTargetSession(session, (session) => {
              session.mask.modelConfig.quality = quality;
            });
            showToast(quality);
          }}
        />
      )}

      {isDalle3(currentModel) && (
        <ChatAction
          onClick={() => setShowStyleSelector(true)}
          text={currentStyle}
          icon={<StyleIcon />}
        />
      )}

      {showStyleSelector && (
        <Selector
          defaultSelectedValue={currentStyle}
          items={dalle3Styles.map((m) => ({
            title: m,
            value: m,
          }))}
          onClose={() => setShowStyleSelector(false)}
          onSelection={(s) => {
            if (s.length === 0) return;
            const style = s[0];
            chatStore.updateTargetSession(session, (session) => {
              session.mask.modelConfig.style = style;
            });
            showToast(style);
          }}
        />
      )}

      {!isMobileScreen && (
        <ChatAction
          onClick={() =>
            props.setShowShortcutKeyPanel(!props.showShortcutKeyPanel)
          }
          text={Locale.Chat.ShortcutKey.Title}
          icon={<ShortcutkeyIcon />}
          dataAttribute="data-shortcut-button"
          active={props.showShortcutKeyPanel}
        />
      )}
      {(() => {
        const currentModel = session.mask.modelConfig.model;
        const modelCapabilities = getModelCapabilities(currentModel);
        return (
          modelCapabilities.reasoning &&
          modelCapabilities.reasoningField && (
            <ChatAction
              onClick={() =>
                props.setShowThinkingPanel(!props.showThinkingPanel)
              }
              text={Locale.Chat.Thinking.Title}
              icon={<BrainIcon />}
              dataAttribute="data-thinking-button"
              active={props.showThinkingPanel}
            />
          )
        );
      })()}
      {(() => {
        const currentModel = session.mask.modelConfig.model;
        const supportsSearch = isWebSearchModel(currentModel);

        if (!supportsSearch) return null;

        const searchEnabled = session.searchEnabled ?? false;

        return (
          <ChatAction
            onClick={() => {
              const newSearchEnabled = !searchEnabled;
              chatStore.updateTargetSession(session, (session) => {
                session.searchEnabled = newSearchEnabled;
              });

              showToast(
                newSearchEnabled
                  ? Locale.Chat.InputActions.SearchEnabledToast
                  : Locale.Chat.InputActions.SearchDisabledToast,
              );
            }}
            text={
              searchEnabled
                ? Locale.Chat.InputActions.SearchOn
                : Locale.Chat.InputActions.SearchOff
            }
            icon={<SearchIcon />}
            dataAttribute="data-search-button"
            active={searchEnabled}
          />
        );
      })()}
      {!isMobileScreen && (
        <MCPAction
          onTogglePanel={() => props.setShowMcpPanel(!props.showMcpPanel)}
        />
      )}
      <MultiModelAction
        onToggle={() => props.toggleMultiModelMode()}
        onOpenSelector={() => props.setShowModelSelector(true)}
      />
      <ChatAction
        text={Locale.Chat.InputActions.Optimize}
        icon={<LightningIcon />}
        onClick={props.optimizePrompt}
      />
      <ChatAction
        text={Locale.Chat.InputActions.Clear}
        icon={<BreakIcon />}
        onClick={() => {
          chatStore.updateTargetSession(session, (session) => {
            if (session.clearContextIndex === session.messages.length) {
              session.clearContextIndex = undefined;
            } else {
              session.clearContextIndex = session.messages.length;
              session.memoryPrompt = "";
              session.responseApiConversationId = undefined;
              session.lastAutoTopicIndex = session.messages.length;
              if (session.multiModelMode) {
                session.multiModelMode.modelResponseApiConversationIds = {};
              }
            }
          });
        }}
      />
    </>
  );
  const rightActions = (
    <>
      {config.realtimeConfig.enable && (
        <ChatAction
          onClick={() => props.setShowChatSidePanel(true)}
          text={"Realtime Chat"}
          icon={<HeadphoneIcon />}
        />
      )}

      <div className={styles["model-selector-container"]}>
        <TokenCounter
          session={session}
          currentModel={currentModel}
          userInput={props.userInput}
        />
        <button
          className={styles["model-selector-button"]}
          onClick={() => props.setShowModelSelector(true)}
        >
          {session.multiModelMode?.enabled &&
          session.multiModelMode.selectedModels.length > 1 ? (
            <>
              <div className={styles["model-icon"]}>
                <BrainIcon />
              </div>
              <span className={styles["model-name"]}>
                {session.multiModelMode.selectedModels
                  .map((modelKey) => {
                    const [modelName] = modelKey.split("@");
                    return modelName;
                  })
                  .join(" / ")}
              </span>
            </>
          ) : (
            <>
              <div className={styles["model-icon"]}>
                <ModelProviderIcon
                  provider={currentProviderName}
                  size={20}
                  modelName={currentModel}
                />
              </div>
              <span className={styles["model-name"]}>{currentModelName}</span>
            </>
          )}
        </button>

        {props.showModelSelector && !session.multiModelMode?.enabled && (
          <ModelSelectorModal
            defaultSelectedValue={`${currentModel}@${currentProviderName}`}
            groups={modelGroups}
            searchPlaceholder={Locale.Chat.UI.SearchModels}
            onClose={() => props.setShowModelSelector(false)}
            onSelection={(selectedValue) => {
              const [model, providerId] = getModelProvider(selectedValue);
              chatStore.updateTargetSession(session, (session) => {
                session.mask.modelConfig.model = model as ModelType;
                session.mask.modelConfig.providerName = providerId!;
                session.mask.syncGlobalConfig = false;

                const modelCapabilities = getModelCapabilities(
                  session.mask.modelConfig.model,
                );
                if (
                  modelCapabilities.reasoning &&
                  modelCapabilities.reasoningField &&
                  session.mask.modelConfig.thinkingBudget === undefined
                ) {
                  session.mask.modelConfig.thinkingBudget = -1;
                }

                const autoThreshold = getModelCompressThreshold(model);
                session.mask.modelConfig.compressMessageLengthThreshold =
                  autoThreshold;
              });

              const selectedModel = models.find(
                (m) => m.name == model && m?.provider?.id == providerId,
              );

              showToast(selectedModel?.displayName || model);
            }}
          />
        )}

        {props.showModelSelector && session.multiModelMode?.enabled && (
          <MultiModelSelectorModal
            groups={modelGroups}
            defaultSelectedValues={session.multiModelMode?.selectedModels || []}
            searchPlaceholder={Locale.Chat.UI.SearchModels}
            onClose={() => {
              props.setShowModelSelector(false);
              if ((session.multiModelMode?.selectedModels?.length || 0) < 2) {
                chatStore.updateTargetSession(session, (session) => {
                  if (session.multiModelMode) {
                    session.multiModelMode.enabled = false;
                    session.multiModelMode.selectedModels = [];
                  }
                });
              }
            }}
            onSelection={(selectedValues) => {
              if (selectedValues.length < 2) {
                showToast(Locale.Chat.MultiModel.MinimumModelsError);
                return;
              }

              chatStore.updateTargetSession(session, (session) => {
                if (!session.multiModelMode) {
                  session.multiModelMode = {
                    enabled: true,
                    selectedModels: [],
                    modelMessages: {},
                    modelStats: {},
                    modelMemoryPrompts: {},
                    modelSummarizeIndexes: {},
                  };
                }

                session.multiModelMode.selectedModels = selectedValues;
                session.multiModelMode.enabled = true;

                selectedValues.forEach((modelKey) => {
                  if (!session.multiModelMode!.modelMessages[modelKey]) {
                    session.multiModelMode!.modelMessages[modelKey] = [];
                  }
                  if (!session.multiModelMode!.modelStats[modelKey]) {
                    session.multiModelMode!.modelStats[modelKey] = {
                      tokenCount: 0,
                      wordCount: 0,
                      charCount: 0,
                    };
                  }
                  if (!session.multiModelMode!.modelMemoryPrompts[modelKey]) {
                    session.multiModelMode!.modelMemoryPrompts[modelKey] = "";
                  }
                  if (
                    !session.multiModelMode!.modelSummarizeIndexes[modelKey]
                  ) {
                    session.multiModelMode!.modelSummarizeIndexes[modelKey] = 0;
                  }
                });

                const currentKeys = Object.keys(
                  session.multiModelMode.modelMessages,
                );
                currentKeys.forEach((key) => {
                  if (!selectedValues.includes(key)) {
                    delete session.multiModelMode!.modelMessages[key];
                    delete session.multiModelMode!.modelStats[key];
                    delete session.multiModelMode!.modelMemoryPrompts[key];
                    delete session.multiModelMode!.modelSummarizeIndexes[key];
                  }
                });
              });

              showToast(
                Locale.Chat.MultiModel.ModelsSelectedToast(
                  selectedValues.length,
                ),
              );
            }}
          />
        )}
      </div>
    </>
  );

  useEffect(() => {
    if (modelAvailability.nextModel) {
      updateSessionModel(modelAvailability.nextModel);
    }
  }, [modelAvailability.nextModel, updateSessionModel]);

  return (
    <div className={styles["chat-input-actions"]}>
      {isMobileScreen ? (
        <>
          {leftActions}
          {rightActions}
        </>
      ) : (
        <>
          {leftActions}
          <div className={styles["chat-input-actions-end"]}>{rightActions}</div>
        </>
      )}
      {showChatSettings && (
        <SessionConfigModel onClose={() => setShowChatSettings(false)} />
      )}
    </div>
  );
}
