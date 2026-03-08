import { IconButton } from "./button";
import { ErrorBoundary } from "./error";

import styles from "./mask.module.scss";

import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import EditIcon from "../icons/edit.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import EyeIcon from "../icons/eye.svg";
import CopyIcon from "../icons/copy.svg";
import DragIcon from "../icons/drag.svg";

import {
  DEFAULT_MASK_AVATAR,
  DEFAULT_MASK_ID,
  Mask,
  useMaskStore,
} from "../store/mask";
import { getBuiltinMasks } from "../masks";
import {
  ChatMessage,
  createMessage,
  ModelConfig,
  ModelType,
  useAppConfig,
  useChatStore,
} from "../store";
import { MultimodalContent, ROLES } from "../client/api";
import {
  Input,
  List,
  ListItem,
  Modal,
  Popover,
  Select,
  showConfirm,
} from "./ui-lib";
import { Avatar, AvatarPicker } from "./emoji";
import { ModelProviderIcon } from "./provider-icon";
import Locale, { AllLangs, ALL_LANG_OPTIONS, Lang } from "../locales";
import { getMaskEffectiveModel } from "../utils/model-resolver";
import { useNavigate } from "react-router-dom";

import chatStyle from "./chat.module.scss";
import { useState, useMemo } from "react";
import {
  copyToClipboard,
  downloadAs,
  getMessageImages,
  readFromFile,
} from "../utils";
import { Updater } from "../typing";
import { ModelConfigList } from "./model-config";
import { FileName, Path, ServiceProvider } from "../constant";

import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { getMessageTextContent } from "../utils";
import clsx from "clsx";
import { useAllModels } from "../utils/hooks";
import { getModelProvider } from "../utils/model";
import { useAccessStore } from "../store/access";
import { groupBy } from "lodash-es";
import { getModelCompressThreshold } from "../config/model-config";
import { useEnabledModels } from "../utils/hooks";

// drag and drop helper function
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export function MaskAvatar(props: {
  avatar: string;
  model?: ModelType;
  /** 模型完整标识，格式 model@provider，与右下角模型配置保持一致 */
  modelKey?: string;
  /** 厂商名称或 ID，与 model 一起使用时优先采用 ModelProviderIcon */
  provider?: string;
}) {
  const config = useAppConfig();

  // 解析 modelKey（model@provider）获取 model 和 provider
  const [modelName, providerName] = (() => {
    if (props.modelKey?.includes("@")) {
      const [m, p] = props.modelKey.split("@");
      return [m || props.model, p];
    }
    return [props.model, props.provider];
  })();

  // 有 model 和 provider 时，使用与右下角模型配置相同的 ModelProviderIcon
  const useModelIcon =
    (config.useModelIconAsAvatar && modelName) ||
    props.avatar === DEFAULT_MASK_AVATAR;
  if (useModelIcon && modelName && providerName) {
    return (
      <div className="no-dark user-avatar">
        <ModelProviderIcon
          provider={providerName}
          modelName={modelName}
          size={24}
        />
      </div>
    );
  }

  // 仅有 model 时沿用 Avatar（兼容旧逻辑）
  if (config.useModelIconAsAvatar && modelName) {
    return <Avatar model={modelName} />;
  }

  return props.avatar !== DEFAULT_MASK_AVATAR ? (
    <Avatar avatar={props.avatar} />
  ) : (
    <Avatar model={modelName} />
  );
}

export function MaskConfig(props: {
  mask: Mask;
  updateMask: Updater<Mask>;
  extraListItems?: JSX.Element;
  readonly?: boolean;
  shouldSyncFromGlobal?: boolean;
  isSessionConfig?: boolean; // 新增参数，标识是否为会话配置
}) {
  const [showPicker, setShowPicker] = useState(false);
  //const allModels = useAllModels();
  const accessStore = useAccessStore();

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

  const updateConfig = (updater: (config: ModelConfig) => void) => {
    if (props.readonly) return;

    const config = { ...props.mask.modelConfig };
    updater(config);
    props.updateMask((mask) => {
      mask.modelConfig = config;
      // if user changed current session mask, it will disable auto sync
      mask.syncGlobalConfig = false;
    });
  };

  const globalConfig = useAppConfig();

  // 默认助手：模型配置只读并始终显示当前全局配置
  const isDefaultAssistant = props.mask.id === DEFAULT_MASK_ID;
  const displayModelConfig = isDefaultAssistant
    ? globalConfig.modelConfig
    : props.mask.modelConfig;

  const copyMaskLink = () => {
    const maskLink = `${location.protocol}//${location.host}/#${Path.NewChat}?mask=${props.mask.id}`;
    copyToClipboard(maskLink);
  };

  return (
    <>
      <ContextPrompts
        context={props.mask.context}
        updateContext={(updater) => {
          const context = props.mask.context.slice();
          updater(context);
          props.updateMask((mask) => (mask.context = context));
        }}
      />

      <List>
        <ListItem title={Locale.Mask.Config.Avatar}>
          <Popover
            content={
              <AvatarPicker
                onEmojiClick={(emoji) => {
                  props.updateMask((mask) => (mask.avatar = emoji));
                  setShowPicker(false);
                }}
              ></AvatarPicker>
            }
            open={showPicker}
            onClose={() => setShowPicker(false)}
          >
            <div
              tabIndex={0}
              aria-label={Locale.Mask.Config.Avatar}
              onClick={() => setShowPicker(true)}
              style={{ cursor: "pointer" }}
            >
              <MaskAvatar
                avatar={props.mask.avatar}
                model={getMaskEffectiveModel(props.mask) as any}
              />
            </div>
          </Popover>
        </ListItem>
        <ListItem title={Locale.Mask.Config.Name}>
          <input
            aria-label={Locale.Mask.Config.Name}
            type="text"
            value={props.mask.name}
            onInput={(e) =>
              props.updateMask((mask) => {
                mask.name = e.currentTarget.value;
              })
            }
          ></input>
        </ListItem>
        <ListItem
          title={Locale.Mask.Config.HideContext.Title}
          subTitle={Locale.Mask.Config.HideContext.SubTitle}
        >
          <input
            aria-label={Locale.Mask.Config.HideContext.Title}
            type="checkbox"
            checked={props.mask.hideContext}
            onChange={(e) => {
              props.updateMask((mask) => {
                mask.hideContext = e.currentTarget.checked;
              });
            }}
          ></input>
        </ListItem>

        {globalConfig.enableArtifacts && (
          <ListItem
            title={Locale.Mask.Config.Artifacts.Title}
            subTitle={Locale.Mask.Config.Artifacts.SubTitle}
          >
            <input
              aria-label={Locale.Mask.Config.Artifacts.Title}
              type="checkbox"
              checked={props.mask.enableArtifacts !== false}
              onChange={(e) => {
                props.updateMask((mask) => {
                  mask.enableArtifacts = e.currentTarget.checked;
                });
              }}
            ></input>
          </ListItem>
        )}
        {globalConfig.enableCodeFold && (
          <ListItem
            title={Locale.Mask.Config.CodeFold.Title}
            subTitle={Locale.Mask.Config.CodeFold.SubTitle}
          >
            <input
              aria-label={Locale.Mask.Config.CodeFold.Title}
              type="checkbox"
              checked={props.mask.enableCodeFold !== false}
              onChange={(e) => {
                props.updateMask((mask) => {
                  mask.enableCodeFold = e.currentTarget.checked;
                });
              }}
            ></input>
          </ListItem>
        )}

        {!props.shouldSyncFromGlobal && !isDefaultAssistant ? (
          <ListItem
            title={Locale.Mask.Config.Share.Title}
            subTitle={Locale.Mask.Config.Share.SubTitle}
          >
            <IconButton
              aria={Locale.Mask.Config.Share.Title}
              icon={<CopyIcon />}
              text={Locale.Mask.Config.Share.Action}
              onClick={copyMaskLink}
            />
          </ListItem>
        ) : null}

        {props.shouldSyncFromGlobal && !isDefaultAssistant ? (
          <ListItem
            title={Locale.Mask.Config.Sync.Title}
            subTitle={Locale.Mask.Config.Sync.SubTitle}
          >
            <input
              aria-label={Locale.Mask.Config.Sync.Title}
              type="checkbox"
              checked={props.mask.syncGlobalConfig}
              onChange={async (e) => {
                const checked = e.currentTarget.checked;
                if (
                  checked &&
                  (await showConfirm(Locale.Mask.Config.Sync.Confirm))
                ) {
                  props.updateMask((mask) => {
                    mask.syncGlobalConfig = checked;
                    mask.modelConfig = { ...globalConfig.modelConfig };
                  });
                } else if (!checked) {
                  props.updateMask((mask) => {
                    mask.syncGlobalConfig = checked;
                  });
                }
              }}
            ></input>
          </ListItem>
        ) : null}
      </List>

      <List>
        {/* 根据使用场景显示不同的模型选择器 */}
        {props.isSessionConfig ? (
          // 会话配置：显示 ModelConfigList 中的模型选择器，辅助模型不显示"使用全局"选项
          <ModelConfigList
            modelConfig={{ ...props.mask.modelConfig }}
            updateConfig={updateConfig}
            showModelSelector={true}
            showGlobalOption={false}
          />
        ) : isDefaultAssistant ? (
          // 默认助手：只读，始终显示当前全局配置（设置-模型配置）
          <ModelConfigList
            modelConfig={{ ...displayModelConfig }}
            updateConfig={updateConfig}
            showModelSelector={false}
            showGlobalOption={false}
            readOnly={true}
          />
        ) : (
          // 助手编辑：显示默认模型选择器
          <>
            <ListItem
              title={Locale.Mask.DefaultModel}
              subTitle={Locale.Mask.DefaultModelDesc}
            >
              <Select
                className={styles["select-default-model"]}
                aria-label={Locale.Mask.DefaultModel}
                value={props.mask.defaultModel || ""}
                align="left"
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  props.updateMask((mask) => {
                    mask.defaultModel = value || undefined;

                    // 同时更新 modelConfig 中的模型配置
                    if (value) {
                      const [model, providerName] = getModelProvider(value);
                      if (model) {
                        mask.modelConfig.model = model as any;
                        if (providerName) {
                          mask.modelConfig.providerName = providerName as any;
                        }
                        // 根据新模型自动更新压缩阈值
                        const autoThreshold = getModelCompressThreshold(
                          model,
                          mask.modelConfig.compressThresholdRatio,
                        );
                        mask.modelConfig.compressMessageLengthThreshold =
                          autoThreshold;
                      }
                    }
                  });
                }}
              >
                <option value="">{Locale.Mask.UseGlobalModel}</option>
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
              modelConfig={{ ...props.mask.modelConfig }}
              updateConfig={updateConfig}
              showModelSelector={false}
              showGlobalOption={false}
            />
          </>
        )}
        {props.extraListItems}
      </List>
    </>
  );
}

function ContextPromptItem(props: {
  index: number;
  prompt: ChatMessage;
  update: (prompt: ChatMessage) => void;
  remove: () => void;
}) {
  const [focusingInput, setFocusingInput] = useState(false);

  return (
    <div className={chatStyle["context-prompt-row"]}>
      {!focusingInput && (
        <>
          <div className={chatStyle["context-drag"]}>
            <DragIcon />
          </div>
          <Select
            value={props.prompt.role}
            className={chatStyle["context-role"]}
            onChange={(e) =>
              props.update({
                ...props.prompt,
                role: e.target.value as any,
              })
            }
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </>
      )}
      <Input
        value={getMessageTextContent(props.prompt)}
        type="text"
        className={chatStyle["context-content"]}
        rows={focusingInput ? 5 : 1}
        onFocus={() => setFocusingInput(true)}
        onBlur={() => {
          setFocusingInput(false);
          // If the selection is not removed when the user loses focus, some
          // extensions like "Translate" will always display a floating bar
          window?.getSelection()?.removeAllRanges();
        }}
        onInput={(e) =>
          props.update({
            ...props.prompt,
            content: e.currentTarget.value as any,
          })
        }
      />
      {!focusingInput && (
        <IconButton
          icon={<DeleteIcon />}
          className={chatStyle["context-delete-button"]}
          onClick={() => props.remove()}
          bordered
        />
      )}
    </div>
  );
}

export function ContextPrompts(props: {
  context: ChatMessage[];
  updateContext: (updater: (context: ChatMessage[]) => void) => void;
}) {
  const context = props.context;

  const addContextPrompt = (prompt: ChatMessage, i: number) => {
    props.updateContext((context) => context.splice(i, 0, prompt));
  };

  const removeContextPrompt = (i: number) => {
    props.updateContext((context) => context.splice(i, 1));
  };

  const updateContextPrompt = (i: number, prompt: ChatMessage) => {
    props.updateContext((context) => {
      const images = getMessageImages(context[i]);
      context[i] = prompt;
      if (images.length > 0) {
        const text = getMessageTextContent(context[i]);
        const newContext: MultimodalContent[] = [{ type: "text", text }];
        for (const img of images) {
          newContext.push({ type: "image_url", image_url: { url: img } });
        }
        context[i].content = newContext;
      }
    });
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) {
      return;
    }
    const newContext = reorder(
      context,
      result.source.index,
      result.destination.index,
    );
    props.updateContext((context) => {
      context.splice(0, context.length, ...newContext);
    });
  };

  return (
    <>
      <div className={chatStyle["context-prompt"]} style={{ marginBottom: 20 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="context-prompt-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {context.map((c, i) => (
                  <Draggable
                    draggableId={c.id || i.toString()}
                    index={i}
                    key={c.id}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ContextPromptItem
                          index={i}
                          prompt={c}
                          update={(prompt) => updateContextPrompt(i, prompt)}
                          remove={() => removeContextPrompt(i)}
                        />
                        <div
                          className={chatStyle["context-prompt-insert"]}
                          onClick={() => {
                            addContextPrompt(
                              createMessage({
                                role: "user",
                                content: "",
                                date: new Date().toLocaleString(),
                              }),
                              i + 1,
                            );
                          }}
                        >
                          <AddIcon />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {props.context.length === 0 && (
          <div className={chatStyle["context-prompt-row"]}>
            <IconButton
              icon={<AddIcon />}
              text={Locale.Context.Add}
              bordered
              className={chatStyle["context-prompt-button"]}
              onClick={() =>
                addContextPrompt(
                  createMessage({
                    role: "user",
                    content: "",
                    date: "",
                  }),
                  props.context.length,
                )
              }
            />
          </div>
        )}
      </div>
    </>
  );
}

export function MaskPage() {
  const navigate = useNavigate();

  const maskStore = useMaskStore();
  const storeMasks = useMaskStore((s) => s.masks);
  const chatStore = useChatStore();

  const filterLang = maskStore.language;

  // 自定义助手：仅用户创建的（排除默认助手），按创建时间倒序
  const customMasksRaw = Object.values(storeMasks)
    .filter(
      (m) => m.id !== DEFAULT_MASK_ID && (!filterLang || m.lang === filterLang),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  // 内置助手：默认助手 + 预设列表
  const defaultMask = storeMasks[DEFAULT_MASK_ID];
  const builtinMasksRaw = [
    ...(defaultMask && (!filterLang || defaultMask.lang === filterLang)
      ? [defaultMask]
      : []),
    ...getBuiltinMasks().filter((m) => !filterLang || m.lang === filterLang),
  ];

  const [searchText, setSearchText] = useState("");
  const filterByName = (list: Mask[], text: string) =>
    text.length > 0
      ? list.filter((m) => m.name.toLowerCase().includes(text.toLowerCase()))
      : list;
  const customMasks = filterByName(customMasksRaw, searchText);
  const builtinMasks = filterByName(builtinMasksRaw, searchText);
  const totalCount = customMasksRaw.length + builtinMasksRaw.length;

  const onSearch = (text: string) => setSearchText(text);

  const [editingMaskId, setEditingMaskId] = useState<string | undefined>();
  const editingMask = editingMaskId ? storeMasks[editingMaskId] : undefined;
  const closeMaskModal = () => setEditingMaskId(undefined);

  const downloadAll = () => {
    downloadAs(
      JSON.stringify(customMasks.concat(builtinMasks)),
      FileName.Masks,
    );
  };

  const importFromFile = () => {
    readFromFile().then((content) => {
      try {
        const importMasks = JSON.parse(content);
        if (Array.isArray(importMasks)) {
          for (const mask of importMasks) {
            if (mask.name) {
              maskStore.create(mask);
            }
          }
          return;
        }
        //if the content is a single mask.
        if (importMasks.name) {
          maskStore.create(importMasks);
        }
      } catch {}
    });
  };

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              {Locale.Mask.Page.Title}
            </div>
            <div className="window-header-submai-title">
              {Locale.Mask.Page.SubTitle(totalCount)}
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<DownloadIcon />}
                bordered
                onClick={downloadAll}
                text={Locale.UI.Export}
              />
            </div>
            <div className="window-action-button">
              <IconButton
                icon={<UploadIcon />}
                text={Locale.UI.Import}
                bordered
                onClick={() => importFromFile()}
              />
            </div>
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
              />
            </div>
          </div>
        </div>

        <div className={styles["mask-page-body"]}>
          <div className={styles["mask-filter"]}>
            <input
              type="text"
              className={styles["search-bar"]}
              placeholder={Locale.Mask.Page.Search}
              autoFocus
              onInput={(e) => onSearch(e.currentTarget.value)}
            />
            <Select
              className={styles["mask-filter-lang"]}
              value={filterLang ?? Locale.Settings.Lang.All}
              onChange={(e) => {
                const value = e.currentTarget.value;
                if (value === Locale.Settings.Lang.All) {
                  maskStore.setLanguage(undefined);
                } else {
                  maskStore.setLanguage(value as Lang);
                }
              }}
            >
              <option key="all" value={Locale.Settings.Lang.All}>
                {Locale.Settings.Lang.All}
              </option>
              {AllLangs.map((lang) => (
                <option value={lang} key={lang}>
                  {ALL_LANG_OPTIONS[lang]}
                </option>
              ))}
            </Select>

            <IconButton
              className={styles["mask-create"]}
              icon={<AddIcon />}
              text={Locale.Mask.Page.Create}
              bordered
              onClick={() => {
                const createdMask = maskStore.create();
                setEditingMaskId(createdMask.id);
              }}
            />
          </div>

          {/* 自定义助手：编辑 + 删除 */}
          <div className={styles["mask-group"]}>
            <div className={styles["mask-group-title"]}>
              {Locale.Mask.GroupCustom}
            </div>
            {customMasks.map((m) => (
              <div className={styles["mask-item"]} key={m.id}>
                <div className={styles["mask-header"]}>
                  <div className={styles["mask-icon"]}>
                    <MaskAvatar
                      avatar={m.avatar}
                      model={getMaskEffectiveModel(m) as any}
                    />
                  </div>
                  <div className={styles["mask-title"]}>
                    <div className={styles["mask-name"]}>{m.name}</div>
                    <div className={styles["mask-info"]}>
                      {`${Locale.Mask.Item.Info(m.context.length)} / ${
                        ALL_LANG_OPTIONS[m.lang]
                      } / ${getMaskEffectiveModel(
                        m,
                      )} / ${Locale.Mask.ConversationCount(
                        chatStore.getSessionsByMask(m.id).length,
                      )}`}
                    </div>
                  </div>
                </div>
                <div className={styles["mask-actions"]}>
                  <IconButton
                    icon={<AddIcon />}
                    text={Locale.Mask.Item.Chat}
                    onClick={() => {
                      chatStore.newSession(m);
                      navigate(Path.Chat);
                    }}
                  />
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
              </div>
            ))}
          </div>

          {/* 内置助手：仅查看，修改后变为新增自定义助手 */}
          <div className={styles["mask-group"]}>
            <div className={styles["mask-group-title"]}>
              {Locale.Mask.GroupBuiltin}
            </div>
            {builtinMasks.map((m) => (
              <div className={styles["mask-item"]} key={m.id}>
                <div className={styles["mask-header"]}>
                  <div className={styles["mask-icon"]}>
                    <MaskAvatar
                      avatar={m.avatar}
                      model={getMaskEffectiveModel(m) as any}
                    />
                  </div>
                  <div className={styles["mask-title"]}>
                    <div className={styles["mask-name"]}>{m.name}</div>
                    <div className={styles["mask-info"]}>
                      {`${Locale.Mask.Item.Info(m.context.length)} / ${
                        ALL_LANG_OPTIONS[m.lang]
                      } / ${getMaskEffectiveModel(
                        m,
                      )} / ${Locale.Mask.ConversationCount(
                        chatStore.getSessionsByMask(m.id).length,
                      )}`}
                    </div>
                  </div>
                </div>
                <div className={styles["mask-actions"]}>
                  <IconButton
                    icon={<AddIcon />}
                    text={Locale.Mask.Item.Chat}
                    onClick={() => {
                      chatStore.newSession(m);
                      navigate(Path.Chat);
                    }}
                  />
                  <IconButton
                    icon={<EditIcon />}
                    text={Locale.Mask.Item.View}
                    onClick={() => {
                      if (storeMasks[m.id]) {
                        setEditingMaskId(m.id);
                      } else {
                        const created = maskStore.create({ ...m });
                        setEditingMaskId(created.id);
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingMask && (
        <div className="modal-mask">
          <Modal
            title={Locale.Mask.EditModal.Title}
            onClose={closeMaskModal}
            actions={[
              <IconButton
                icon={<DownloadIcon />}
                text={Locale.Mask.EditModal.Download}
                key="export"
                bordered
                onClick={() =>
                  downloadAs(
                    JSON.stringify(editingMask),
                    `${editingMask.name}.json`,
                  )
                }
              />,
              <IconButton
                key="copy"
                icon={<CopyIcon />}
                bordered
                text={Locale.Mask.EditModal.Clone}
                onClick={() => {
                  navigate(Path.Masks);
                  maskStore.create(editingMask);
                  setEditingMaskId(undefined);
                }}
              />,
            ]}
          >
            <MaskConfig
              mask={editingMask}
              updateMask={(updater) =>
                maskStore.updateMask(editingMaskId!, updater)
              }
              readonly={editingMask?.id === DEFAULT_MASK_ID}
            />
          </Modal>
        </div>
      )}
    </ErrorBoundary>
  );
}
