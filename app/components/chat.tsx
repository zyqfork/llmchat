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

import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import EditIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import SpeakIcon from "../icons/speak.svg";
import SpeakStopIcon from "../icons/speak-stop.svg";
import LoadingIcon from "../icons/three-dots.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import PromptIcon from "../icons/prompt.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import ReloadIcon from "../icons/reload.svg";
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
import MenuIcon from "../icons/menu.svg";
import ChatSettingsIcon from "../icons/chat-settings.svg";
import {
  BOT_HELLO,
  ChatMessage,
  ChatSession,
  createMessage,
  DEFAULT_TOPIC,
  ModelType,
  SubmitKey,
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
  ModelProvider,
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
import { useVirtualScroll } from "./chat/hooks/useVirtualScroll";
import { useScrollToBottom } from "./chat/hooks/useScrollToBottom";
import { ClearContextDivider } from "./chat/ClearContextDivider";
import { ChatAction } from "./chat/ChatAction";
import { DeleteImageButton } from "./chat/DeleteImageButton";
import { EditMessageModal } from "./chat/EditMessageModal";
import { ShortcutKeyModal } from "./chat/ShortcutKeyModal";
import { TokenCounter } from "./chat/TokenCounter";
import { ThinkingPanel } from "./chat/ThinkingPanel";
import { ShortcutKeyPanel } from "./chat/ShortcutKeyPanel";
import { ImagePreviewModal } from "./chat/ImagePreviewModal";
import { MCPPanel } from "./chat/MCPPanel";
import { MultiModelPanel } from "./chat/MultiModelPanel";
import { SessionConfigModel } from "./chat/SessionConfigModel";
import { PromptToast } from "./chat/PromptToast";
import { PromptHints, type RenderPrompt } from "./chat/PromptHints";
import { ChatActions } from "./chat/ChatActions";

import { isEmpty } from "lodash-es";
import { getModelProvider } from "../utils/model";
import { RealtimeChat } from "@/app/components/realtime-chat";
import clsx from "clsx";
import { getAvailableClientsCount, getAllTools } from "../mcp/actions.client";
import { ModelCapabilityIcons } from "./model-capability-icons";
import { getModelCapabilities } from "../constant";
import { ProviderIcon, ModelProviderIcon } from "./provider-icon";
import { logger } from "../utils/logger";

const localStorage = safeLocalStorage();

const ttsPlayer = createTTSPlayer();
type SessionScrollState = {
  scrollTop: number;
  bottomOffset: number;
  msgRenderIndex: number;
  hitBottom: boolean;
};
const sessionScrollStateMap = new Map<string, SessionScrollState>();

// 通用的厂商查找函数
function getProviderDisplayName(providerId: string, accessStore: any): string {
  if (!providerId) {
    logger.warn(`[Chat] Provider ID is empty`);
    return "Unknown";
  }

  logger.debug(`[Chat] Looking up provider display name for: ${providerId}`);

  // 如果是自定义厂商
  if (providerId.startsWith("custom_")) {
    logger.debug(`[Chat] Searching for custom provider: ${providerId}`);
    logger.debug(
      `[Chat] Available custom providers:`,
      accessStore.customProviders?.map((p: any) => ({
        id: p.id,
        name: p.name,
        enabled: p.enabled,
      })),
    );

    const customProvider = accessStore.customProviders?.find(
      (p: any) => p.id === providerId,
    );
    if (customProvider) {
      logger.debug(
        `[Chat] Found custom provider: ${customProvider.name} for ID: ${providerId}`,
      );
      return customProvider.name;
    } else {
      logger.warn(`[Chat] Custom provider not found for ID: ${providerId}`);
      logger.warn(`[Chat] Available providers:`, accessStore.customProviders);
      return providerId; // 如果找不到，返回原始ID
    }
  }

  // 如果是内置厂商，直接返回ID
  logger.debug(`[Chat] Using built-in provider: ${providerId}`);
  return providerId;
}

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});
const ExportMessageModal = dynamic(
  async () => (await import("./exporter")).ExportMessageModal,
  {
    loading: () => null,
  },
);

// 厂商配置浮窗组件
const ProviderTooltip = ({
  children,
  providerName,
}: {
  children: React.ReactNode;
  providerName: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const accessStore = useAccessStore();
  const navigate = useNavigate();

  // 将ServiceProvider枚举值映射到access store中的key
  const getProviderKey = (provider: string): string => {
    const mapping: Record<string, string> = {
      OpenAI: "openai",
      Azure: "azure",
      Google: "google",
      Anthropic: "anthropic",
      Alibaba: "alibaba",
      Moonshot: "moonshot",
      XAI: "xai",
      DeepSeek: "deepseek",
      SiliconFlow: "siliconflow",
      Ollama: "ollama",
    };
    return mapping[provider] || provider.toLowerCase();
  };

  // 获取厂商配置信息
  const providerKey = getProviderKey(providerName);
  const providerConfig = accessStore.getEffectiveProviderConfig(providerKey);

  // 检测浮窗位置并自适应
  useEffect(() => {
    if (showTooltip && wrapperRef.current) {
      // 使用requestAnimationFrame确保DOM已经更新
      requestAnimationFrame(() => {
        if (tooltipRef.current && wrapperRef.current) {
          const wrapperRect = wrapperRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();

          const margin = 12; // 边距
          const gap = 8; // 与触发元素的间距

          // 计算各个方向的可用空间
          const spaceAbove = wrapperRect.top;
          const spaceBelow = window.innerHeight - wrapperRect.bottom;
          const spaceLeft = wrapperRect.left;
          const spaceRight = window.innerWidth - wrapperRect.right;

          const tooltipHeight = tooltipRect.height;
          const tooltipWidth = tooltipRect.width;

          let top = 0;
          let left = 0;

          // 确定垂直位置
          if (
            spaceAbove >= tooltipHeight + gap + margin &&
            spaceBelow < tooltipHeight + gap
          ) {
            // 显示在上方
            top = wrapperRect.top - tooltipHeight - gap;
          } else if (spaceBelow >= tooltipHeight + gap + margin) {
            // 显示在下方
            top = wrapperRect.bottom + gap;
          } else if (spaceAbove > spaceBelow) {
            // 上方空间更大，但不够完整显示，尽量显示在上方
            top = Math.max(margin, wrapperRect.top - tooltipHeight - gap);
          } else {
            // 下方空间更大，显示在下方
            top = wrapperRect.bottom + gap;
          }

          // 确定水平位置（优先居中）
          const centerLeft =
            wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;

          if (
            centerLeft >= margin &&
            centerLeft + tooltipWidth <= window.innerWidth - margin
          ) {
            // 居中显示
            left = centerLeft;
          } else if (centerLeft < margin) {
            // 左侧空间不足，靠左对齐
            left = Math.max(margin, wrapperRect.left);
          } else {
            // 右侧空间不足，靠右对齐
            left = Math.min(
              window.innerWidth - tooltipWidth - margin,
              wrapperRect.right - tooltipWidth,
            );
          }

          // 确保不超出视口
          top = Math.max(
            margin,
            Math.min(top, window.innerHeight - tooltipHeight - margin),
          );
          left = Math.max(
            margin,
            Math.min(left, window.innerWidth - tooltipWidth - margin),
          );

          setTooltipStyle({
            top: `${top}px`,
            left: `${left}px`,
          });
        }
      });
    }
  }, [showTooltip]);

  // 点击跳转到设置页面
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 跳转到设置页面的模型服务标签
    navigate(Path.Settings);
    // 使用setTimeout确保页面已经加载
    setTimeout(() => {
      // 触发切换到模型服务标签的事件
      window.dispatchEvent(
        new CustomEvent("switchToModelService", {
          detail: { provider: providerName },
        }),
      );
    }, 100);
  };

  // 构建浮窗内容
  const getTooltipContent = () => {
    if (!providerConfig) {
      return [
        `${Locale.Chat.ProviderTooltip.Provider}: ${providerName}`,
        Locale.Chat.ProviderTooltip.NoConfig,
      ];
    }

    const lines = [
      `${Locale.Chat.ProviderTooltip.Provider}: ${providerName}`,
      `${Locale.Chat.ProviderTooltip.Source}: ${
        providerConfig.source === "frontend"
          ? Locale.Chat.ProviderTooltip.Frontend
          : Locale.Chat.ProviderTooltip.Server
      }`,
    ];

    if (providerConfig.baseUrl) {
      lines.push(
        `${Locale.Chat.ProviderTooltip.BaseUrl}: ${providerConfig.baseUrl}`,
      );
    }

    if (providerConfig.apiVersion) {
      lines.push(
        `${Locale.Chat.ProviderTooltip.ApiVersion}: ${providerConfig.apiVersion}`,
      );
    }

    // 显示API Key状态（不显示具体内容）
    if (providerConfig.apiKey) {
      const keyLength = providerConfig.apiKey.length;
      const maskedKey =
        keyLength > 8
          ? `${providerConfig.apiKey.substring(
              0,
              4,
            )}...${providerConfig.apiKey.substring(keyLength - 4)}`
          : "****";
      lines.push(`${Locale.Chat.ProviderTooltip.ApiKey}: ${maskedKey}`);
    }

    return lines;
  };

  return (
    <span
      ref={wrapperRef}
      className={styles["provider-tooltip-wrapper"]}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
    >
      {children}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles["provider-tooltip"]}
          style={tooltipStyle}
        >
          {getTooltipContent().map((line, index) => (
            <div key={index}>{line}</div>
          ))}
          <div className={styles["provider-tooltip-hint"]}>
            {Locale.Chat.ProviderTooltip.ClickToConfig}
          </div>
        </div>
      )}
    </span>
  );
};

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix Chinese input method "Enter" on Safari
    if (e.keyCode == 229) return false;
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

function _Chat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();

  // 过滤和处理 MCP 相关的消息（合并/隐藏提示词模式下的“工具声明”消息）
  const filterMcpMessages = (messages: ChatMessage[]): ChatMessage[] => {
    // 1) 先过滤掉 isMcpResponse（原始工具响应）
    const visible = messages.filter((m) => !m.isMcpResponse);

    // 2) 逐条处理，抽取 ```json:mcp:<clientId> ... ``` 代码块，必要时把它们合并到下一条助手消息
    const result: ChatMessage[] = [];

    for (let i = 0; i < visible.length; i++) {
      const m = visible[i];

      // 仅处理助手消息
      if (m.role !== "assistant") {
        result.push(m);
        continue;
      }

      // 读取纯文本内容
      const content =
        typeof m.content === "string"
          ? m.content
          : Array.isArray(m.content)
          ? m.content.map((c) => (c.type === "text" ? c.text : "")).join("")
          : "";

      // 无 mcp 代码块，直接保留
      if (!content.includes("```json:mcp:")) {
        result.push(m);
        continue;
      }

      // 提取 MCP 调用信息
      const mcpMatches = Array.from(
        content.matchAll(/```json:mcp:(\w+)\s*\n([\s\S]*?)```/g),
      );
      let mcpCalls: Array<{
        toolName: string;
        clientId: string;
        rawJson: string;
      }> = [];
      mcpMatches.forEach((match) => {
        try {
          const clientId = match[1];
          const rawJson = match[2];
          const mcpData = JSON.parse(rawJson);
          const toolName = mcpData.params?.name || "工具";
          mcpCalls.push({ toolName, clientId, rawJson });
        } catch (e) {
          // ignore parse error
        }
      });
      // 去重：防止同一流式回复多次出现相同的 MCP 调用块
      const seen = new Set<string>();
      mcpCalls = mcpCalls.filter((c) => {
        const key = `${c.clientId}|${c.toolName}|${c.rawJson}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // 移除代码块，保留其余内容
      const cleanContent = content
        .replace(/```json:mcp:[\s\S]*?```/g, "")
        .trim();

      // 如果当前这条消息在提示词模式下纯粹是“调用工具声明”（清理后没有内容），
      // 则将 mcpCalls 合并到下一条助手消息的 mcpCalls 中，并丢弃本条，避免出现两条消息。
      if (!cleanContent) {
        // 向后查找下一条助手消息
        let merged = false;
        for (let j = i + 1; j < visible.length; j++) {
          const next = visible[j];
          if (next.role === "assistant") {
            const nextAny: any = next as any;
            const exist = Array.isArray(nextAny.mcpCalls)
              ? nextAny.mcpCalls
              : [];
            // 合并并去重
            const combined = [...exist, ...mcpCalls];
            const seen2 = new Set<string>();
            nextAny.mcpCalls = combined.filter((c: any) => {
              const key = `${c.clientId}|${c.toolName}|${c.rawJson}`;
              if (seen2.has(key)) return false;
              seen2.add(key);
              return true;
            });
            merged = true;
            break;
          }
        }
        if (!merged) {
          // 若没有下一条助手消息，则把本条保留为“空内容+mcpCalls”，但前端将仅通过左上角徽标显示
          result.push({ ...(m as any), content: "", mcpCalls } as any);
        }
        continue;
      }

      // 否则，保留本条消息，内容为清理后文本，并附带 mcpCalls
      result.push({ ...(m as any), content: cleanContent, mcpCalls } as any);
    }

    return result;
  };
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
  const savedScrollState = sessionScrollStateMap.get(session.id);
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

  const { autoScroll, setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    !(isScrolledToBottom || isAttachWithTop) && !isTyping,
    session.messages,
    savedScrollState?.hitBottom ?? true,
    scrollTrigger,
    isStreamingFollow,
  );
  const [hitBottom, setHitBottom] = useState(
    savedScrollState?.hitBottom ?? true,
  );
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
      scrollToBottom();
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
    setAutoScroll(true);
    scrollToBottom();
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
      const modelConfig = session.mask.modelConfig;
      const globalConfig = config.modelConfig;

      // 使用配置的优化模型，优先级：会话配置 > 全局配置 > 当前聊天模型
      // 空字符串表示使用全局配置
      let optimizeModel: string;
      let optimizeProviderName: string;

      if (modelConfig.optimizeModel) {
        // 会话级别配置了优化模型
        optimizeModel = modelConfig.optimizeModel;
        optimizeProviderName =
          modelConfig.optimizeProviderName || modelConfig.providerName;
      } else if (globalConfig.optimizeModel) {
        // 使用全局配置的优化模型
        optimizeModel = globalConfig.optimizeModel;
        optimizeProviderName =
          globalConfig.optimizeProviderName || globalConfig.providerName;
      } else {
        // 使用当前聊天模型
        optimizeModel = modelConfig.model;
        optimizeProviderName = modelConfig.providerName;
      }

      const api = getClientApi(
        optimizeProviderName || ServiceProvider.OpenAI.id,
      );

      let optimizedText = "";

      // 获取优化模型的提示词，优先级：会话配置 > 全局配置 > 默认提示词
      const defaultOptimizePrompt =
        Locale.Settings.OptimizeModel.Prompt.Placeholder;

      let optimizePrompt = defaultOptimizePrompt;
      if (modelConfig.optimizeModelPrompt) {
        optimizePrompt = modelConfig.optimizeModelPrompt;
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
          model: optimizeModel,
          temperature: 0.3,
          stream: true,
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
    return new ClientApi(ModelProvider.GPT);
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
      const { markdownToTxt } = require("markdown-to-txt");
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

  const { virtualizer } = useVirtualScroll({
    messages,
    overscan: 6,
    autoScrollToBottom: false,
    scrollRef,
  });

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
    const saved = sessionScrollStateMap.get(session.id);
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
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);
    // 恢复跟随仅当“真正滚到最底部”：以当前最后一条消息的底部（大模型正在输入的位置）为参照，与视口底部对齐（1px 容差）
    const lastMessageEl = e.lastElementChild as HTMLElement | null;
    const isReallyAtBottom = lastMessageEl
      ? Math.abs(
          lastMessageEl.getBoundingClientRect().bottom -
            e.getBoundingClientRect().bottom,
        ) <= 1
      : bottomHeight >= e.scrollHeight - 1;

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
    setAutoScroll(isReallyAtBottom);
    const bottomOffset = Math.max(
      0,
      e.scrollHeight - e.clientHeight - e.scrollTop,
    );
    const maxStart = Math.max(0, renderMessages.length - CHAT_PAGE_SIZE);
    const isTrulyBottom = isHitBottom && msgRenderIndexRef.current >= maxStart;
    sessionScrollStateMap.set(session.id, {
      scrollTop: e.scrollTop,
      bottomOffset,
      msgRenderIndex: msgRenderIndexRef.current,
      hitBottom: isTrulyBottom,
    });
  };

  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  const handleInputFocusOrClick = () => {
    if (hitBottom) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (!isStreamingFollow || !autoScroll) return;
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }, [
    isStreamingFollow,
    autoScroll,
    scrollTrigger,
    renderMessages.length,
    scrollDomToBottom,
  ]);

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

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
            session.memoryPrompt = ""; // will clear memory
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

  const renderSingleMessage = (message: ChatMessageWithPreview, i: number) => {
    const isUser = message.role === "user";
    const isContext = i < context.length;
    const showActions =
      i > 0 && !(message.preview || message.content.length === 0) && !isContext;
    const showTyping = message.preview || message.streaming;

    const shouldShowClearContextDivider = i === clearContextIndex - 1;

    return (
      <Fragment key={message.id}>
        <div
          className={
            isUser ? styles["chat-message-user"] : styles["chat-message"]
          }
        >
          <div className={styles["chat-message-container"]}>
            <div className={styles["chat-message-header"]}>
              <div className={styles["chat-message-avatar"]}>
                <div className={styles["chat-message-edit"]}>
                  <IconButton
                    icon={<EditIcon />}
                    aria={Locale.Chat.Actions.Edit}
                    onClick={async () => {
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
                    }}
                  ></IconButton>
                </div>
                {isContext ? (
                  // 预设消息：使用配置中的角色头像
                  <Avatar
                    avatar={
                      message.role === "system"
                        ? config.systemAvatar
                        : message.role === "assistant"
                        ? config.assistantAvatar
                        : config.avatar
                    }
                  />
                ) : isUser ? (
                  <Avatar avatar={config.avatar} />
                ) : (
                  <>
                    {["system"].includes(message.role) ? (
                      <Avatar avatar={config.systemAvatar} />
                    ) : (
                      <MaskAvatar
                        avatar={session.mask.avatar}
                        model={message.model || session.mask.modelConfig.model}
                        provider={
                          session.mask.modelConfig.providerName || "OpenAI"
                        }
                      />
                    )}
                  </>
                )}
              </div>
              {(!isUser || (isContext && message.role !== "user")) && (
                <div className={styles["chat-model-name"]}>
                  {isContext ? (
                    // 预设消息：只显示角色名（user 角色不显示）
                    <span className={styles["chat-context-role-name"]}>
                      {message.role}
                    </span>
                  ) : message.isMultiModel && message.modelKey ? (
                    <>
                      {message.model || session.mask.modelConfig.model}
                      <ProviderTooltip
                        providerName={message.modelKey.split("@")[1]}
                      >
                        <span className={styles["chat-model-provider"]}>
                          @
                          {getProviderDisplayName(
                            message.modelKey.split("@")[1],
                            accessStore,
                          )}
                        </span>
                      </ProviderTooltip>
                    </>
                  ) : (
                    <>
                      {message.model || session.mask.modelConfig.model}
                      <ProviderTooltip
                        providerName={
                          session.mask.modelConfig.providerName || "OpenAI"
                        }
                      >
                        <span className={styles["chat-model-provider"]}>
                          @
                          {getProviderDisplayName(
                            session.mask.modelConfig.providerName || "OpenAI",
                            accessStore,
                          )}
                        </span>
                      </ProviderTooltip>
                    </>
                  )}
                </div>
              )}

              {showActions && (
                <div className={styles["chat-message-actions"]}>
                  <div className={styles["chat-input-actions"]}>
                    {(() => {
                      // 修复：更准确地判断消息是否应该显示停止按钮
                      const shouldShowStop =
                        message.streaming &&
                        (message.role === "assistant" ||
                          message.role === "user") &&
                        ChatControllerPool.hasPendingInSession(session.id);

                      if (shouldShowStop) {
                        return (
                          <ChatAction
                            text={Locale.Chat.Actions.Stop}
                            icon={<StopIcon />}
                            onClick={() => onUserStop(message.id ?? i)}
                          />
                        );
                      } else {
                        return (
                          <>
                            <ChatAction
                              text={Locale.Chat.Actions.Retry}
                              icon={<ResetIcon />}
                              onClick={() => onResend(message)}
                            />

                            {/* 版本切换按钮 - 只对 assistant 消息显示 */}
                            {(() => {
                              const shouldShowVersionControls =
                                message.role === "assistant" &&
                                message.versions &&
                                message.versions.length >= 1;

                              return (
                                shouldShowVersionControls && (
                                  <>
                                    {(message.currentVersionIndex ?? 0) > 0 && (
                                      <ChatAction
                                        text={
                                          Locale.Chat.Actions.PreviousVersion
                                        }
                                        icon={<LeftIcon />}
                                        onClick={() =>
                                          onPreviousVersion(message)
                                        }
                                      />
                                    )}

                                    {(message.currentVersionIndex ?? 0) <
                                      (message.versions?.length ?? 0) && (
                                      <ChatAction
                                        text={Locale.Chat.Actions.NextVersion}
                                        icon={<RightIcon />}
                                        onClick={() => onNextVersion(message)}
                                      />
                                    )}
                                  </>
                                )
                              );
                            })()}

                            <ChatAction
                              text={Locale.Chat.Actions.Delete}
                              icon={<DeleteIcon />}
                              onClick={() => onDelete(message.id ?? i)}
                            />

                            <ChatAction
                              text={Locale.Chat.Actions.Pin}
                              icon={<PinIcon />}
                              onClick={() => onPinMessage(message)}
                            />
                            <ChatAction
                              text={Locale.Chat.Actions.Copy}
                              icon={<CopyIcon />}
                              onClick={() =>
                                copyToClipboard(
                                  getMessageTextContentWithoutThinking(message),
                                )
                              }
                            />
                            {message.role === "assistant" && (
                              <ChatAction
                                text={Locale.Chat.Actions.Debug}
                                icon={<DebugIcon />}
                                onClick={() => {
                                  setDebugMessage(message as any);
                                  setDebugModalOpen(true);
                                }}
                              />
                            )}
                            {config.ttsConfig.enable && (
                              <ChatAction
                                text={
                                  speechStatus
                                    ? Locale.Chat.Actions.StopSpeech
                                    : Locale.Chat.Actions.Speech
                                }
                                icon={
                                  speechStatus ? (
                                    <SpeakStopIcon />
                                  ) : (
                                    <SpeakIcon />
                                  )
                                }
                                onClick={() =>
                                  openaiSpeech(getMessageTextContent(message))
                                }
                              />
                            )}
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
            {!message?.tools?.length &&
              !(message as any)?.mcpCalls?.length &&
              showTyping && (
                <div className={styles["chat-message-status"]}>
                  {Locale.Chat.Typing}
                </div>
              )}
            {/* 工具徽标（支持 function_call 与 MCP 提示词模式） */}
            {(() => {
              const mcpCalls: any[] = (message as any).mcpCalls || [];
              const functionTools: any[] = message?.tools || [];
              const unified = [
                ...functionTools.map((tool, idx) => {
                  const fullName = tool?.function?.name || "";
                  let toolName = fullName;
                  let clientName = "";
                  if (fullName.includes("__")) {
                    const parts = fullName.split("__");
                    if (parts.length >= 2) {
                      clientName = parts[0];
                      toolName = parts.slice(1).join("__");
                    }
                  } else if (fullName.includes("_")) {
                    const firstUnderscoreIndex = fullName.indexOf("_");
                    clientName = fullName.substring(0, firstUnderscoreIndex);
                    toolName = fullName.substring(firstUnderscoreIndex + 1);
                  } else if (fullName.includes("-")) {
                    const firstDashIndex = fullName.indexOf("-");
                    clientName = fullName.substring(0, firstDashIndex);
                    toolName = fullName.substring(firstDashIndex + 1);
                  }
                  return {
                    id: tool.id || `func:${idx}`,
                    source: "function",
                    toolName,
                    clientName,
                    raw: tool,
                  };
                }),
                ...mcpCalls.map((call, idx) => ({
                  id: `mcp:${idx}`,
                  source: "mcp",
                  toolName: call.toolName,
                  clientName: call.clientId,
                  raw: call,
                })),
              ];
              if (unified.length === 0) return null;

              return (
                <>
                  {/* 工具详情：取消顶部徽章与点击，直接展示工具调用内容 */}
                  {(() => {
                    if (unified.length === 0) return null;
                    return (
                      <div className={styles["mcp-tool-calls"]}>
                        {unified.map((item) => {
                          if (item.source === "function") {
                            const t = item.raw;
                            let parsedArgs: any = t?.function?.arguments;
                            try {
                              parsedArgs = parsedArgs
                                ? JSON.parse(parsedArgs)
                                : {};
                            } catch {}
                            return (
                              <details
                                key={item.id}
                                className={styles["mcp-tool-call"]}
                              >
                                <summary>
                                  <span
                                    className={styles["mcp-tool-call-title"]}
                                  >
                                    {item.clientName}
                                    {item.toolName ? ` / ${item.toolName}` : ""}
                                  </span>
                                  <span
                                    className={styles["mcp-tool-call-desc"]}
                                  >
                                    {item.source === "function"
                                      ? "Function"
                                      : "MCP"}
                                  </span>
                                </summary>
                                <div className={styles["mcp-tool-call-body"]}>
                                  <div className={styles["mcp-tool-call-line"]}>
                                    <span
                                      className={styles["mcp-tool-call-key"]}
                                    >
                                      args
                                    </span>
                                    <pre
                                      className={styles["mcp-tool-call-value"]}
                                    >
                                      {JSON.stringify(parsedArgs, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </details>
                            );
                          }

                          const c = item.raw;
                          return (
                            <details
                              key={item.id}
                              className={styles["mcp-tool-call"]}
                            >
                              <summary>
                                <span className={styles["mcp-tool-call-title"]}>
                                  {item.clientName}
                                  {item.toolName ? ` / ${item.toolName}` : ""}
                                </span>
                                <span className={styles["mcp-tool-call-desc"]}>
                                  MCP
                                </span>
                              </summary>
                              <div className={styles["mcp-tool-call-body"]}>
                                <div className={styles["mcp-tool-call-line"]}>
                                  <span className={styles["mcp-tool-call-key"]}>
                                    args
                                  </span>
                                  <pre
                                    className={styles["mcp-tool-call-value"]}
                                  >
                                    {JSON.stringify(c.args, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              );
            })()}
            <div className={styles["chat-message-item"]}>
              <Markdown
                key={message.streaming ? "loading" : "done"}
                content={(() => {
                  const messageContent =
                    typeof message.content === "string"
                      ? message.content
                      : getMessageTextContent(message);
                  const isThinking = isThinkingModel(message.model);
                  const shouldWrap = !message.streaming && isThinking;
                  if (shouldWrap) {
                    return wrapThinkingPart(messageContent);
                  }
                  return messageContent;
                })()}
                loading={
                  (message.preview || message.streaming) &&
                  (!message.content ||
                    (typeof message.content === "string" &&
                      message.content.length === 0))
                }
                fontSize={fontSize}
                fontFamily={fontFamily}
                parentRef={scrollRef}
                defaultShow={i >= messages.length - 6}
              />
              {getMessageImages(message).length === 1 && (
                <div
                  className={styles["chat-message-item-image-container"]}
                  style={{ cursor: "pointer" }}
                  onClick={() => showImageModal(getMessageImages(message)[0])}
                >
                  <Image
                    className={styles["chat-message-item-image"]}
                    src={getMessageImages(message)[0]}
                    alt=""
                    fill={false}
                    width={256}
                    height={256}
                  />
                </div>
              )}
              {getMessageImages(message).length > 1 && (
                <div
                  className={styles["chat-message-item-images"]}
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(
                      getMessageImages(message).length,
                      3,
                    )}, 1fr)`,
                  }}
                >
                  {getMessageImages(message).map((image, i) => (
                    <div
                      key={i}
                      className={
                        styles["chat-message-item-image-multi-container"]
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() => showImageModal(image)}
                    >
                      <Image
                        className={styles["chat-message-item-image-multi"]}
                        src={image}
                        alt=""
                        fill={false}
                        width={128}
                        height={128}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {message?.audio_url && (
              <div className={styles["chat-message-audio"]}>
                <audio src={message.audio_url} controls />
              </div>
            )}

            <div className={styles["chat-message-action-date"]}>
              {/* 版本指示器 - 只对有版本的 assistant 消息显示 */}
              {message.role === "assistant" &&
                message.versions &&
                message.versions.length >= 1 && (
                  <span className={styles["chat-message-version"]}>
                    {(message.currentVersionIndex ?? 0) + 1}/
                    {(message.versions?.length ?? 0) + 1}
                  </span>
                )}
              {message.role === "assistant" &&
                message.statistic?.completionTokens &&
                message.statistic?.totalReplyLatency && (
                  <span className={styles["chat-message-tps"]}>
                    {(
                      (message.statistic.completionTokens /
                        message.statistic.totalReplyLatency) *
                      1000
                    ).toFixed(1)}{" "}
                    t/s
                  </span>
                )}
              {message.date.toLocaleString()}
            </div>
          </div>
        </div>
        {shouldShowClearContextDivider && <ClearContextDivider />}
      </Fragment>
    );
  };

  return (
    <>
      <div className={styles.chat} key={session.id}>
        <div className="window-header" data-tauri-drag-region>
          {isMobileScreen && (
            <div className="window-actions">
              <div className={"window-action-button"}>
                <IconButton
                  icon={<ReturnIcon />}
                  bordered
                  title={Locale.Chat.Actions.ChatList}
                  onClick={() => navigate(Path.Home)}
                />
              </div>
            </div>
          )}

          <div
            className={clsx("window-header-title", styles["chat-body-title"])}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {!isMobileScreen && (
              <div className="window-action-button">
                <IconButton
                  icon={<MenuIcon />}
                  bordered
                  title={Locale.Chat.UI.SidebarToggle}
                  onClick={toggleSideBarCollapse}
                />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div
                className={clsx(
                  "window-header-main-title",
                  styles["chat-body-main-title"],
                )}
                onClickCapture={() => setIsEditingMessage(true)}
              >
                {!session.topic ? DEFAULT_TOPIC : session.topic}
              </div>
              <div className="window-header-sub-title">
                <span>
                  {Locale.Chat.SubTitle(
                    filterMcpMessages(session.messages).length,
                  )}
                </span>
                <span className={styles["chat-assistant-name"]}>
                  {session.mask.name}
                </span>
                {/* Response API 会话 ID 显示 */}
                {session.responseApiConversationId && (
                  <span
                    className={styles["response-api-conversation-id"]}
                    title={`Response API 会话 ID: ${session.responseApiConversationId}`}
                    onClick={() => {
                      copyToClipboard(session.responseApiConversationId!);
                      showToast("会话 ID 已复制到剪贴板");
                    }}
                    style={{
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "var(--primary)",
                      textDecoration: "underline",
                      marginLeft: "8px",
                    }}
                  >
                    ID: {session.responseApiConversationId.slice(-8)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<ReloadIcon />}
                bordered
                title={Locale.Chat.Actions.RefreshTitle}
                onClick={() => {
                  showToast(Locale.Chat.Actions.RefreshToast);
                  chatStore.summarizeSession(true, session);
                }}
              />
            </div>
            {!isMobileScreen && (
              <div className="window-action-button">
                <IconButton
                  icon={<RenameIcon />}
                  bordered
                  title={Locale.Chat.EditMessage.Title}
                  aria={Locale.Chat.EditMessage.Title}
                  onClick={() => setIsEditingMessage(true)}
                />
              </div>
            )}
            <div className="window-action-button">
              <IconButton
                icon={<ExportIcon />}
                bordered
                title={Locale.Chat.Actions.Export}
                onClick={() => {
                  setShowExport(true);
                }}
              />
            </div>
            {showMaxIcon && (
              <div className="window-action-button">
                <IconButton
                  icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                  bordered
                  title={Locale.Chat.Actions.FullScreen}
                  aria={Locale.Chat.Actions.FullScreen}
                  onClick={() => {
                    config.update(
                      (config) => (config.tightBorder = !config.tightBorder),
                    );
                  }}
                />
              </div>
            )}
          </div>

          <PromptToast
            showToast={!hitBottom}
            showModal={showPromptModal}
            setShowModal={setShowPromptModal}
          />
        </div>
        <div className={styles["chat-main"]}>
          <div className={styles["chat-body-container"]}>
            <div
              className={styles["chat-body"]}
              ref={scrollRef}
              onScroll={(e) => onChatBodyScroll(e.currentTarget)}
              onMouseDown={() => inputRef.current?.blur()}
              onTouchStart={() => {
                inputRef.current?.blur();
                setAutoScroll(false);
              }}
            >
              {isMultiModel ? (
                groupedMessages.map((group, groupIndex) => {
                  if (group.type === "multi-assistant") {
                    // 横向排列多个assistant消息
                    return (
                      <div
                        key={`group-${groupIndex}`}
                        className={styles["multi-model-messages"]}
                      >
                        {group.messages.map((message) => {
                          const [modelName, providerId] = (
                            message.modelKey || ""
                          ).split("@");

                          // 如果没有 modelKey，使用 message.model 或 session 配置作为后备
                          const displayModelName =
                            modelName ||
                            message.model ||
                            session.mask.modelConfig.model;
                          const displayProviderId =
                            providerId ||
                            session.mask.modelConfig.providerName ||
                            "OpenAI";

                          // 获取用户友好的 provider 显示名称
                          const getProviderDisplayName = (
                            providerId: string,
                          ) => {
                            if (providerId?.startsWith("custom_")) {
                              const customProvider =
                                accessStore.customProviders.find(
                                  (p) => p.id === providerId,
                                );
                              return customProvider?.name || providerId;
                            }
                            return providerId;
                          };

                          const providerDisplayName =
                            getProviderDisplayName(displayProviderId);

                          const showActions = !(
                            message.preview || message.content.length === 0
                          );
                          const showTyping =
                            message.preview || message.streaming;

                          return (
                            <div
                              key={message.id}
                              className={styles["multi-model-message-column"]}
                            >
                              <div className={styles["chat-message-container"]}>
                                <div className={styles["chat-message-header"]}>
                                  <div
                                    className={styles["chat-message-avatar"]}
                                  >
                                    <MaskAvatar
                                      avatar={session.mask.avatar}
                                      model={message.model || displayModelName}
                                      provider={displayProviderId}
                                      modelKey={message.modelKey}
                                    />
                                  </div>

                                  <div className={styles["chat-model-name"]}>
                                    {displayModelName}
                                    <ProviderTooltip
                                      providerName={displayProviderId}
                                    >
                                      <span
                                        className={
                                          styles["chat-model-provider"]
                                        }
                                      >
                                        @{providerDisplayName}
                                      </span>
                                    </ProviderTooltip>
                                  </div>

                                  {showActions && (
                                    <div
                                      className={styles["chat-message-actions"]}
                                    >
                                      <div
                                        className={styles["chat-input-actions"]}
                                      >
                                        {(() => {
                                          const shouldShowStop =
                                            message.streaming &&
                                            ChatControllerPool.hasPendingInSession(
                                              session.id,
                                            );

                                          if (shouldShowStop) {
                                            return (
                                              <ChatAction
                                                text={Locale.Chat.Actions.Stop}
                                                icon={<StopIcon />}
                                                onClick={() =>
                                                  onUserStop(message.id)
                                                }
                                              />
                                            );
                                          } else {
                                            return (
                                              <>
                                                <ChatAction
                                                  text={
                                                    Locale.Chat.Actions.Retry
                                                  }
                                                  icon={<ResetIcon />}
                                                  onClick={() =>
                                                    onResend(message)
                                                  }
                                                />
                                                <ChatAction
                                                  text={
                                                    Locale.Chat.Actions.Copy
                                                  }
                                                  icon={<CopyIcon />}
                                                  onClick={() =>
                                                    copyToClipboard(
                                                      getMessageTextContentWithoutThinking(
                                                        message,
                                                      ),
                                                    )
                                                  }
                                                />
                                              </>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {!message?.tools?.length &&
                                  !(message as any)?.mcpCalls?.length &&
                                  showTyping && (
                                    <div
                                      className={styles["chat-message-status"]}
                                    >
                                      {Locale.Chat.Typing}
                                    </div>
                                  )}

                                <div className={styles["chat-message-item"]}>
                                  <Markdown
                                    key={message.streaming ? "loading" : "done"}
                                    content={(() => {
                                      const messageContent =
                                        typeof message.content === "string"
                                          ? message.content
                                          : getMessageTextContent(message);
                                      const isThinking = isThinkingModel(
                                        message.model,
                                      );
                                      const shouldWrap =
                                        !message.streaming && isThinking;
                                      if (shouldWrap) {
                                        return wrapThinkingPart(messageContent);
                                      }
                                      return messageContent;
                                    })()}
                                    loading={
                                      (message.preview || message.streaming) &&
                                      (!message.content ||
                                        (typeof message.content === "string" &&
                                          message.content.length === 0))
                                    }
                                    fontSize={fontSize}
                                    fontFamily={fontFamily}
                                    parentRef={scrollRef}
                                    defaultShow={true}
                                  />
                                </div>

                                <div
                                  className={styles["chat-message-action-date"]}
                                >
                                  {message.role === "assistant" &&
                                    message.statistic?.completionTokens &&
                                    message.statistic?.totalReplyLatency && (
                                      <span
                                        className={styles["chat-message-tps"]}
                                      >
                                        {(
                                          (message.statistic.completionTokens /
                                            message.statistic
                                              .totalReplyLatency) *
                                          1000
                                        ).toFixed(1)}{" "}
                                        t/s
                                      </span>
                                    )}
                                  {message.date.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 单个消息正常渲染
                  const message = group.messages[0];
                  const i = group.index;
                  return renderSingleMessage(message, i);
                })
              ) : (
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem: any) => {
                    const message = messages[virtualItem.index];
                    if (!message) return null;

                    return (
                      <div
                        key={message.id}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className={styles["virtual-message-item"]}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                          willChange: "transform",
                        }}
                      >
                        {renderSingleMessage(message, virtualItem.index)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={styles["chat-input-panel"]}>
              <PromptHints
                prompts={promptHints}
                onPromptSelect={onPromptSelect}
              />

              <MCPPanel
                showPanel={showMcpPanel}
                onClose={() => setShowMcpPanel(false)}
              />

              <ShortcutKeyPanel
                showPanel={showShortcutKeyPanel}
                onClose={() => setShowShortcutKeyPanel(false)}
              />

              <ThinkingPanel
                showPanel={showThinkingPanel}
                onClose={() => setShowThinkingPanel(false)}
              />

              <MultiModelPanel
                showPanel={showMultiModelPanel}
                onClose={() => setShowMultiModelPanel(false)}
                onOpenSelector={() => {
                  setShowMultiModelPanel(false);
                  setShowModelSelector(true);
                }}
              />

              <ChatActions
                uploadImage={uploadImage}
                setAttachImages={setAttachImages}
                setUploading={setUploading}
                scrollToBottom={scrollToBottom}
                hitBottom={hitBottom}
                uploading={uploading}
                showPromptHints={() => {
                  // Click again to close
                  if (promptHints.length > 0) {
                    setPromptHints([]);
                    return;
                  }

                  inputRef.current?.focus();
                  setUserInput("/");
                  onSearch("");
                }}
                setShowShortcutKeyModal={setShowShortcutKeyModal}
                setUserInput={setUserInput}
                setShowChatSidePanel={setShowChatSidePanel}
                showMcpPanel={showMcpPanel}
                setShowMcpPanel={setShowMcpPanel}
                showShortcutKeyPanel={showShortcutKeyPanel}
                setShowShortcutKeyPanel={setShowShortcutKeyPanel}
                showThinkingPanel={showThinkingPanel}
                setShowThinkingPanel={setShowThinkingPanel}
                showMultiModelPanel={showMultiModelPanel}
                setShowMultiModelPanel={setShowMultiModelPanel}
                toggleMultiModelMode={toggleMultiModelMode}
                showModelSelector={showModelSelector}
                setShowModelSelector={setShowModelSelector}
                userInput={userInput}
                couldStop={couldStop}
                setCouldStop={setCouldStop}
                optimizePrompt={optimizePrompt}
              />
              <label
                className={clsx(styles["chat-input-panel-inner"], {
                  [styles["chat-input-panel-inner-attach"]]:
                    attachImages.length !== 0,
                })}
                htmlFor="chat-input"
              >
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  className={styles["chat-input"]}
                  placeholder={Locale.Chat.Input(submitKey)}
                  onInput={(e) => onInput(e.currentTarget.value)}
                  value={userInput}
                  onKeyDown={onInputKeyDown}
                  onFocus={handleInputFocusOrClick}
                  onClick={handleInputFocusOrClick}
                  onPaste={handlePaste}
                  rows={inputRows}
                  autoFocus={autoFocus}
                  style={{
                    fontSize: config.fontSize,
                    fontFamily: config.fontFamily,
                  }}
                />
                {attachImages.length != 0 && (
                  <div className={styles["attach-images"]}>
                    {attachImages.map((image, index) => {
                      return (
                        <div
                          key={index}
                          className={styles["attach-image"]}
                          style={{ backgroundImage: `url("${image}")` }}
                        >
                          <div className={styles["attach-image-mask"]}>
                            <DeleteImageButton
                              deleteImage={() => {
                                setAttachImages(
                                  attachImages.filter((_, i) => i !== index),
                                );
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <IconButton
                  icon={<SendWhiteIcon />}
                  text={Locale.Chat.Send}
                  className={styles["chat-input-send"]}
                  type="primary"
                  onClick={() => doSubmit(userInput)}
                />
              </label>
            </div>
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

      {debugModalOpen && (
        <div className="modal-mask">
          <Modal
            title={Locale.Chat.Actions.Debug}
            onClose={() => {
              setDebugModalOpen(false);
              setDebugMessage(null);
            }}
            actions={[
              <IconButton
                text={Locale.Chat.Actions.CopyAsCurl}
                icon={<CopyIcon />}
                key="copycurl"
                onClick={() => {
                  const req = (debugMessage as any)?.debug?.request;
                  if (!req) return;
                  const method = (req.method || "POST").toUpperCase();
                  const url = req.url || "";
                  const headers = req.headers || {};

                  const lines: string[] = [];
                  // First line: URL
                  lines.push(`curl '${url}'`);

                  // Optional method line
                  if (method && method !== "GET") {
                    lines.push(`-X ${method}`);
                  }

                  // Header lines
                  try {
                    Object.keys(headers || {}).forEach((k) => {
                      const v = (headers as any)[k];
                      const sv = typeof v === "string" ? v : JSON.stringify(v);
                      lines.push(`-H '${k}: ${sv}'`);
                    });
                  } catch {}

                  // Body line (pretty-printed JSON if possible)
                  const body = req.body;
                  if (typeof body !== "undefined") {
                    let bodyStr: string;
                    try {
                      if (typeof body === "string") {
                        const parsed = JSON.parse(body);
                        bodyStr = JSON.stringify(parsed, null, 2);
                      } else {
                        bodyStr = JSON.stringify(body, null, 2);
                      }
                    } catch {
                      bodyStr =
                        typeof body === "string" ? body : JSON.stringify(body);
                    }
                    // Escape single quotes for bash-safe single-quoted string
                    const escaped = bodyStr.replace(/'/g, `'"'"'`);
                    lines.push(`-d '${escaped}'`);
                  }

                  // Add trailing backslashes to all but the last line
                  const formatted = lines.map((line, idx) =>
                    idx < lines.length - 1 ? `${line} \\` : line,
                  );

                  const cmd = formatted.join("\n");
                  copyToClipboard(cmd);
                }}
              />,
            ]}
          >
            <div
              style={{
                height: "100%",
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Request</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    userSelect: "text",
                    cursor: "text",
                    backgroundColor: "var(--hover-color)",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  {(() => {
                    const req = (debugMessage as any)?.debug?.request;
                    if (!req) return "<empty>";
                    // 懒加载：body 为字符串时在此解析，用于格式化显示
                    let displayReq = req;
                    if (
                      typeof req.body === "string" &&
                      (req.body.trimStart().startsWith("{") ||
                        req.body.trimStart().startsWith("["))
                    ) {
                      try {
                        displayReq = { ...req, body: JSON.parse(req.body) };
                      } catch {
                        /* 解析失败则原样显示 */
                      }
                    }
                    return JSON.stringify(displayReq, null, 2);
                  })()}
                </pre>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Response</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    userSelect: "text",
                    cursor: "text",
                    backgroundColor: "var(--hover-color)",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  {(() => {
                    const res = (debugMessage as any)?.debug?.response;
                    return res ? JSON.stringify(res, null, 2) : "<empty>";
                  })()}
                </pre>
              </div>
            </div>
          </Modal>
        </div>
      )}
      <ImagePreviewModal
        show={imagePreview.show}
        src={imagePreview.src}
        onClose={() => setImagePreview({ show: false, src: "" })}
      />
    </>
  );
}

export function Chat() {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  return <_Chat key={session.id}></_Chat>;
}

// Re-export 拆出的组件，保持向后兼容
export { ChatAction } from "./chat/ChatAction";
export { TokenCounter } from "./chat/TokenCounter";
export { EditMessageModal } from "./chat/EditMessageModal";
export { DeleteImageButton } from "./chat/DeleteImageButton";
export { ShortcutKeyModal } from "./chat/ShortcutKeyModal";
export { ClearContextDivider } from "./chat/ClearContextDivider";
export { SessionConfigModel } from "./chat/SessionConfigModel";
export { PromptHints, type RenderPrompt } from "./chat/PromptHints";
export { ChatActions } from "./chat/ChatActions";
