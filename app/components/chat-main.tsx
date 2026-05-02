import { useDebouncedCallback } from "use-debounce";
import React, {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";

import BrainIcon from "../icons/brain.svg";
import EditIcon from "../icons/rename.svg";
import CopyIcon from "../icons/copy.svg";
import SpeakIcon from "../icons/speak.svg";
import SpeakStopIcon from "../icons/speak-stop.svg";
import LoadingIcon from "../icons/three-dots.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import PromptIcon from "../icons/prompt.svg";
import ResetIcon from "../icons/reload.svg";
import LeftIcon from "../icons/left.svg";
import RightIcon from "../icons/right.svg";
import BreakIcon from "../icons/break.svg";
import DeleteIcon from "../icons/clear.svg";
import PinIcon from "../icons/pin.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CloseIcon from "../icons/close.svg";
import CancelIcon from "../icons/cancel.svg";
import ImageIcon from "../icons/image.svg";
import LightningIcon from "../icons/lightning.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";

import SizeIcon from "../icons/size.svg";
import QualityIcon from "../icons/hd.svg";
import SearchIcon from "../icons/zoom.svg";
import StyleIcon from "../icons/palette.svg";

import ShortcutkeyIcon from "../icons/shortcutkey.svg";
import McpToolIcon from "../icons/tool.svg";
import DebugIcon from "../icons/debug.svg";
import HeadphoneIcon from "../icons/headphone.svg";
import ConnectionIcon from "../icons/connection.svg";
import ChatSettingsIcon from "../icons/chat-settings.svg";
import {
  BOT_HELLO,
  ChatMessage,
  ChatSession,
  createMessage,
  DEFAULT_TOPIC,
  ModelType,
  Theme,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "../store";
import { normalizeProviderName, getClientApi } from "../client/api";
import {
  getModelContextTokens,
  formatTokenCount,
  getModelCompressThreshold,
} from "../config/model-config";
import { estimateTokenLength } from "../utils/token";

import {
  autoGrowTextArea,
  copyToClipboard,
  getMessageImages,
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  removeThinkingContent,
  isDalle3,
  safeLocalStorage,
  getModelSizes,
  supportsCustomSize,
  useMobileScreen,
  selectOrCopy,
  isThinkingModel,
  wrapThinkingPart,
} from "../utils";
import { isVisionModel, isWebSearchModel } from "../constant";

import { uploadImageAsBase64 } from "@/app/utils/chat";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { markdownToTxt } from "markdown-to-txt";
import { DalleQuality, DalleStyle, ModelSize } from "../typing";
import { usePromptStore } from "../store/prompt";
import Locale from "../locales";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  List,
  ListItem,
  Modal,
  Selector,
  ModelSelectorModal,
  MultiModelSelectorModal,
  showConfirm,
  showPrompt,
  showToast,
} from "./ui-lib";
import { useNavigate } from "react-router-dom";
import {
  CHAT_PAGE_SIZE,
  DEFAULT_TTS_ENGINE,
  Path,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
  UNFINISHED_INPUT,
} from "../constant";
import { Avatar } from "./emoji";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { useDragSideBar } from "./sidebar";
import { prettyObject } from "../utils/format";
import { getClientConfig } from "../config/client";
import { useEnabledModels } from "../utils/hooks";
import { ClientApi, MultimodalContent, RequestMessage } from "../client/api";
import { createTTSPlayer } from "../utils/audio";
import { MsEdgeTTS, OUTPUT_FORMAT } from "../utils/ms_edge_tts";
import { useScrollToBottom } from "./chat/hooks/useScrollToBottom";
import { useSubmitHandler } from "./chat/hooks/useSubmitHandler";
import {
  ProviderTooltip,
  getProviderDisplayName,
} from "./chat/ProviderTooltip";
import { LLMMessageContent } from "./chat/LLMMessageContent";
import { ClearContextDivider } from "./chat/ClearContextDivider";
import { CompressedContextDivider } from "./chat/CompressedContextDivider";
import { ChatAction } from "./chat/ChatAction";
import { DeleteImageButton } from "./chat/DeleteImageButton";
import { EditMessageModal } from "./chat/EditMessageModal";
import { ShortcutKeyModal } from "./chat/ShortcutKeyModal";
import { TokenCounter } from "./chat/TokenCounter";
import { ImagePreviewModal } from "./chat/ImagePreviewModal";
import { MultiModelMessages } from "./chat/MultiModelMessages";
import { SessionConfigModel } from "./chat/SessionConfigModel";
import { ChatHeader } from "./chat/ChatHeader";
import type { RenderPrompt } from "./chat/PromptHints";
import { ChatDebugModal } from "./chat/ChatDebugModal";
import { ChatInputPanel } from "./chat/ChatInputPanel";
import { SingleMessage } from "./chat/SingleMessage";
import {
  sessionScrollStateMap,
  getPersistedSessionScrollState,
  persistSessionScrollState,
} from "./chat/scrollState";
import { filterMcpMessages } from "./chat/utils/filterMcpMessages";

import { isEmpty } from "lodash-es";
import { getModelProvider } from "../utils/model";
import { getSessionOptimizeModelConfig } from "../utils/model-resolver";
import { RealtimeChat } from "@/app/components/realtime-chat";
import clsx from "clsx";
import { getAvailableClientsCount, getAllTools } from "../mcp/actions.client";
import { ModelCapabilityIcons } from "./model-capability-icons";
import { getModelCapabilities } from "../constant";
import { ProviderIcon, ModelProviderIcon } from "./provider-icon";
import { logger } from "../utils/logger";

const localStorage = safeLocalStorage();

const ttsPlayer = createTTSPlayer();

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});
const ExportMessageModal = dynamic(
  async () => (await import("./exporter")).ExportMessageModal,
  {
    loading: () => null,
  },
);

export function ChatMain() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const availableModels = useEnabledModels();

  const fontSize = config.fontSize;
  const fontFamily = config.fontFamily;
  const [ratio, setRatio] = useState<number>(1); // 預設正方形
  const [showExport, setShowExport] = useState(false);
  // Debug modal state
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  // Image preview state
  const [imagePreview, setImagePreview] = useState<{
    show: boolean;
    src: string;
  }>({ show: false, src: "" });
  const showImageModal = (src: string) => {
    setImagePreview({ show: true, src });
  };
  const [debugMessage, setDebugMessage] = useState<ChatMessage | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  // 防抖的预览输入：避免每次输入都触发预览气泡重渲染和 emoji 请求
  const [debouncedPreviewInput, setDebouncedPreviewInput] = useState("");
  const updateDebouncedPreviewInput = useDebouncedCallback(
    (value: string) => {
      setDebouncedPreviewInput(value);
    },
    300, // 300ms 防抖
  );
  // 当 userInput 变化时，更新防抖的预览输入
  useEffect(() => {
    updateDebouncedPreviewInput(userInput);
  }, [userInput, updateDebouncedPreviewInput]);

  const [isLoading, setIsLoading] = useState(false);
  const [couldStop, setCouldStop] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const restoringScrollRef = useRef(false);

  // 智能轮询：只在有活动请求时检查，优化性能
  useEffect(() => {
    // 立即检查一次
    const hasPending = ChatControllerPool.hasPendingInSession(session.id);
    setCouldStop(hasPending);

    // 只在有待处理请求时启动轮询
    let checkPendingInterval: NodeJS.Timeout | null = null;

    if (hasPending) {
      checkPendingInterval = setInterval(() => {
        const pending = ChatControllerPool.hasPendingInSession(session.id);
        setCouldStop(pending);

        // 没有待处理请求时停止轮询，节省资源
        if (!pending && checkPendingInterval) {
          clearInterval(checkPendingInterval);
          checkPendingInterval = null;
        }
      }, 100);
    }

    return () => {
      if (checkPendingInterval) {
        clearInterval(checkPendingInterval);
      }
    };
  }, [session.id, isLoading]); // 依赖 isLoading，请求开始时重新检查
  const scrollRef = useRef<HTMLDivElement>(null);
  /** 发送用户消息后需在下一帧滚动到底部（此时新消息已渲染） */
  const scrollAfterUserSendRef = useRef(false);
  const isScrolledToBottom = scrollRef?.current
    ? Math.abs(
        scrollRef.current.scrollHeight -
          (scrollRef.current.scrollTop + scrollRef.current.clientHeight),
      ) <= 1
    : false;
  const isAttachWithTop = useMemo(() => {
    const lastMessage = scrollRef.current?.lastElementChild as HTMLElement;
    if (!scrollRef?.current || !lastMessage) return false;
    const topDistance =
      lastMessage!.getBoundingClientRect().top -
      scrollRef.current.getBoundingClientRect().top;
    return topDistance < 100;
  }, []);

  const isTyping = userInput !== "";
  const savedScrollState =
    sessionScrollStateMap.get(session.id) ??
    getPersistedSessionScrollState(session.id);
  const defaultFollowOnLoad =
    savedScrollState?.hitBottom ?? session.messages.length <= 1;
  const lastSessionMessage = session.messages[session.messages.length - 1];
  const lastSessionMessageText = lastSessionMessage
    ? getMessageTextContent(lastSessionMessage)
    : "";
  const isStreamingFollow =
    !!lastSessionMessage?.streaming &&
    lastSessionMessage.role === "assistant" &&
    !isTyping;
  const scrollTrigger = `${session.messages.length}-${
    lastSessionMessage?.id ?? ""
  }-${lastSessionMessageText.length}-${lastSessionMessage?.streaming ? 1 : 0}`;

  const {
    autoScroll,
    setAutoScroll,
    lockAutoScroll,
    unlockAutoScroll,
    isAutoScrollLocked,
    cancelPendingAutoScroll,
    scrollDomToBottom,
  } = useScrollToBottom(
    scrollRef,
    !(isScrolledToBottom || isAttachWithTop) && !isTyping,
    session.messages,
    defaultFollowOnLoad,
    scrollTrigger,
    isStreamingFollow,
  );
  const [hitBottom, setHitBottom] = useState(defaultFollowOnLoad);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const { isCollapsed, toggleSideBarCollapse } = useDragSideBar();
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPrompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateTargetSession(session, (session) => {
        session.clearContextIndex = session.messages.length;
        session.memoryPrompt = "";
        session.responseApiConversationId = undefined;
        session.lastAutoTopicIndex = session.messages.length;
        if (session.multiModelMode) {
          session.multiModelMode.modelResponseApiConversationIds = {};
        }
      }),
    fork: () => chatStore.forkSession(),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    if (text.length > 0 && !hitBottom) {
      setAutoScroll(true);
      jumpToBottom();
    }
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.match(ChatCommandPrefix)) {
      setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  const doSubmit = (userInput: string) => {
    if (userInput.trim() === "" && isEmpty(attachImages)) return;

    // 无可用模型时，引导用户去设置页面配置
    if (availableModels.length === 0) {
      showToast(
        Locale.Chat.NoModelConfigured,
        {
          text: Locale.Chat.GoToSettings,
          onClick: () => navigate(Path.Settings),
        },
        5000,
      );
      return;
    }

    setAutoScroll(true);
    scrollToBottom();
    scrollAfterUserSendRef.current = true; // 发送后等消息入列表再滚到底部
    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      setDebouncedPreviewInput(""); // 立即清除防抖预览
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);
    setCouldStop(true); // 开始请求时立即显示停止按钮
    chatStore
      .onUserInput(userInput, attachImages)
      .then(() => {
        setIsLoading(false);
        setCouldStop(ChatControllerPool.hasPendingInSession(session.id)); // 请求完成后更新状态
      })
      .catch(() => {
        setIsLoading(false);
        setCouldStop(ChatControllerPool.hasPendingInSession(session.id)); // 请求失败后也更新状态
      });
    setAttachImages([]);
    chatStore.setLastInput(userInput);
    setUserInput("");
    setDebouncedPreviewInput(""); // 立即清除防抖预览，避免预览气泡延迟消失
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };

  const onPromptSelect = (prompt: RenderPrompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
    // 立即更新停止按钮状态
    setCouldStop(ChatControllerPool.hasPendingInSession(session.id));
  };

  // optimize prompt
  const optimizePrompt = async () => {
    if (!userInput.trim()) {
      showToast(Locale.Chat.InputActions.OptimizeError);
      return;
    }

    const originalInput = userInput;
    showToast(Locale.Chat.InputActions.OptimizeToast);

    try {
      const globalConfig = config.modelConfig;
      const optimizeModelConfig = getSessionOptimizeModelConfig(session.mask);

      const api = getClientApi(
        optimizeModelConfig.providerName || ServiceProvider.OpenAI.id,
      );

      let optimizedText = "";

      // 获取优化模型的提示词，优先级：会话配置 > 全局配置 > 默认提示词
      const defaultOptimizePrompt =
        Locale.Settings.OptimizeModel.Prompt.Placeholder;

      let optimizePrompt = defaultOptimizePrompt;
      if (session.mask.modelConfig.optimizeModelPrompt) {
        optimizePrompt = session.mask.modelConfig.optimizeModelPrompt;
      } else if (globalConfig.optimizeModelPrompt) {
        optimizePrompt = globalConfig.optimizeModelPrompt;
      }

      const optimizeMessages: RequestMessage[] = [
        {
          role: "system",
          content: optimizePrompt,
        },
        {
          role: "user",
          content: originalInput,
        },
      ];

      await api.llm.chat({
        messages: optimizeMessages,
        config: {
          model: optimizeModelConfig.model,
          temperature: 0.3,
          max_tokens: 1024,
          stream: true,
          providerName: optimizeModelConfig.providerName,
        },
        onUpdate: (message: string) => {
          // 去除思考内容，只保留优化后的提示词
          const cleanedMessage = removeThinkingContent(message);
          optimizedText = cleanedMessage;
          setUserInput(cleanedMessage);
        },
        onFinish: (message: string) => {
          // 去除思考内容，只保留优化后的提示词
          const cleanedMessage = removeThinkingContent(message);
          optimizedText = cleanedMessage;
          setUserInput(cleanedMessage);
          showToast(Locale.Chat.InputActions.OptimizeSuccess);
          inputRef.current?.focus();
        },
        onError: (err: Error) => {
          logger.error("Optimize prompt error:", err);
          setUserInput(originalInput);
          showToast(Locale.Chat.InputActions.OptimizeError);
        },
      });
    } catch (err) {
      logger.error("Optimize prompt error:", err);
      setUserInput(originalInput);
      showToast(Locale.Chat.InputActions.OptimizeError);
    }
  };

  useEffect(() => {
    chatStore.updateTargetSession(session, (session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        session.mask.modelConfig = { ...config.modelConfig };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(chatStore.lastInput ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (
      selectOrCopy(
        e.currentTarget,
        getMessageTextContentWithoutThinking(message),
      )
    ) {
      if (userInput.length === 0) {
        setUserInput(getMessageTextContentWithoutThinking(message));
      }

      e.preventDefault();
    }
  };

  const deleteMessage = (msgId?: string) => {
    chatStore.updateTargetSession(
      session,
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const onResend = (message: ChatMessage) => {
    // 重构后的重试逻辑：使用专门的重试方法
    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );

    if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
      return;
    }

    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;

    if (message.role === "assistant") {
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      userMessage = message;
      if (
        resendingIndex + 1 < session.messages.length &&
        session.messages[resendingIndex + 1].role === "assistant"
      ) {
        botMessage = session.messages[resendingIndex + 1];
      }
    }

    if (userMessage === undefined) {
      return;
    }

    // 如果是重试 bot 消息，使用专门的重试方法
    if (botMessage) {
      setIsLoading(true);
      setCouldStop(true); // 开始重试时立即显示停止按钮
      chatStore
        .retryBotMessage(botMessage.id, userMessage)
        .then(() => {
          setIsLoading(false);
          setCouldStop(ChatControllerPool.hasPendingInSession(session.id)); // 重试完成后更新状态
        })
        .catch((error) => {
          setIsLoading(false);
          setCouldStop(ChatControllerPool.hasPendingInSession(session.id)); // 重试失败后也更新状态
        });
      inputRef.current?.focus();
      return;
    }

    // 如果是重试用户消息，使用原有逻辑（删除后续消息并重新发送）
    deleteMessage(userMessage.id);
    setIsLoading(true);
    setCouldStop(true); // 开始重试时立即显示停止按钮
    const textContent = getMessageTextContent(userMessage);
    const images = getMessageImages(userMessage);
    chatStore
      .onUserInput(textContent, images)
      .then(() => {
        setIsLoading(false);
        setCouldStop(ChatControllerPool.hasPendingInSession(session.id)); // 重试完成后更新状态
      })
      .catch(() => {
        setIsLoading(false);
        setCouldStop(ChatControllerPool.hasPendingInSession(session.id)); // 重试失败后也更新状态
      });
    inputRef.current?.focus();
  };

  // 切换到上一个版本
  const onPreviousVersion = (message: ChatMessage) => {
    chatStore.updateTargetSession(session, (session) => {
      const messageIndex = session.messages.findIndex(
        (m) => m.id === message.id,
      );
      if (messageIndex >= 0) {
        const currentMessage = session.messages[messageIndex];
        if (currentMessage.versions && currentMessage.versions.length >= 1) {
          const currentIndex = currentMessage.currentVersionIndex ?? 0;
          if (currentIndex > 0) {
            currentMessage.currentVersionIndex = currentIndex - 1;
          }
        }
      }
    });
  };

  // 切换到下一个版本
  const onNextVersion = (message: ChatMessage) => {
    chatStore.updateTargetSession(session, (session) => {
      const messageIndex = session.messages.findIndex(
        (m) => m.id === message.id,
      );
      if (messageIndex >= 0) {
        const currentMessage = session.messages[messageIndex];
        if (currentMessage.versions && currentMessage.versions.length >= 1) {
          const currentIndex = currentMessage.currentVersionIndex ?? 0;
          const maxIndex = currentMessage.versions.length;
          if (currentIndex < maxIndex) {
            currentMessage.currentVersionIndex = currentIndex + 1;
          }
        }
      }
    });
  };

  // 获取当前显示的消息内容
  const getCurrentMessageContent = (message: ChatMessage): string => {
    if (!message.versions || message.versions.length < 1) {
      return getMessageTextContent(message);
    }

    const currentIndex = message.currentVersionIndex ?? 0;
    if (currentIndex === message.versions.length) {
      // 显示最新版本（当前消息内容）
      return getMessageTextContent(message);
    } else if (currentIndex >= 0 && currentIndex < message.versions.length) {
      // 显示历史版本
      return message.versions[currentIndex];
    }

    return getMessageTextContent(message);
  };

  const onPinMessage = (message: ChatMessage) => {
    chatStore.updateTargetSession(session, (session) =>
      session.mask.context.push(message),
    );

    showToast(Locale.Chat.Actions.PinToastContent, {
      text: Locale.Chat.Actions.PinToastAction,
      onClick: () => {
        setShowPromptModal(true);
      },
    });
  };

  const accessStore = useAccessStore();
  const [speechStatus, setSpeechStatus] = useState(false);
  const [speechLoading, setSpeechLoading] = useState(false);

  // 创建专门用于 TTS 的 API 客户端，始终使用 OpenAI TTS 配置
  function createTTSApi(): ClientApi {
    // 始终使用 OpenAI 作为 TTS 提供商，不受当前对话模型影响
    return getClientApi(ServiceProvider.OpenAI.id);
  }

  async function openaiSpeech(text: string) {
    if (speechStatus) {
      ttsPlayer.stop();
      setSpeechStatus(false);
    } else {
      const config = useAppConfig.getState();
      setSpeechLoading(true);
      ttsPlayer.init();
      let audioBuffer: ArrayBuffer;
      const textContent = markdownToTxt(text);

      if (config.ttsConfig.engine !== DEFAULT_TTS_ENGINE) {
        const edgeVoiceName = accessStore.edgeVoiceName();
        const tts = new MsEdgeTTS();
        await tts.setMetadata(
          edgeVoiceName,
          OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
        );
        audioBuffer = await tts.toArrayBuffer(textContent);
      } else {
        // 创建专门用于 TTS 的 API 客户端，确保使用 OpenAI TTS 配置
        const ttsApi = createTTSApi();

        audioBuffer = await ttsApi.llm.speech({
          model: config.ttsConfig.model,
          input: textContent,
          voice: config.ttsConfig.voice,
          speed: config.ttsConfig.speed,
        });
      }

      setSpeechStatus(true);
      ttsPlayer
        .play(audioBuffer, () => {
          setSpeechStatus(false);
        })
        .catch((e) => {
          logger.error("[OpenAI Speech]", e);
          showToast(prettyObject(e));
          setSpeechStatus(false);
        })
        .finally(() => setSpeechLoading(false));
    }
  }

  const context: RenderMessage[] = useMemo(() => {
    return session.mask.hideContext ? [] : session.mask.context.slice();
  }, [session.mask.context, session.mask.hideContext]);

  // 只在未授权时显示提示，已授权则不显示无用的欢迎语
  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== BOT_HELLO.content &&
    !accessStore.isAuthorized()
  ) {
    const copiedHello = Object.assign({}, BOT_HELLO);
    copiedHello.content = Locale.Error.Unauthorized;
    context.push(copiedHello);
  }

  // preview messages
  // 使用防抖的预览输入，避免每次按键都触发重渲染和 emoji CDN 请求
  const renderMessages = useMemo(() => {
    // 过滤掉 MCP 相关的消息
    const filteredMessages = filterMcpMessages(session.messages);

    return context.concat(filteredMessages as RenderMessage[]).concat(
      debouncedPreviewInput.length > 0 && config.sendPreviewBubble
        ? [
            {
              ...createMessage({
                role: "user",
                content: debouncedPreviewInput,
              }),
              preview: true,
            },
          ]
        : [],
    );
  }, [
    config.sendPreviewBubble,
    context,
    session.messages,
    debouncedPreviewInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    sessionScrollStateMap.get(session.id)?.msgRenderIndex ??
      Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );

  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    msgRenderIndexRef.current = newIndex;
    _setMsgRenderIndex(newIndex);
  }

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);

  const isMultiModel =
    session.multiModelMode?.enabled &&
    session.multiModelMode.selectedModels.length > 1;

  // 多模型消息分组逻辑
  const groupedMessages = useMemo(() => {
    if (!isMultiModel) {
      // 单模型模式：返回原始消息列表
      return messages.map((msg, idx) => ({
        type: "single" as const,
        messages: [msg],
        index: idx,
      }));
    }

    // 多模型模式：将连续的多模型assistant消息分组
    const groups: Array<{
      type: "single" | "multi-assistant";
      messages: typeof messages;
      index: number;
    }> = [];

    let i = 0;
    while (i < messages.length) {
      const message = messages[i];

      // 检查是否是用户消息，且后面跟着多个多模型assistant消息
      if (message.role === "user") {
        // 查找该用户消息后的所有连续的多模型assistant消息
        const assistantMessages: typeof messages = [];
        let j = i + 1;
        while (
          j < messages.length &&
          messages[j].role === "assistant" &&
          messages[j].isMultiModel
        ) {
          assistantMessages.push(messages[j]);
          j++;
        }

        // 先添加用户消息
        groups.push({
          type: "single",
          messages: [message],
          index: i,
        });

        // 如果有多个assistant消息，横向分组
        if (assistantMessages.length > 1) {
          groups.push({
            type: "multi-assistant",
            messages: assistantMessages,
            index: i + 1,
          });
          i = j;
        } else if (assistantMessages.length === 1) {
          // 只有一个assistant消息，正常显示
          groups.push({
            type: "single",
            messages: assistantMessages,
            index: i + 1,
          });
          i = j;
        } else {
          i++;
        }
      } else {
        // 非用户消息，正常显示
        groups.push({
          type: "single",
          messages: [message],
          index: i,
        });
        i++;
      }
    }

    return groups;
  }, [isMultiModel, messages]);

  const scrollPagingStateRef = useRef({ lastTop: 0, lastSwitchAt: 0 });
  const msgRenderIndexRef = useRef(msgRenderIndex);

  useEffect(() => {
    msgRenderIndexRef.current = msgRenderIndex;
  }, [msgRenderIndex]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const saved =
      sessionScrollStateMap.get(session.id) ??
      getPersistedSessionScrollState(session.id);
    if (!saved) {
      return;
    }

    restoringScrollRef.current = true;
    setAutoScroll(saved.hitBottom);
    setHitBottom(saved.hitBottom);
    const maxStart = Math.max(0, renderMessages.length - CHAT_PAGE_SIZE);
    _setMsgRenderIndex(Math.max(0, Math.min(saved.msgRenderIndex, maxStart)));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const dom = scrollRef.current;
        if (dom) {
          const maxTop = Math.max(0, dom.scrollHeight - dom.clientHeight);
          const targetTop = saved.hitBottom
            ? maxTop
            : Math.max(0, maxTop - (saved.bottomOffset ?? 0));
          dom.scrollTo(0, Math.min(targetTop, maxTop));
          scrollPagingStateRef.current.lastTop = dom.scrollTop;
        }
        restoringScrollRef.current = false;
      });
    });
  }, [session.id, setAutoScroll, renderMessages.length]);

  const onChatBodyScroll = (e: HTMLElement) => {
    if (restoringScrollRef.current) {
      return;
    }

    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = isMobileScreen ? 24 : 36;
    const hasScrollableSpace = e.scrollHeight > e.clientHeight + 1;
    const now = Date.now();
    const scrollDelta = e.scrollTop - scrollPagingStateRef.current.lastTop;
    scrollPagingStateRef.current.lastTop = e.scrollTop;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const bottomOffset = Math.max(
      0,
      e.scrollHeight - e.clientHeight - e.scrollTop,
    );
    const hitBottomThreshold = isMobileScreen ? 6 : 12;
    const followResumeThreshold = isMobileScreen ? 14 : 20;
    const isHitBottom = bottomOffset <= hitBottomThreshold;
    const isAtLatestLine = bottomOffset <= followResumeThreshold;

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    // 在“无滚动条”或同时触顶触底（临界高度）时不做分页切换，避免抖动循环
    if (
      hasScrollableSpace &&
      now - scrollPagingStateRef.current.lastSwitchAt > 120
    ) {
      if (
        isTouchTopEdge &&
        !isTouchBottomEdge &&
        scrollDelta < -1 &&
        msgRenderIndex > 0
      ) {
        scrollPagingStateRef.current.lastSwitchAt = now;
        setMsgRenderIndex(prevPageMsgIndex);
      } else if (
        isTouchBottomEdge &&
        !isTouchTopEdge &&
        scrollDelta > 1 &&
        msgRenderIndex < renderMessages.length - CHAT_PAGE_SIZE
      ) {
        scrollPagingStateRef.current.lastSwitchAt = now;
        setMsgRenderIndex(nextPageMsgIndex);
      }
    }

    setHitBottom(isHitBottom);
    if (!hasScrollableSpace) {
      unlockAutoScroll();
      setAutoScroll(true);
    } else if (isAutoScrollLocked()) {
      // Keep lock until user actively scrolls downward back to latest line.
      if (scrollDelta > 0 && isAtLatestLine) {
        unlockAutoScroll();
        setAutoScroll(true);
      } else {
        setAutoScroll(false);
      }
    } else {
      setAutoScroll(isAtLatestLine);
    }
    const maxStart = Math.max(0, renderMessages.length - CHAT_PAGE_SIZE);
    const isTrulyBottom = isHitBottom && msgRenderIndexRef.current >= maxStart;
    const nextState = {
      scrollTop: e.scrollTop,
      bottomOffset,
      msgRenderIndex: msgRenderIndexRef.current,
      hitBottom: isTrulyBottom,
    };
    sessionScrollStateMap.set(session.id, nextState);
    persistSessionScrollState(session.id, nextState);
  };

  const onChatBodyWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dom = e.currentTarget;
    const hasScrollableSpace = dom.scrollHeight > dom.clientHeight + 1;
    const shouldInterceptUpScroll = isStreamingFollow && autoScroll;
    // Only lock when content is actually scrollable and user scrolls upward.
    if (hasScrollableSpace && shouldInterceptUpScroll && e.deltaY < 0) {
      lockAutoScroll();
      cancelPendingAutoScroll();
      setAutoScroll(false);
      setHitBottom(false);
      // Apply immediate upward movement in the same frame to avoid being snapped back.
      const step = Math.max(24, Math.min(240, Math.abs(e.deltaY)));
      dom.scrollTop = Math.max(0, dom.scrollTop - step);
      e.preventDefault();
    }
  };

  /** 直接定位到最底部（不带动画） */
  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    cancelPendingAutoScroll();
    const dom = scrollRef.current;
    if (dom) {
      const maxTop = Math.max(0, dom.scrollHeight - dom.clientHeight);
      dom.scrollTop = maxTop;
    }
  }

  function jumpToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    cancelPendingAutoScroll();
    const dom = scrollRef.current;
    if (dom) {
      const maxTop = Math.max(0, dom.scrollHeight - dom.clientHeight);
      dom.scrollTop = maxTop;
    }
  }

  // 发送消息后，等用户消息（及可能的 bot 占位）写入列表并渲染，直接定位到底部
  const prevMessagesLengthRef = useRef(session.messages.length);
  useEffect(() => {
    prevMessagesLengthRef.current = session.messages.length;
    scrollAfterUserSendRef.current = false;
  }, [session.id]);
  useEffect(() => {
    if (!scrollAfterUserSendRef.current) return;
    if (session.messages.length <= prevMessagesLengthRef.current) return;
    scrollAfterUserSendRef.current = false;
    prevMessagesLengthRef.current = session.messages.length;
    requestAnimationFrame(() => {
      setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
      cancelPendingAutoScroll();
      const dom = scrollRef.current;
      if (dom) {
        const maxTop = Math.max(0, dom.scrollHeight - dom.clientHeight);
        dom.scrollTop = maxTop;
      }
    });
  }, [session.messages.length, renderMessages.length]);

  // 有预览内容时（输入/粘贴大段文字），将预览气泡定位到底部可见
  useEffect(() => {
    if (!config.sendPreviewBubble || debouncedPreviewInput.length === 0) return;
    requestAnimationFrame(() => {
      jumpToBottom();
    });
  }, [config.sendPreviewBubble, debouncedPreviewInput]);

  const handleInputFocusOrClick = () => {
    if (hitBottom) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (!isStreamingFollow || isAutoScrollLocked()) return;
    if (!autoScroll) {
      setAutoScroll(true);
      return;
    }
    scrollToBottom();
  }, [
    isStreamingFollow,
    autoScroll,
    setAutoScroll,
    isAutoScrollLocked,
    scrollTrigger,
    renderMessages.length,
    scrollToBottom,
    isMultiModel,
  ]);

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;
  const compressedContextIndex =
    (session.compressedContextIndex ?? -1) >= 0
      ? session.compressedContextIndex! + context.length - msgRenderIndex
      : -1;
  const compressingContextIndex =
    (session.compressingContextIndex ?? -1) >= 0
      ? session.compressingContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  const showMaxIcon = !isMobileScreen && !getClientConfig()?.isApp;

  useCommand({
    fill: setUserInput,
    submit: (text) => {
      doSubmit(text);
    },
    code: (text) => {
      if (accessStore.disableFastLink) return;
      logger.debug("[Command] got code from url: ", text);
      showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.update((access) => (access.accessCode = text));
        }
      });
    },
    settings: (text) => {
      if (accessStore.disableFastLink) return;

      try {
        const payload = JSON.parse(text) as {
          key?: string;
          url?: string;
        };

        logger.debug("[Command] got settings from url: ", payload);

        if (payload.key || payload.url) {
          showConfirm(
            Locale.URLCommand.Settings +
              `\n${JSON.stringify(payload, null, 4)}`,
          ).then((res) => {
            if (!res) return;
            if (payload.key) {
              accessStore.update(
                (access) => ((access as any).openaiApiKey = payload.key!),
              );
            }
            if (payload.url) {
              accessStore.update(
                (access) => ((access as any).openaiUrl = payload.url!),
              );
            }
            accessStore.update((access) => (access.useCustomConfig = true));
          });
        }
      } catch {
        logger.error("[Command] failed to get settings from url: ", text);
      }
    },
  });

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  // remember unfinished input
  useEffect(() => {
    // try to load from local storage
    const key = UNFINISHED_INPUT(session.id);
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      localStorage.removeItem(key);
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(key, dom?.value ?? "");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const currentModel = chatStore.currentSession().mask.modelConfig.model;
      if (!isVisionModel(currentModel)) {
        return;
      }
      const items = (event.clipboardData || window.clipboardData).items;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const images: string[] = [];
            images.push(...attachImages);
            images.push(
              ...(await new Promise<string[]>((res, rej) => {
                setUploading(true);
                const imagesData: string[] = [];
                uploadImageAsBase64(file)
                  .then((dataUrl) => {
                    imagesData.push(dataUrl);
                    setUploading(false);
                    res(imagesData);
                  })
                  .catch((e) => {
                    setUploading(false);
                    rej(e);
                  });
              })),
            );
            const imagesLength = images.length;

            if (imagesLength > 3) {
              images.splice(3, imagesLength - 3);
            }
            setAttachImages(images);
          }
        }
      }
    },
    [attachImages, chatStore],
  );

  async function uploadImage() {
    const images: string[] = [];
    images.push(...attachImages);

    images.push(
      ...(await new Promise<string[]>((res, rej) => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept =
          "image/png, image/jpeg, image/webp, image/heic, image/heif";
        fileInput.multiple = true;
        fileInput.onchange = (event: any) => {
          setUploading(true);
          const files = event.target.files;
          const imagesData: string[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = event.target.files[i];
            uploadImageAsBase64(file)
              .then((dataUrl) => {
                imagesData.push(dataUrl);
                if (
                  imagesData.length === 3 ||
                  imagesData.length === files.length
                ) {
                  setUploading(false);
                  res(imagesData);
                }
              })
              .catch((e) => {
                setUploading(false);
                rej(e);
              });
          }
        };
        fileInput.click();
      })),
    );

    const imagesLength = images.length;
    if (imagesLength > 3) {
      images.splice(3, imagesLength - 3);
    }
    setAttachImages(images);
  }

  // 快捷键 shortcut keys
  const [showShortcutKeyModal, setShowShortcutKeyModal] = useState(false);
  const [showShortcutKeyPanel, setShowShortcutKeyPanel] = useState(false);

  // 思考深度面板
  const [showThinkingPanel, setShowThinkingPanel] = useState(false);

  // MCP 面板
  const [showMcpPanel, setShowMcpPanel] = useState(false);

  // 多模型面板
  const [showMultiModelPanel, setShowMultiModelPanel] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // 切换多模型模式
  const toggleMultiModelMode = () => {
    chatStore.updateTargetSession(session, (session) => {
      if (!session.multiModelMode) {
        session.multiModelMode = {
          enabled: false,
          selectedModels: [],
          modelMessages: {},
          modelStats: {},
          modelMemoryPrompts: {},
          modelSummarizeIndexes: {},
        };
      }

      const wasEnabled = session.multiModelMode.enabled;

      // 如果当前是启用状态，点击则关闭
      if (wasEnabled) {
        session.multiModelMode.enabled = false;
        session.multiModelMode.selectedModels = [];
        session.multiModelMode.modelMessages = {};
        session.multiModelMode.modelStats = {};
        session.multiModelMode.modelMemoryPrompts = {};
        session.multiModelMode.modelSummarizeIndexes = {};

        showToast(Locale.Chat.MultiModel.DisableToast);
      }
      // 如果当前是关闭状态，不在这里启用，而是打开模型选择器
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 打开新聊天 command + shift + o
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        setTimeout(() => {
          chatStore.newSession();
          navigate(Path.Chat);
        }, 10);
      }
      // 聚焦聊天输入 shift + esc
      else if (event.shiftKey && event.key.toLowerCase() === "escape") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      // 复制最后一个代码块 command + shift + ;
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === "Semicolon"
      ) {
        event.preventDefault();
        const copyCodeButton =
          document.querySelectorAll<HTMLElement>(".copy-code-button");
        if (copyCodeButton.length > 0) {
          copyCodeButton[copyCodeButton.length - 1].click();
        }
      }
      // 复制最后一个回复 command + shift + c
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        const lastNonUserMessage = messages
          .filter((message) => message.role !== "user")
          .pop();
        if (lastNonUserMessage) {
          const lastMessageContent =
            getMessageTextContentWithoutThinking(lastNonUserMessage);
          copyToClipboard(lastMessageContent);
        }
      }
      // 展示快捷键 command + /
      else if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        setShowShortcutKeyPanel(!showShortcutKeyPanel);
      }
      // 清除上下文 command + shift + backspace
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "backspace"
      ) {
        event.preventDefault();
        chatStore.updateTargetSession(session, (session) => {
          if (session.clearContextIndex === session.messages.length) {
            session.clearContextIndex = undefined;
          } else {
            session.clearContextIndex = session.messages.length;
            session.compressedContextIndex = undefined;
            session.memoryPrompt = ""; // will clear memory
            session.messages = session.messages.filter(
              (m) => !m.isCompressedContextPrompt,
            );
            session.responseApiConversationId = undefined;
            session.lastAutoTopicIndex = session.messages.length;
            if (session.multiModelMode) {
              session.multiModelMode.modelResponseApiConversationIds = {};
            }
          }
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [messages, chatStore, navigate, session, showShortcutKeyPanel]);

  const [showChatSidePanel, setShowChatSidePanel] = useState(false);

  type ChatMessageWithPreview = ChatMessage & { preview?: boolean };

  const onEditMessage = async (message: ChatMessageWithPreview) => {
    const newMessage = await showPrompt(
      Locale.Chat.Actions.Edit,
      getMessageTextContent(message),
      10,
    );
    let newContent: string | MultimodalContent[] = newMessage;
    const images = getMessageImages(message);
    if (images.length > 0) {
      newContent = [{ type: "text", text: newMessage }];
      for (let i = 0; i < images.length; i++) {
        newContent.push({
          type: "image_url",
          image_url: {
            url: images[i],
          },
        });
      }
    }
    chatStore.updateTargetSession(session, (session) => {
      const m = session.mask.context
        .concat(session.messages)
        .find((m) => m.id === message.id);
      if (m) {
        m.content = newContent;
      }
    });
  };

  const renderSingleMessage = (
    message: ChatMessageWithPreview,
    i: number,
    dividerFlags?: {
      showCompressedDividerAfter: boolean;
      showCompressingDividerAfter: boolean;
    },
  ) => {
    const isContext = i < context.length;
    const showActions =
      i > 0 && !(message.preview || message.content.length === 0) && !isContext;
    const showTyping = !!(message.preview || message.streaming);

    const shouldShowClearContextDivider = i === clearContextIndex - 1;
    // 每条压缩结果前都显示横幅：下一条是压缩结果则在本条后显示，保留历次压缩的横幅
    const shouldShowCompressedContextDivider = !!(dividerFlags
      ? dividerFlags.showCompressedDividerAfter
      : i === compressedContextIndex - 1);
    const shouldShowCompressingContextDivider = !!(dividerFlags
      ? dividerFlags.showCompressingDividerAfter
      : i === compressingContextIndex - 1 && session.isSummarizing);

    return (
      <SingleMessage
        message={message}
        index={i}
        isContext={isContext}
        showActions={showActions}
        showTyping={showTyping}
        shouldShowClearContextDivider={shouldShowClearContextDivider}
        shouldShowCompressedContextDivider={shouldShowCompressedContextDivider}
        shouldShowCompressingContextDivider={
          shouldShowCompressingContextDivider
        }
        session={session}
        accessStore={accessStore}
        config={config}
        fontSize={fontSize}
        fontFamily={fontFamily}
        scrollRef={scrollRef}
        totalMessages={messages.length}
        speechStatus={speechStatus}
        onEditMessage={onEditMessage}
        onUserStop={onUserStop}
        onResend={onResend}
        onPreviousVersion={onPreviousVersion}
        onNextVersion={onNextVersion}
        onDelete={onDelete}
        onPinMessage={onPinMessage}
        onDebugMessage={(msg) => {
          setDebugMessage(msg);
          setDebugModalOpen(true);
        }}
        onSpeech={openaiSpeech}
        onShowImageModal={showImageModal}
      />
    );
  };

  return (
    <>
      <div className={styles.chat} key={session.id}>
        <ChatHeader
          session={session}
          messageCount={filterMcpMessages(session.messages).length}
          hitBottom={hitBottom}
          showPromptModal={showPromptModal}
          setShowPromptModal={setShowPromptModal}
          isMobileScreen={isMobileScreen}
          showMaxIcon={showMaxIcon}
          tightBorder={config.tightBorder}
          onBack={() => navigate(Path.Home)}
          onToggleSidebar={toggleSideBarCollapse}
          onEditTitle={() => setIsEditingMessage(true)}
          onExport={() => setShowExport(true)}
          onRefreshTitle={() => {
            showToast(Locale.Chat.Actions.RefreshToast);
            chatStore.summarizeSession(true, session);
          }}
          onCompressContext={() => {
            chatStore.summarizeSession(false, session, true);
          }}
          onFullScreenToggle={() =>
            config.update((c) => (c.tightBorder = !c.tightBorder))
          }
        />
        <div className={styles["chat-main"]}>
          <div className={styles["chat-body-container"]}>
            <div
              className={styles["chat-body"]}
              ref={scrollRef}
              onScroll={(e) => onChatBodyScroll(e.currentTarget)}
              onWheelCapture={onChatBodyWheel}
              onMouseDown={() => inputRef.current?.blur()}
              onTouchStart={() => {
                inputRef.current?.blur();
                const dom = scrollRef.current;
                if (
                  dom &&
                  dom.scrollHeight > dom.clientHeight + 1 &&
                  isStreamingFollow &&
                  autoScroll
                ) {
                  lockAutoScroll();
                  setAutoScroll(false);
                }
              }}
            >
              {isMultiModel ? (
                <MultiModelMessages
                  groupedMessages={groupedMessages}
                  session={session}
                  accessStore={accessStore}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  scrollRef={scrollRef}
                  onUserStop={onUserStop}
                  onResend={onResend}
                  renderSingleMessage={renderSingleMessage}
                  renderMessages={renderMessages}
                />
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const i = msgRenderIndex + idx;
                    const nextMsg = renderMessages[i + 1];
                    // 方式1：下一条消息本身是压缩消息（一般情况）
                    const nextIsCompressed =
                      !!nextMsg?.isCompressedContextPrompt;
                    // 方式2：当压缩消息恰好是最后一条（nextMsg 不存在）时，
                    // 通过 compressedContextIndex / compressingContextIndex 来判断
                    const compressedInRender =
                      (session.compressedContextIndex ?? -1) >= 0
                        ? context.length + session.compressedContextIndex!
                        : -1;
                    const compressingInRender =
                      (session.compressingContextIndex ?? -1) >= 0
                        ? context.length + session.compressingContextIndex!
                        : -1;
                    const showCompressedDividerAfter =
                      (nextIsCompressed && !nextMsg?.streaming) ||
                      (!nextMsg &&
                        i + 1 === compressedInRender &&
                        !session.isSummarizing);
                    const showCompressingDividerAfter =
                      (nextIsCompressed &&
                        !!nextMsg?.streaming &&
                        !!session.isSummarizing) ||
                      (!nextMsg &&
                        i + 1 === compressingInRender &&
                        !!session.isSummarizing);
                    return renderSingleMessage(msg as RenderMessage, i, {
                      showCompressedDividerAfter,
                      showCompressingDividerAfter,
                    });
                  })}
                </>
              )}
            </div>
            <ChatInputPanel
              promptHints={promptHints}
              setPromptHints={setPromptHints}
              onPromptSelect={onPromptSelect}
              showMcpPanel={showMcpPanel}
              setShowMcpPanel={setShowMcpPanel}
              showShortcutKeyPanel={showShortcutKeyPanel}
              setShowShortcutKeyPanel={setShowShortcutKeyPanel}
              showThinkingPanel={showThinkingPanel}
              setShowThinkingPanel={setShowThinkingPanel}
              showMultiModelPanel={showMultiModelPanel}
              setShowMultiModelPanel={setShowMultiModelPanel}
              showModelSelector={showModelSelector}
              setShowModelSelector={setShowModelSelector}
              uploadImage={uploadImage}
              setAttachImages={setAttachImages}
              setUploading={setUploading}
              scrollToBottom={scrollToBottom}
              hitBottom={hitBottom}
              uploading={uploading}
              setUserInput={setUserInput}
              setShowShortcutKeyModal={setShowShortcutKeyModal}
              setShowChatSidePanel={setShowChatSidePanel}
              userInput={userInput}
              couldStop={couldStop}
              setCouldStop={setCouldStop}
              optimizePrompt={optimizePrompt}
              toggleMultiModelMode={toggleMultiModelMode}
              inputRef={inputRef}
              submitKey={submitKey}
              inputRows={inputRows}
              autoFocus={autoFocus}
              fontSize={config.fontSize}
              fontFamily={config.fontFamily}
              attachImages={attachImages}
              onInput={onInput}
              onInputKeyDown={onInputKeyDown}
              onInputFocusOrClick={handleInputFocusOrClick}
              onPaste={handlePaste}
              onSubmit={doSubmit}
              onSearch={onSearch}
            />
          </div>
          <div
            className={clsx(styles["chat-side-panel"], {
              [styles["mobile"]]: isMobileScreen,
              [styles["chat-side-panel-show"]]: showChatSidePanel,
            })}
          >
            {showChatSidePanel && (
              <RealtimeChat
                onClose={() => {
                  setShowChatSidePanel(false);
                }}
                onStartVoice={async () => {
                  logger.debug("start voice");
                }}
              />
            )}
          </div>
        </div>
      </div>
      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}

      {showShortcutKeyModal && (
        <ShortcutKeyModal onClose={() => setShowShortcutKeyModal(false)} />
      )}

      <ChatDebugModal
        show={debugModalOpen}
        message={debugMessage}
        onClose={() => {
          setDebugModalOpen(false);
          setDebugMessage(null);
        }}
      />
      <ImagePreviewModal
        show={imagePreview.show}
        src={imagePreview.src}
        onClose={() => setImagePreview({ show: false, src: "" })}
      />
    </>
  );
}
