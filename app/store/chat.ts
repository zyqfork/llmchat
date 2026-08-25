import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  getMessageImages,
  isDalle3,
  safeLocalStorage,
  trimTopic,
  removeThinkingContent,
} from "../utils";
import { isVisionModel } from "../constant";

import { indexedDBStorage } from "@/app/utils/indexedDB-storage";
import { isContextOverflow } from "@earendil-works/pi-ai";
import { isResponseStatefulEnabled } from "../utils/response-api";
import {
  StreamUpdateOptimizer,
  createLightweightMessageUpdate,
} from "@/app/utils/stream-optimizer";
import { nanoid } from "nanoid";
import type {
  ClientApi,
  MultimodalContent,
  RequestMessage,
} from "../client/api";
import { getClientApi } from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { showToast } from "../components/ui-lib";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  GEMINI_SUMMARIZE_MODEL,
  DEEPSEEK_SUMMARIZE_MODEL,
  KnowledgeCutOffDate,
  MCP_SYSTEM_TEMPLATE,
  MCP_TOOLS_TEMPLATE,
  ServiceProvider,
  StoreKey,
  SUMMARIZE_MODEL,
  UNFINISHED_INPUT,
} from "../constant";
import Locale, { getLang } from "../locales";
import { prettyObject } from "../utils/format";
import { createPersistStore } from "../utils/store";
import { estimateTokenLength } from "../utils/token";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import {
  getSessionModelConfig,
  getMaskCompressModel,
  getSessionCompressModelConfig,
  getSessionTopicModelConfig,
} from "../utils/model-resolver";
import { getModelStreamConfig } from "../config/model-stream";
import { applyModelThinkingDefault } from "../config/model-thinking";
import { useAccessStore } from "./access";
import { collectModelsWithDefaultModel } from "../utils/model";
import { createDefaultMask, DEFAULT_MASK_ID, Mask } from "./mask";
import { executeMcpAction, getAllTools } from "../mcp/actions.client";
import { extractMcpJson, isMcpJson } from "../mcp/utils";
import { logger } from "../utils/logger";
import {
  executeSummaryStream,
  getCompactionPolicy,
  buildSummaryPrompt,
  collectSummaryInputs,
  collectCompactionSlice,
  getActiveContextStartIndex,
  getCompactionBoundaryStartIndex,
  getPreviousSummaryText,
  DEFAULT_COMPACTION_INITIAL_PROMPT,
  DEFAULT_COMPACTION_SYSTEM_PROMPT,
  DEFAULT_COMPACTION_UPDATE_PROMPT,
} from "../core/compaction";

const localStorage = safeLocalStorage();

const DEFAULT_AUTO_TITLE_MIN_USER_TOKENS = 20;
const DEFAULT_AUTO_TITLE_MIN_USER_MESSAGES = 1;
const DEFAULT_AUTO_TITLE_REFRESH_INTERVAL = 4;
const DEFAULT_SUMMARY_MIN_USER_MESSAGES = 1;
const TITLE_MAX_OUTPUT_TOKENS = 128;
const SUMMARY_MAX_OUTPUT_TOKENS = 2048;

function isResponseApiDebugRequest(reqDebug: any): boolean {
  const url = String(reqDebug?.url || "").toLowerCase();
  const body = reqDebug?.body;

  return (
    /\/responses(\?|$)/.test(url) ||
    (!!body &&
      typeof body === "object" &&
      "input" in body &&
      !("messages" in body))
  );
}

function extractPiResponseMetadata(responseRes: Response | undefined) {
  const metadata = (responseRes as any)?.__providerMetadata;
  return metadata && typeof metadata === "object" ? metadata : undefined;
}

function extractResponseApiConversationId(
  responseRes: Response | undefined,
  isResponseApiRequest: boolean,
): string | undefined {
  if (!isResponseApiRequest || responseRes?.status !== 200) {
    return undefined;
  }

  const providerMetadata = (responseRes as any)?.__providerMetadata;
  if (providerMetadata && typeof providerMetadata === "object") {
    const providerResponseId =
      providerMetadata.openai?.responseId ??
      providerMetadata.azure?.responseId ??
      providerMetadata.responseId;
    if (providerResponseId) {
      return providerResponseId;
    }
  }

  const responseBody = (responseRes as any)?.__responseBody;
  if (responseBody && typeof responseBody === "object") {
    return (
      responseBody.conversation_id ||
      responseBody.id ||
      responseBody.response?.id ||
      responseBody.response?.conversation_id
    );
  }

  return undefined;
}

export type ChatMessageTool = {
  id: string;
  index?: number;
  contentOffset?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
  };
  mcpPayload?: any;
  mcpMeta?: {
    clientId?: string;
    toolName?: string;
  };
  content?: string;
  isError?: boolean;
  errorMsg?: string;
};

export type ChatMessageDebug = {
  request?: {
    url?: string;
    method?: string;
    headers?: any;
    body?: any;
  };
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: any;
  };
};

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  tools?: ChatMessageTool[];
  audio_url?: string;
  isMcpResponse?: boolean;
  // 多模型模式下的模型标识
  modelKey?: string; // 格式: "model@provider"
  // 是否为多模型模式下的消息
  isMultiModel?: boolean;
  // pi-ai 原生结构化内容，content 保留为兼容现有渲染和导出逻辑的展示文本。
  contentBlocks?: Array<Record<string, any>>;
  stopReason?: string;
  usage?: Record<string, any>;
  piApi?: string;
  piProvider?: string;
  piModel?: string;
  // 统计信息
  statistic?: {
    singlePromptTokens?: number;
    completionTokens?: number;
    reasoningTokens?: number;
    firstReplyLatency?: number;
    searchingLatency?: number;
    reasoningLatency?: number;
    totalReplyLatency?: number;
  };
  // 重试版本管理 - 简化版本
  versions?: string[]; // 存储所有版本的内容
  currentVersionIndex?: number; // 当前显示的版本索引
  // 调试信息（HTTP 请求与响应）
  debug?: ChatMessageDebug;
  isCompressedContextPrompt?: boolean;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;
  isAutoTopic?: boolean;
  lastAutoTopicIndex?: number;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;
  compressedContextIndex?: number;
  compressingContextIndex?: number;
  pinned?: boolean; // 钉选状态

  mask: Mask;
  // MCP 功能总开关（默认关闭）
  mcpEnabled?: boolean;
  // MCP 在当前对话中的启用状态
  mcpEnabledClients?: Record<string, boolean>;
  // Response API 会话 ID（用于维持上下文）
  responseApiConversationId?: string;
  // 多模型对话模式
  multiModelMode?: {
    enabled: boolean;
    selectedModels: string[]; // 格式: "model@provider"
    // 每个模型的独立消息历史 - key: "model@provider", value: messages
    modelMessages: Record<string, ChatMessage[]>;
    // 每个模型的独立统计
    modelStats: Record<string, ChatStat>;
    // 每个模型的独立记忆提示
    modelMemoryPrompts: Record<string, string>;
    // 每个模型的独立总结索引
    modelSummarizeIndexes: Record<string, number>;
    // 每个模型的 Response API 会话 ID
    modelResponseApiConversationIds?: Record<string, string>;
  };
  // 搜索功能状态
  searchEnabled?: boolean;
  // 是否正在生成摘要（防止并发）
  isSummarizing?: boolean;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  const mask = createDefaultMask();
  mask.modelConfig = applyModelThinkingDefault(mask.modelConfig);

  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    isAutoTopic: true,
    lastAutoTopicIndex: 0,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask, // 使用默认助手，并应用当前模型的全局思考设置
    mcpEnabledClients: {}, // 初始化 MCP 启用状态
    multiModelMode: {
      enabled: false,
      selectedModels: [],
      modelMessages: {},
      modelStats: {},
      modelMemoryPrompts: {},
      modelSummarizeIndexes: {},
    },
  };
}

function getSummarizeModel(
  currentModel: string,
  providerName: string,
): string[] {
  // if it is using gpt-* models, force to use 4o-mini to summarize
  if (currentModel.startsWith("gpt") || currentModel.startsWith("chatgpt")) {
    const configStore = useAppConfig.getState();
    const accessStore = useAccessStore.getState();
    const allModel = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
    const summarizeModel = allModel.find(
      (m) => m.name === SUMMARIZE_MODEL && m.available,
    );
    if (summarizeModel) {
      return [
        summarizeModel.name,
        summarizeModel.provider?.providerName as string,
      ];
    }
  }
  if (currentModel.startsWith("gemini")) {
    return [GEMINI_SUMMARIZE_MODEL, ServiceProvider.Google.id];
  } else if (currentModel.startsWith("deepseek-")) {
    return [DEEPSEEK_SUMMARIZE_MODEL, ServiceProvider.DeepSeek.id];
  }

  return [currentModel, providerName];
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

export function countUserMessages(messages: ChatMessage[]) {
  let count = 0;
  for (const msg of messages) {
    if (msg.isError || msg.role !== "user") {
      continue;
    }
    const content = getMessageTextContentWithoutThinking(msg).trim();
    if (content) {
      count += 1;
    }
  }
  return count;
}

export function countUserTokens(messages: ChatMessage[]) {
  let total = 0;
  for (const msg of messages) {
    if (msg.isError || msg.role !== "user") {
      continue;
    }
    const content = getMessageTextContentWithoutThinking(msg).trim();
    if (content) {
      total += estimateTokenLength(content);
    }
  }
  return total;
}

export function buildConversationTranscript(
  messages: ChatMessage[],
  includeSystem: boolean,
) {
  return messages
    .filter((msg) => includeSystem || msg.role !== "system")
    .map((msg) => {
      const content = getMessageTextContentWithoutThinking(msg).trim();
      if (!content) {
        return "";
      }
      return `${msg.role}: ${content}`;
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

export function isLikelyContextOverflowError(error: Error | null | undefined): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) return false;
  return isContextOverflow({
    stopReason: "error",
    errorMessage: String(error.message || ""),
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
  } as any);
}

export function formatChatErrorCodeBlock(message: string): string {
  const content = (message || "").trim();
  try {
    const obj = JSON.parse(content);
    const errorMsg =
      obj.error?.message ||
      obj.message ||
      (typeof obj.error === "string" ? obj.error : null);
    if (errorMsg) {
      return `⚠️ **${errorMsg}**\n\n${prettyObject(obj)}`;
    }
    return prettyObject(obj);
  } catch {
    // Not a JSON, return as plain text with warning icon
  }
  return `⚠️ ${content}`;
}

export function buildUserMessagesText(messages: ChatMessage[]) {
  const lines: string[] = [];

  for (const msg of messages) {
    if (msg.isError || msg.role !== "user") {
      continue;
    }
    const content = getMessageTextContentWithoutThinking(msg).trim();
    if (!content) {
      continue;
    }
    lines.push(content);
  }

  return lines.join("\n");
}

export function buildTopicPrompt(
  instruction: string,
  userMessages: string,
  assistantMessage: string,
) {
  let output = instruction;

  if (output.includes("{{user_messages}}")) {
    output = output.replace("{{user_messages}}", userMessages);
  } else if (userMessages) {
    output = `${output}\n\n用户发言：\n${userMessages}`;
  }

  if (output.includes("{{assistant_message}}")) {
    output = output.replace("{{assistant_message}}", assistantMessage);
  } else if (assistantMessage) {
    output = `${output}\n\n助手回复：\n${assistantMessage}`;
  }

  return output;
}

export function buildTopicRequestMessages(
  topicPrompt: string,
  messages: ChatMessage[],
) {
  const userMessages = buildUserMessagesText(messages);
  const assistantMessage = "";

  const topicInput = buildTopicPrompt(
    topicPrompt,
    userMessages,
    assistantMessage,
  );
  return [
    createMessage({
      role: "user",
      content: topicInput,
    }),
  ];
}

export function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

export async function getMcpSystemPrompt(
  mcpEnabled: boolean = false,
  enabledClients?: Record<string, boolean>,
): Promise<string> {
  if (!mcpEnabled) return "";

  const { getMcpConfigFromFile } = await import("../mcp/actions.client");
  const config = await getMcpConfigFromFile();
  if (config.callMode === "function_call") return "";

  const tools = await getAllTools();
  const toolsTemplate = config.customToolsPrompt || MCP_TOOLS_TEMPLATE;
  const systemTemplate = config.customSystemPrompt || MCP_SYSTEM_TEMPLATE;
  let toolsStr = "";
  let totalToolCount = 0;

  tools.forEach((client) => {
    if (!client.tools || enabledClients?.[client.clientId] === false) return;
    totalToolCount += client.tools.tools.length;
    toolsStr += toolsTemplate
      .replace(/\{\{ clientId \}\}/g, client.clientId)
      .replace(
        "{{ tools }}",
        client.tools.tools
          .map((tool: object) => JSON.stringify(tool, null, 2))
          .join("\n"),
      );
  });

  let finalTemplate = systemTemplate;
  if (totalToolCount > 0 && systemTemplate.includes("## Tool Use Rules")) {
    finalTemplate = systemTemplate.replace(
      "## Tool Use Rules",
      `## Tool Use Rules (${totalToolCount} tools available)\n**IMPORTANT: You have ${totalToolCount} powerful tools available. Use them actively to help users!**`,
    );
  }
  return finalTemplate.replace("{{ MCP_TOOLS }}", toolsStr);
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
  lastInput: "",
  currentMaskId: "default-mask", // 默认选中默认助手
};

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    // 创建流式更新优化器
    const streamOptimizer = new StreamUpdateOptimizer((updates) => {
      // 批量处理流式更新，避免频繁的深拷贝和存储
      const sessions = get().sessions;
      let hasChanges = false;

      const newSessions = sessions.map((session) => {
        for (const [key, update] of updates) {
          if (key.startsWith(session.id)) {
            const messageIndex = session.messages.findIndex(
              (m) => m.id === update.messageId,
            );
            if (messageIndex >= 0) {
              const updatedSession = {
                ...session,
                ...createLightweightMessageUpdate(
                  session,
                  messageIndex,
                  update.content,
                ),
              };
              hasChanges = true;
              return updatedSession;
            }
          }
        }
        return session;
      });

      if (hasChanges) {
        set({ sessions: newSessions });
      }
    });

    const methods = {
      forkSession() {
        // 获取当前会话
        const currentSession = get().currentSession();
        if (!currentSession) return;

        const newSession = createEmptySession();

        newSession.topic = currentSession.topic;
        newSession.isAutoTopic =
          currentSession.isAutoTopic ?? currentSession.topic === DEFAULT_TOPIC;
        newSession.lastAutoTopicIndex = currentSession.lastAutoTopicIndex ?? 0;
        // 深拷贝消息
        newSession.messages = currentSession.messages.map((msg) => ({
          ...msg,
          id: nanoid(), // 生成新的消息 ID
        }));
        newSession.mask = {
          ...currentSession.mask,
          modelConfig: {
            ...currentSession.mask.modelConfig,
          },
        };

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [newSession, ...state.sessions],
        }));
      },

      clearSessions() {
        // 中止所有会话的网络请求
        ChatControllerPool.stopAll();

        // 清理所有会话的未完成输入
        const sessions = get().sessions;
        sessions.forEach((session) => {
          try {
            localStorage.removeItem(UNFINISHED_INPUT(session.id));
          } catch (e) {
            logger.error("Failed to remove unfinished input:", e);
          }
        });

        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      // 清理孤立的未完成输入数据（会话已删除但数据还在）
      cleanOrphanedUnfinishedInputs() {
        try {
          // 检查是否在浏览器环境
          if (typeof window === "undefined" || !window.localStorage) {
            return;
          }

          const sessions = get().sessions;
          const sessionIds = new Set(sessions.map((s) => s.id));

          // 遍历 localStorage 找到所有 unfinished-input- 开头的 key
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith("unfinished-input-")) {
              const sessionId = key.replace("unfinished-input-", "");
              if (!sessionIds.has(sessionId)) {
                keysToRemove.push(key);
              }
            }
          }

          // 删除孤立的数据
          keysToRemove.forEach((key) => {
            window.localStorage.removeItem(key);
          });

          if (keysToRemove.length > 0) {
            logger.debug(
              `Cleaned ${keysToRemove.length} orphaned unfinished inputs`,
            );
          }
        } catch (e) {
          logger.error("Failed to clean orphaned unfinished inputs:", e);
        }
      },

      // 助手分组相关方法
      selectMask(maskId: string) {
        set({ currentMaskId: maskId });
      },

      getSessionsByMask(maskId: string) {
        const state = get();
        return state.sessions.filter((session) => session.mask.id === maskId);
      },

      getCurrentMaskSessions() {
        const state = get();
        if (!state.currentMaskId) return state.sessions;
        return state.sessions.filter(
          (session) => session.mask.id === state.currentMaskId,
        );
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession(mask?: Mask) {
        const session = createEmptySession();

        if (mask) {
          const newMask = { ...mask };

          if (mask.id === DEFAULT_MASK_ID) {
            // 默认助手：新建会话时始终使用当前全局配置，后续仅在对话设置中修改后才使用自定义配置
            const globalConfig = useAppConfig.getState().modelConfig;
            newMask.modelConfig = {
              ...globalConfig,
            };
            newMask.syncGlobalConfig = true;
          } else {
            // 非默认助手：使用助手自己的配置
            newMask.modelConfig = { ...mask.modelConfig };
            if (mask.defaultModel) {
              const sessionModelConfig = getSessionModelConfig(mask);
              newMask.modelConfig.model = sessionModelConfig.model;
              newMask.modelConfig.providerName =
                sessionModelConfig.providerName;
            } else {
              const sessionModelConfig = getSessionModelConfig(mask);
              newMask.modelConfig.model = sessionModelConfig.model;
              newMask.modelConfig.providerName =
                sessionModelConfig.providerName;
            }
            newMask.syncGlobalConfig = false;
          }

          newMask.modelConfig = applyModelThinkingDefault(
            newMask.modelConfig,
          );
          session.mask = newMask;
        }

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      togglePinSession(index: number) {
        set((state) => {
          const sessions = [...state.sessions];
          const session = sessions[index];
          if (session) {
            session.pinned = !session.pinned;
          }
          return { sessions };
        });
      },

      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        // 如果对话被钉选，不允许删除
        if (deletedSession.pinned) {
          showToast(Locale.Home.DeletePinnedChat);
          return;
        }

        // 中止该会话的所有进行中的网络请求
        ChatControllerPool.stopAllInSession(deletedSession.id);

        // 清理该会话的所有控制器（包括已完成和已中止的），防止内存泄漏
        ChatControllerPool.cleanupSessionControllers(deletedSession.id);

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = 0;
          sessions.push(createEmptySession());
        }

        // 清理该会话的未完成输入
        try {
          localStorage.removeItem(UNFINISHED_INPUT(deletedSession.id));
        } catch (e) {
          logger.error("Failed to remove unfinished input:", e);
        }

        // for undo delete action
        const restoreState = {
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          currentSessionIndex: nextIndex,
          sessions,
        }));

        showToast(
          Locale.Home.DeleteToast,
          {
            text: Locale.Home.Revert,
            onClick() {
              set(() => restoreState);
            },
          },
          5000,
        );
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message: ChatMessage, targetSession: ChatSession) {
        get().updateTargetSession(targetSession, (session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });

        get().updateStat(message, targetSession);

        get().checkMcpJson(message);

        // 压缩统一由 onUserInput 在发送用户消息前处理，以确保压缩消息始终出现在用户消息之前。
        // 此处只做自动标题生成，不触发压缩（forceCompress=false 且不走到压缩分支）。
        const latestSession =
          get().sessions.find((s) => s.id === targetSession.id) ??
          targetSession;
        get().summarizeSessionTitleOnly(latestSession);

        // 触发自动同步（如果启用）
        import("./sync")
          .then(({ useSyncStore }) => {
            const syncStore = useSyncStore.getState();
            if (syncStore.autoSyncChat && syncStore.cloudSync()) {
              // 使用防抖，避免频繁同步
              if ((window as any).__syncDebounceTimer) {
                clearTimeout((window as any).__syncDebounceTimer);
              }
              (window as any).__syncDebounceTimer = setTimeout(() => {
                syncStore.autoSync().catch((e: any) => {
                  logger.error("[AutoSync] Failed:", e);
                });
              }, 3000); // 3秒防抖
            }
          })
          .catch((e) => {
            logger.error("[AutoSync] Load sync store failed:", e);
          });
      },

      async onUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
      ) {
        // 记录 sessionId，后续每步都从 store 取最新 session，避免旧快照问题
        const sessionId = get().currentSession().id;

        // 检查是否为多模型模式
        {
          const s = get().sessions.find((s) => s.id === sessionId)!;
          if (
            s.multiModelMode?.enabled &&
            s.multiModelMode.selectedModels.length > 1
          ) {
            return get().onMultiModelUserInput(
              content,
              attachImages,
              isMcpResponse,
            );
          }
        }

        const modelConfig = get().sessions.find((s) => s.id === sessionId)!.mask
          .modelConfig;

        // MCP Response no need to fill template
        let mContent: string | MultimodalContent[] = isMcpResponse
          ? content
          : fillTemplateWith(content, modelConfig);

        if (!isMcpResponse && attachImages && attachImages.length > 0) {
          mContent = [
            { type: "text" as const, text: content },
            ...attachImages.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ];
        }

        // ── 串行第一步：压缩（如需要），await 等待压缩完成后才继续 ────────────
        if (modelConfig.sendMemory && !isMcpResponse) {
          // 每次都从 store 取最新 session，保证 messages 是最新的
          const freshSession = get().sessions.find((s) => s.id === sessionId)!;
          await get().summarizeSession(false, freshSession, false);
        }

        // ── 串行第二步：压缩完成后，取最新 session 写入用户消息并发请求 ──
        const session = get().sessions.find((s) => s.id === sessionId)!;

        const userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
          isMcpResponse,
        });

        // 读取模型的流式配置，默认为 true（流式）
        const shouldStream = getModelStreamConfig(modelConfig.model);

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model,
          modelKey: `${modelConfig.model}@${modelConfig.providerName}`,
        });

        // get recent messages
        const recentMessages = await get().getMessagesWithMemory();
        const sendMessages = recentMessages.concat(userMessage);
        const messageIndex = session.messages.length + 1;

        // save user's and bot's message
        get().updateTargetSession(session, (session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });

        const api: ClientApi = getClientApi(
          modelConfig.providerName || "OpenAI",
        );

        const mcpTools = await get().getMcpTools();
        const accessState = useAccessStore.getState();
        const responseStateful = isResponseStatefulEnabled(
          modelConfig.providerName,
          accessState,
        );
        const previousResponseId = responseStateful
          ? session.responseApiConversationId
          : undefined;

        // make request
        api.llm.chat({
          messages: sendMessages,
          config: { ...modelConfig, stream: shouldStream },
          tools: mcpTools.length > 0 ? mcpTools : undefined,
          previousResponseId,
          sessionId: session.id,
          onUpdate(message) {
            // 只有在流式模式下才更新 streaming 状态
            if (shouldStream) {
              botMessage.streaming = true;
            }
            if (message) {
              botMessage.content = message;
              // 使用流式优化器进行批量更新，减少存储频率
              streamOptimizer.updateStreamingMessage(
                session.id,
                botMessage.id,
                message,
                session,
              );
            }
          },
          async onFinish(message, responseRes) {
            // 立即刷新任何待处理的更新
            streamOptimizer.flushUpdates();

            // 收集调试信息
            const reqDebug = (responseRes as any)?.__requestDebug;
            const isResponseApiRequest = isResponseApiDebugRequest(reqDebug);
            const respHeaders: Record<string, string> = {};
            try {
              responseRes?.headers?.forEach?.((v, k) => {
                respHeaders[k] = v as any;
              });
            } catch {}

            // 处理 Response API 会话 ID
            let responseApiConversationId: string | undefined;
            try {
              responseApiConversationId = extractResponseApiConversationId(
                responseRes,
                isResponseApiRequest,
              );
              logger.debug(
                "[Response API] Extracted conversation ID:",
                responseApiConversationId,
              );
            } catch (e) {
              logger.warn(
                "[Response API] Failed to extract conversation ID:",
                e,
              );
            }

            get().updateTargetSession(session, (session) => {
              if (!isResponseApiRequest && session.responseApiConversationId) {
                session.responseApiConversationId = undefined;
              }

              const messageIndex = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );

              const shouldPersistResponseId =
                isResponseApiRequest &&
                responseStateful &&
                !!responseApiConversationId;

              if (!responseStateful && session.responseApiConversationId) {
                session.responseApiConversationId = undefined;
              }

              // 保存 Response API 会话 ID（仅有状态模式）
              if (shouldPersistResponseId) {
                if (!session.responseApiConversationId) {
                  session.responseApiConversationId = responseApiConversationId;
                  logger.debug(
                    "[Response API] Saved conversation ID to session:",
                    responseApiConversationId,
                  );
                } else if (
                  session.responseApiConversationId !==
                  responseApiConversationId
                ) {
                  // 如果会话 ID 发生变化，更新它（虽然这种情况不应该发生）
                  logger.warn(
                    "[Response API] Conversation ID changed from",
                    session.responseApiConversationId,
                    "to",
                    responseApiConversationId,
                  );
                  session.responseApiConversationId = responseApiConversationId;
                } else {
                  logger.debug(
                    "[Response API] Session already has conversation ID:",
                    session.responseApiConversationId,
                  );
                }
              } else if (responseStateful) {
                logger.debug(
                  "[Response API] No conversation ID found in response",
                );
              }

              if (messageIndex > -1) {
                const piMetadata = extractPiResponseMetadata(responseRes);
                const finalBotMessage = {
                  ...session.messages[messageIndex],
                  streaming: false,
                  content: message,
                  contentBlocks: piMetadata?.content,
                  stopReason: piMetadata?.stopReason,
                  usage: piMetadata?.usage,
                  piApi: piMetadata?.api,
                  piProvider: piMetadata?.provider,
                  piModel: piMetadata?.model,
                  date: new Date().toLocaleString(),
                  debug: {
                    request: reqDebug,
                    response: {
                      status: responseRes?.status,
                      headers: respHeaders,
                      body: (responseRes as any)?.__responseBody ?? message,
                    },
                  },
                } as ChatMessage;

                session.messages[messageIndex] = finalBotMessage;
                get().onNewMessage(finalBotMessage, session);
              }
            });

            // 标记控制器为完成状态
            ChatControllerPool.markCompleted(session.id, botMessage.id);
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onBeforeTool(tool: ChatMessageTool) {
            // 将工具追加到当前会话消息中（而不是只修改局部引用），避免被后续流式内容覆盖
            const toolWithOffset = {
              ...tool,
              contentOffset: getMessageTextContent(botMessage).length,
            };
            get().updateTargetSession(session, (session) => {
              const messageIndex = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );
              if (messageIndex >= 0) {
                const current = session.messages[messageIndex];
                const newTools = [...(current.tools || []), toolWithOffset];
                const updated = { ...current, tools: newTools } as any;
                session.messages[messageIndex] = updated;
                // 同步本地引用，保证后续 onAfterTool 能正确更新
                botMessage.tools = newTools;
              } else {
                // 兜底：如果未找到，仍然写入本地引用并触发一次刷新
                (botMessage.tools = botMessage?.tools || []).push(
                  toolWithOffset,
                );
              }
            });
          },
          onAfterTool(tool: ChatMessageTool) {
            // 更新工具执行状态到会话消息中
            get().updateTargetSession(session, (session) => {
              const messageIndex = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );
              if (messageIndex >= 0) {
                const current = session.messages[messageIndex] as any;
                const tools = [...(current.tools || [])];
                const idx = tools.findIndex((t) => t.id === tool.id);
                if (idx >= 0) {
                  tools[idx] = {
                    ...tools[idx],
                    ...tool,
                    contentOffset:
                      tools[idx].contentOffset ??
                      tool.contentOffset ??
                      getMessageTextContent(botMessage).length,
                  } as any;
                } else {
                  tools.push({
                    ...tool,
                    contentOffset:
                      tool.contentOffset ??
                      getMessageTextContent(botMessage).length,
                  } as any);
                }
                const updated = { ...current, tools };
                session.messages[messageIndex] = updated as any;
                // 同步本地引用
                botMessage.tools = tools as any;
              } else if (botMessage?.tools) {
                botMessage.tools = botMessage.tools.map((t) =>
                  t.id === tool.id ? ({ ...tool } as any) : t,
                );
              }
            });
            // 工具完成时使用优化更新（保持现有行为）
            streamOptimizer.updateStreamingMessage(
              session.id,
              botMessage.id,
              getMessageTextContent(botMessage),
              session,
            );
          },
          onError(error) {
            const isAborted = error.message?.includes?.("aborted");
            const isOverflow =
              !isAborted && isLikelyContextOverflowError(error);
            const errorText = formatChatErrorCodeBlock(
              isOverflow
                ? `${error.message}\n\n检测到上下文超限，已触发自动上下文压缩。请重试。`
                : error.message,
            );
            botMessage.content = botMessage.content
              ? `${botMessage.content}\n\n${errorText}`
              : errorText;
            botMessage.streaming = false;
            botMessage.debug = (error as any).debug;
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateTargetSession(session, (session) => {
              const messageIndex = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );
              if (messageIndex >= 0) {
                session.messages[messageIndex] = { ...botMessage };
              }
              const userMessageIndex = session.messages.findIndex(
                (m) => m.id === userMessage.id,
              );
              if (userMessageIndex >= 0) {
                session.messages[userMessageIndex] = {
                  ...session.messages[userMessageIndex],
                  isError: !isAborted,
                };
              }
              session.messages = session.messages.concat();
            });

            if (isOverflow) {
              void get()
                .summarizeSession(false, session, true)
                .catch((e) =>
                  logger.warn(
                    "[Chat] Auto compaction after overflow failed:",
                    e,
                  ),
                );
            }

            // 标记控制器状态并清理
            if (!isAborted) {
              ChatControllerPool.markCompleted(
                session.id,
                botMessage.id ?? messageIndex,
              );
            }
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      async onMultiModelUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
      ) {
        const session = get().currentSession();
        const multiModelMode = session.multiModelMode!;

        // 准备用户消息内容
        let mContent: string | MultimodalContent[] = isMcpResponse
          ? content
          : fillTemplateWith(content, session.mask.modelConfig);

        if (!isMcpResponse && attachImages && attachImages.length > 0) {
          mContent = [
            { type: "text" as const, text: content },
            ...attachImages.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ];
        }

        // 创建用户消息
        const userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
          isMcpResponse,
          isMultiModel: true,
        });

        // 多模型也保持"发送前压缩"：先让 summarizeSession 判断是否需要压缩
        if (session.mask.modelConfig.sendMemory) {
          await get().summarizeSession(false, session, false);
        }

        // 为每个选中的模型创建独立的 bot 消息
        const botMessages: Record<string, ChatMessage> = {};
        const modelConfigs: Record<string, any> = {};

        for (const modelKey of multiModelMode.selectedModels) {
          const [modelName, providerId] = modelKey.split("@");

          // 创建该模型的配置
          const modelConfig = {
            ...session.mask.modelConfig,
            model: modelName as ModelType,
            providerName: providerId as string,
          };
          modelConfigs[modelKey] = modelConfig;

          // 创建该模型的 bot 消息
          botMessages[modelKey] = createMessage({
            role: "assistant",
            streaming: true,
            model: modelName as ModelType,
            modelKey,
            isMultiModel: true,
          });
        }

        // 保存用户消息和所有 bot 消息到主消息列表
        get().updateTargetSession(session, (session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };

          // 添加用户消息
          session.messages.push(savedUserMessage);

          // 添加所有模型的 bot 消息
          Object.values(botMessages).forEach((botMessage) => {
            session.messages.push(botMessage);
          });
        });

        // 为每个模型发送请求，使用独立的错误处理
        let autoCompactionTriggered = false;
        const triggerAutoCompactionOnce = (modelKey: string) => {
          if (autoCompactionTriggered) return;
          autoCompactionTriggered = true;
          logger.warn(
            `[MultiModel] Context overflow detected on ${modelKey}, triggering auto compaction`,
          );
          void get()
            .summarizeSession(false, session, true)
            .catch((e) =>
              logger.warn(
                "[MultiModel] Auto compaction after overflow failed:",
                e,
              ),
            );
        };

        const promises = multiModelMode.selectedModels.map(async (modelKey) => {
          const modelConfig = modelConfigs[modelKey];
          const botMessage = botMessages[modelKey];

          // 获取该模型的独立消息历史
          const modelMessages = multiModelMode.modelMessages[modelKey] || [];

          // 关键修复：检查当前模型是否支持视觉，如果不支持则移除图片内容
          let processedUserMessage = userMessage;
          if (
            attachImages &&
            attachImages.length > 0 &&
            !isVisionModel(modelConfig.model)
          ) {
            // 模型不支持视觉，需要创建纯文本版本的用户消息
            processedUserMessage = {
              ...userMessage,
              content: content, // 只保留文本内容
            };
          }

          const recentMessages = [...modelMessages, processedUserMessage];

          // 更新该模型的消息历史
          multiModelMode.modelMessages[modelKey] = recentMessages;

          const api: ClientApi = getClientApi(
            modelConfig.providerName || "OpenAI",
          );

          const mcpTools = await get().getMcpTools();
          const accessState = useAccessStore.getState();
          const responseStateful = isResponseStatefulEnabled(
            modelConfig.providerName,
            accessState,
          );
          const previousResponseId = responseStateful
            ? multiModelMode.modelResponseApiConversationIds?.[modelKey]
            : undefined;

          // 读取模型的流式配置，默认为 true（流式）
          const shouldStream = getModelStreamConfig(modelConfig.model);

          try {
            return await api.llm.chat({
              messages: recentMessages,
              config: { ...modelConfig, stream: shouldStream },
              tools: mcpTools.length > 0 ? mcpTools : undefined,
              previousResponseId,
              sessionId: `${session.id}:${modelKey}`,
              onUpdate(message) {
                botMessage.streaming = true;
                if (message) {
                  botMessage.content = message;
                  // 优化：多模型模式下使用更智能的更新策略
                  streamOptimizer.updateStreamingMessage(
                    session.id,
                    botMessage.id,
                    message,
                    session,
                  );
                  // 优化：减少立即刷新的频率，使用批量更新
                  if (message.length > 0 && message.length % 200 < 50) {
                    streamOptimizer.flushUpdates();
                  }
                }
              },
              async onFinish(message, responseRes) {
                // 立即刷新待处理的更新
                streamOptimizer.flushUpdates();

                // 关键修复：确保消息状态正确更新
                botMessage.streaming = false;
                const reqDebug = (responseRes as any)?.__requestDebug;
                const isResponseApiRequest =
                  isResponseApiDebugRequest(reqDebug);
                let responseApiConversationId: string | undefined;
                try {
                  responseApiConversationId = extractResponseApiConversationId(
                    responseRes,
                    isResponseApiRequest,
                  );
                  logger.debug(
                    "[Response API] Extracted conversation ID:",
                    responseApiConversationId,
                  );
                } catch (e) {
                  logger.warn(
                    "[Response API] Failed to extract conversation ID:",
                    e,
                  );
                }

                if (responseApiConversationId && responseStateful) {
                  const responseId = responseApiConversationId;
                  get().updateTargetSession(session, (session) => {
                    const multiModelMode = session.multiModelMode;
                    if (!multiModelMode) {
                      return;
                    }
                    if (!multiModelMode.modelResponseApiConversationIds) {
                      multiModelMode.modelResponseApiConversationIds = {};
                    }
                    multiModelMode.modelResponseApiConversationIds[modelKey] =
                      responseId;
                  });
                } else if (!responseStateful) {
                  get().updateTargetSession(session, (session) => {
                    const multiModelMode = session.multiModelMode;
                    if (!multiModelMode?.modelResponseApiConversationIds) {
                      return;
                    }
                    delete multiModelMode.modelResponseApiConversationIds[
                      modelKey
                    ];
                  });
                }

                if (message) {
                  const piMetadata = extractPiResponseMetadata(responseRes);
                  botMessage.content = message;
                  botMessage.contentBlocks = piMetadata?.content;
                  botMessage.stopReason = piMetadata?.stopReason;
                  botMessage.usage = piMetadata?.usage;
                  botMessage.piApi = piMetadata?.api;
                  botMessage.piProvider = piMetadata?.provider;
                  botMessage.piModel = piMetadata?.model;
                  botMessage.date = new Date().toLocaleString();

                  // 调试信息
                  const reqDebug = (responseRes as any)?.__requestDebug;
                  const respHeaders: Record<string, string> = {};
                  try {
                    responseRes?.headers?.forEach?.((v, k) => {
                      respHeaders[k] = v as any;
                    });
                  } catch {}
                  botMessage.debug = {
                    request: reqDebug,
                    response: {
                      status: responseRes?.status,
                      headers: respHeaders,
                      body: (responseRes as any)?.__responseBody ?? message,
                    },
                  };

                  // 更新该模型的独立消息历史
                  multiModelMode.modelMessages[modelKey].push(botMessage);

                  // 关键修复：确保消息状态正确反映在会话中
                  get().updateTargetSession(session, (session) => {
                    const messageIndex = session.messages.findIndex(
                      (m) => m.id === botMessage.id,
                    );
                    if (messageIndex >= 0) {
                      session.messages[messageIndex] = { ...botMessage };
                    }
                  });

                  get().onNewMessage(botMessage, session);
                }

                // 标记控制器为完成状态
                ChatControllerPool.markCompleted(session.id, botMessage.id);
                ChatControllerPool.remove(session.id, botMessage.id);
              },
              onBeforeTool(tool: ChatMessageTool) {
                // 多模型下：将工具追加到会话中的对应消息，避免被后续流式更新覆盖
                get().updateTargetSession(session, (session) => {
                  const messageIndex = session.messages.findIndex(
                    (m) => m.id === botMessage.id,
                  );
                  if (messageIndex >= 0) {
                    const current = session.messages[messageIndex] as any;
                    const newTools = [...(current.tools || []), tool];
                    session.messages[messageIndex] = {
                      ...current,
                      tools: newTools,
                    } as any;
                    botMessage.tools = newTools;
                  } else {
                    (botMessage.tools = botMessage?.tools || []).push(tool);
                  }
                });
                // 多模型工具调用也使用优化更新
                streamOptimizer.updateStreamingMessage(
                  session.id,
                  botMessage.id,
                  getMessageTextContent(botMessage),
                  session,
                );
              },
              onError(error) {
                // 为每个模型提供独立的错误处理
                logger.error(`[MultiModel] Model ${modelKey} error:`, error);

                // 检查是否是用户主动中止的错误
                const isAborted =
                  error.message?.includes?.("aborted") ||
                  error.message?.includes?.("AbortError");
                const isOverflow =
                  !isAborted && isLikelyContextOverflowError(error);

                // 只有在非中止错误时才更新消息内容
                if (!isAborted) {
                  // 确保消息状态正确更新
                  botMessage.streaming = false;
                  botMessage.isError = true;
                  botMessage.content = formatChatErrorCodeBlock(
                    isOverflow
                      ? `模型 ${modelKey} 响应出错: ${error.message}\n\n检测到上下文超限，已触发自动上下文压缩。请重试。`
                      : `模型 ${modelKey} 响应出错: ${error.message}`,
                  );

                  // 立即刷新更新
                  streamOptimizer.flushUpdates();

                  // 更新会话状态
                  get().updateTargetSession(session, (session) => {
                    const messageIndex = session.messages.findIndex(
                      (m) => m.id === botMessage.id,
                    );
                    if (messageIndex >= 0) {
                      session.messages[messageIndex] = { ...botMessage };
                    }
                  });

                  // 标记为完成（虽然有错误）
                  ChatControllerPool.markCompleted(session.id, botMessage.id);
                }

                if (isOverflow) {
                  triggerAutoCompactionOnce(modelKey);
                }

                ChatControllerPool.remove(session.id, botMessage.id);

                // 继续让其他模型运行，不抛出错误
                return null;
              },
              onController(controller) {
                ChatControllerPool.addController(
                  session.id,
                  botMessage.id ?? session.messages.length,
                  controller,
                );
              },
            });
          } catch (error) {
            logger.error(
              `[MultiModel] Model ${modelKey} request failed:`,
              error,
            );
            const normalizedError =
              error instanceof Error ? error : new Error(String(error));
            const isOverflow = isLikelyContextOverflowError(normalizedError);

            // 确保消息状态正确更新
            botMessage.streaming = false;
            botMessage.isError = true;
            botMessage.content = formatChatErrorCodeBlock(
              isOverflow
                ? `模型 ${modelKey} 请求失败: ${normalizedError.message}\n\n检测到上下文超限，已触发自动上下文压缩。请重试。`
                : `模型 ${modelKey} 请求失败: ${normalizedError.message}`,
            );

            // 立即刷新更新
            streamOptimizer.flushUpdates();

            // 标记为完成（虽然有错误）
            ChatControllerPool.markCompleted(session.id, botMessage.id);

            // 更新会话状态
            get().updateTargetSession(session, (session) => {
              const messageIndex = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );
              if (messageIndex >= 0) {
                session.messages[messageIndex] = { ...botMessage };
              }
            });

            ChatControllerPool.remove(session.id, botMessage.id);

            if (isOverflow) {
              triggerAutoCompactionOnce(modelKey);
            }

            // 继续让其他模型运行，不抛出错误
            return null;
          }
        });

        // 等待所有模型完成响应，但不中断其他模型的执行
        const results = await Promise.allSettled(promises);

        // 记录完成的模型数量
        const completedModels = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failedModels = results.filter(
          (r) => r.status === "rejected",
        ).length;

        if (completedModels === 0 && failedModels > 0) {
          // 如果所有模型都失败了，显示错误提示
          showToast(`多模型对话失败，${failedModels}个模型响应出错`);
        } else if (failedModels > 0) {
          // 部分模型失败，显示警告
          logger.warn(
            `[MultiModel] ${failedModels}个模型响应出错，${completedModels}个模型正常完成`,
          );
        }
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        if (session.memoryPrompt.length) {
          return {
            role: "assistant",
            content: Locale.Store.Prompt.History(session.memoryPrompt),
            date: "",
          } as ChatMessage;
        }
      },

      async getMcpTools() {
        const session = get().currentSession();
        if (!session.mcpEnabled) return [];

        const { getMcpConfigFromFile, getMcpToolsForFunctionCall } =
          await import("../mcp/actions.client");
        const config = await getMcpConfigFromFile();
        return config.callMode === "function_call"
          ? await getMcpToolsForFunctionCall()
          : [];
      },

      async getMessagesWithMemory() {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig.enableInjectSystemPrompts &&
          (session.mask.modelConfig.model.startsWith("gpt-") ||
            session.mask.modelConfig.model.startsWith("chatgpt-"));

        const mcpSystemPrompt = await getMcpSystemPrompt(
          session.mcpEnabled ?? false,
          session.mcpEnabledClients,
        );
        var systemPrompts: ChatMessage[] = [];

        if (shouldInjectSystemPrompts) {
          systemPrompts = [
            createMessage({
              role: "system",
              content:
                fillTemplateWith("", {
                  ...modelConfig,
                  template: DEFAULT_SYSTEM_TEMPLATE,
                }) + mcpSystemPrompt,
            }),
          ];
        } else if (mcpSystemPrompt) {
          systemPrompts = [
            createMessage({ role: "system", content: mcpSystemPrompt }),
          ];
        }

        if (shouldInjectSystemPrompts || mcpSystemPrompt) {
          logger.debug(
            "[Global System Prompt] ",
            systemPrompts.at(0)?.content ?? "empty",
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        // long term memory
        const shouldSendLongTermMemory =
          modelConfig.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts =
          shouldSendLongTermMemory && memoryPrompt ? [memoryPrompt] : [];
        const longTermMemoryStartIndex = session.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(
          getActiveContextStartIndex(session),
          memoryStartIndex,
        );
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError || msg.isCompressedContextPrompt) continue;
          // 使用不包含思考内容的版本来计算Token数量
          tokenCount += estimateTokenLength(
            getMessageTextContentWithoutThinking(msg),
          );

          // 创建不包含思考内容的消息副本用于发送
          const msgToSend = { ...msg };
          if (msg.role === "assistant") {
            // 对于助手消息，移除思考内容
            if (typeof msg.content === "string") {
              msgToSend.content = getMessageTextContentWithoutThinking(msg);
            } else if (Array.isArray(msg.content)) {
              msgToSend.content = msg.content.map((c) => {
                if (c.type === "text") {
                  return {
                    ...c,
                    text: c.text ? removeThinkingContent(c.text) : "",
                  };
                }
                return c;
              });
            }
          }
          reversedRecentMessages.push(msgToSend);
        }
        // concat all messages
        const normalizedRecentMessages = reversedRecentMessages.reverse();
        // 防止异常情况下把“没有前置 user 的 assistant 历史”发给模型
        while (
          normalizedRecentMessages.length > 0 &&
          normalizedRecentMessages[0]?.role === "assistant"
        ) {
          normalizedRecentMessages.shift();
        }
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...normalizedRecentMessages,
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession(session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.messages = [];
          session.memoryPrompt = "";
          session.clearContextIndex = undefined;
          session.compressedContextIndex = undefined;
          session.compressingContextIndex = undefined;
          session.lastSummarizeIndex = 0;
          session.responseApiConversationId = undefined;
          session.isAutoTopic = true;
          session.lastAutoTopicIndex = 0;
          session.topic = DEFAULT_TOPIC;
          if (session.multiModelMode) {
            session.multiModelMode.modelMessages = {};
            session.multiModelMode.modelStats = {};
            session.multiModelMode.modelMemoryPrompts = {};
            session.multiModelMode.modelSummarizeIndexes = {};
            session.multiModelMode.modelResponseApiConversationIds = {};
          }
        });
      },

      /** 仅触发自动标题生成，不做压缩。供 onNewMessage 调用，避免压缩消息出现在用户消息后面。 */
      summarizeSessionTitleOnly(targetSession: ChatSession) {
        const config = useAppConfig.getState();
        const session = targetSession;
        const modelConfig = session.mask.modelConfig;

        if (isDalle3(modelConfig.model)) return;

        const titleMinUserTokens =
          modelConfig.autoTitleMinUserTokens ??
          DEFAULT_AUTO_TITLE_MIN_USER_TOKENS;
        const titleMinUserMessages =
          modelConfig.autoTitleMinUserMessages ??
          DEFAULT_AUTO_TITLE_MIN_USER_MESSAGES;
        const titleRefreshInterval =
          modelConfig.autoTitleRefreshInterval ??
          DEFAULT_AUTO_TITLE_REFRESH_INTERVAL;
        const lastAutoTopicIndex = session.lastAutoTopicIndex ?? 0;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages;
        const effectiveMessages = messages.slice(clearContextIndex);
        const effectiveUserTokens = countUserTokens(effectiveMessages);
        const effectiveUserMessages = countUserMessages(effectiveMessages);
        const messagesSinceLastTitle = messages.slice(
          Math.min(lastAutoTopicIndex, messages.length),
        );
        const userMessagesSinceLastTitle = countUserMessages(
          messagesSinceLastTitle,
        );
        const isInitialTitle =
          session.topic === DEFAULT_TOPIC || lastAutoTopicIndex === 0;
        const shouldAutoGenerateTitle =
          config.enableAutoGenerateTitle &&
          (session.isAutoTopic ?? session.topic === DEFAULT_TOPIC);
        const shouldUpdateTitle =
          shouldAutoGenerateTitle &&
          effectiveUserTokens >= titleMinUserTokens &&
          effectiveUserMessages >= titleMinUserMessages &&
          (isInitialTitle ||
            userMessagesSinceLastTitle >= titleRefreshInterval);

        if (!shouldUpdateTitle) return;

        const globalConfig = useAppConfig.getState().modelConfig;
        const topicModelConfig = getSessionTopicModelConfig(session.mask);
        const topicApi: ClientApi = getClientApi(
          topicModelConfig.providerName as string,
        );
        const startIndex = Math.max(
          clearContextIndex,
          messages.length - modelConfig.historyMessageCount,
        );
        const topicSourceMessages = messages
          .slice(
            startIndex < messages.length ? startIndex : messages.length - 1,
            messages.length,
          )
          .filter((msg) => !msg.isError);
        const topicPrompt =
          modelConfig.topicPrompt ||
          globalConfig.topicPrompt ||
          Locale.Store.Prompt.Topic;
        topicApi.llm.chat({
          messages: buildTopicRequestMessages(topicPrompt, topicSourceMessages),
          config: {
            model: topicModelConfig.model,
            max_tokens: TITLE_MAX_OUTPUT_TOKENS,
            stream: false,
            providerName: topicModelConfig.providerName,
          },
          disableResponseStateful: true,
          onFinish(message, responseRes) {
            if (responseRes?.status === 200) {
              const filteredMessage = removeThinkingContent(message);
              get().updateTargetSession(session, (s) => {
                s.topic =
                  filteredMessage.length > 0
                    ? trimTopic(filteredMessage)
                    : DEFAULT_TOPIC;
                s.isAutoTopic = true;
                s.lastAutoTopicIndex = messages.length;
              });
            }
          },
        });
      },

      async summarizeSession(
        refreshTitle: boolean = false,
        targetSession: ChatSession,
        forceCompress: boolean = false,
      ): Promise<boolean> {
        const config = useAppConfig.getState();
        const session = targetSession;
        const modelConfig = session.mask.modelConfig;

        // skip summarize when using dalle3?
        if (isDalle3(modelConfig.model)) {
          return false;
        }

        // 使用摘要模型决策系统
        const compressDecision = getMaskCompressModel(session.mask);
        let model: string, providerName: string;

        if (compressDecision.model) {
          // 如果有明确的摘要模型配置，使用它
          model = compressDecision.model;
          providerName = compressDecision.providerName;
        } else {
          // 即使没有设置摘要模型，也要确保使用全局配置
          const sessionCompressConfig = getSessionCompressModelConfig(
            session.mask,
          );
          model = sessionCompressConfig.model;
          providerName = sessionCompressConfig.providerName;
        }

        const api: ClientApi = getClientApi(providerName as string);

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const titleMinUserTokens =
          modelConfig.autoTitleMinUserTokens ??
          DEFAULT_AUTO_TITLE_MIN_USER_TOKENS;
        const titleMinUserMessages =
          modelConfig.autoTitleMinUserMessages ??
          DEFAULT_AUTO_TITLE_MIN_USER_MESSAGES;
        const titleRefreshInterval =
          modelConfig.autoTitleRefreshInterval ??
          DEFAULT_AUTO_TITLE_REFRESH_INTERVAL;
        const lastAutoTopicIndex = session.lastAutoTopicIndex ?? 0;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const effectiveMessages = messages.slice(clearContextIndex);
        const effectiveUserTokens = countUserTokens(effectiveMessages);
        const effectiveUserMessages = countUserMessages(effectiveMessages);
        const messagesSinceLastTitle = messages.slice(
          Math.min(lastAutoTopicIndex, messages.length),
        );
        const userMessagesSinceLastTitle = countUserMessages(
          messagesSinceLastTitle,
        );
        const isInitialTitle =
          session.topic === DEFAULT_TOPIC || lastAutoTopicIndex === 0;
        const shouldAutoGenerateTitle =
          config.enableAutoGenerateTitle &&
          (session.isAutoTopic ?? session.topic === DEFAULT_TOPIC);
        const shouldUpdateTitle =
          refreshTitle ||
          (shouldAutoGenerateTitle &&
            effectiveUserTokens >= titleMinUserTokens &&
            effectiveUserMessages >= titleMinUserMessages &&
            (isInitialTitle ||
              userMessagesSinceLastTitle >= titleRefreshInterval));

        if (shouldUpdateTitle) {
          const globalConfig = useAppConfig.getState().modelConfig;
          const topicModelConfig = getSessionTopicModelConfig(session.mask);
          const topicApi: ClientApi = getClientApi(
            topicModelConfig.providerName as string,
          );
          const startIndex = Math.max(
            clearContextIndex,
            messages.length - modelConfig.historyMessageCount,
          );
          const topicSourceMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .filter((msg) => !msg.isError);
          const topicPrompt =
            modelConfig.topicPrompt ||
            globalConfig.topicPrompt ||
            Locale.Store.Prompt.Topic;
          topicApi.llm.chat({
            messages: buildTopicRequestMessages(
              topicPrompt,
              topicSourceMessages,
            ),
            config: {
              model: topicModelConfig.model,
              max_tokens: TITLE_MAX_OUTPUT_TOKENS,
              stream: false,
              providerName: topicModelConfig.providerName,
            },
            disableResponseStateful: true,
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                // 使用通用的移除思考内容函数，与优化提示词保持一致
                const filteredMessage = removeThinkingContent(message);
                get().updateTargetSession(session, (session) => {
                  session.topic =
                    filteredMessage.length > 0
                      ? trimTopic(filteredMessage)
                      : DEFAULT_TOPIC;
                  session.isAutoTopic = true;
                  session.lastAutoTopicIndex = messages.length;
                });
              }
            },
          });
        }

        // 防止并发摘要：如果正在生成摘要，跳过
        if (session.isSummarizing) {
          logger.debug(
            "[Summarize] Already in progress for session:",
            session.id,
          );
          return false;
        }

        // 第二次及以后压缩：从「最后一条」压缩结果开始，只压缩「该摘要 + 后续消息」（保留历史压缩消息后可能有多条）
        const boundaryStartIndex = getCompactionBoundaryStartIndex(session);
        const lastSummarizeIndex = session.messages.length;

        // 先用完整未压缩边界统计压缩条件，之后再按 keepRecentTokens 切 summary slice
        const { userMessageCount } = collectSummaryInputs(
          messages,
          boundaryStartIndex,
          (msg) => getMessageTextContentWithoutThinking(msg).trim(),
          estimateTokenLength,
        );
        const summaryMinUserMessages =
          modelConfig.summaryMinUserMessages ??
          DEFAULT_SUMMARY_MIN_USER_MESSAGES;

        // 计算两个独立的压缩触发条件：
        // 1. 固定阈值：compressMessageLengthThreshold（用户手动设置的固定值）
        // 2. 动态阈值：基于模型上下文窗口 × compressThresholdRatio

        // 注意：这里不应该使用 getMessagesWithMemory()，因为它会根据 max_tokens 截断消息
        // 我们需要计算所有未压缩的历史消息的实际长度。
        const effectiveStartIndex = getActiveContextStartIndex(session);
        const uncompressedMessages = messages
          .slice(effectiveStartIndex)
          .filter((msg) => !msg.isError && !msg.isCompressedContextPrompt);
        const contextTokens = countMessages(uncompressedMessages);

        const fixedThreshold = modelConfig.compressMessageLengthThreshold;
        const compactionDecision = getCompactionPolicy().evaluate({
          contextTokens,
          fixedThreshold,
          model: modelConfig.model,
          ratio: modelConfig.compressThresholdRatio,
          userMessageCount,
          summaryMinUserMessages,
          sendMemory: modelConfig.sendMemory,
        });
        const {
          contextWindow,
          reserveTokens,
          keepRecentTokens,
          dynamicThreshold,
          reachedFixedThreshold,
          reachedDynamicThreshold,
          shouldCompress,
          approachingThreshold,
        } = compactionDecision;

        // 添加详细的调试日志
        logger.debug("[Summarize] Compression check:", {
          contextTokens,
          contextWindow,
          reserveTokens,
          keepRecentTokens,
          fixedThreshold,
          dynamicThreshold,
          reachedFixedThreshold,
          reachedDynamicThreshold,
          userMessageCount,
          summaryMinUserMessages,
          sendMemory: modelConfig.sendMemory,
          isSummarizing: session.isSummarizing,
          forceCompress,
          effectiveStartIndex,
          uncompressedMessagesCount: uncompressedMessages.length,
          shouldCompress,
        });

        if (!refreshTitle && approachingThreshold && !session.isSummarizing) {
          logger.debug(
            "[Summarize] Approaching threshold:",
            contextTokens,
            "/ fixed:",
            fixedThreshold,
            "/ dynamic:",
            dynamicThreshold,
          );
          // 可以在这里添加 UI 提示，但为了不干扰用户，暂时只记录日志
        }

        if (forceCompress || shouldCompress) {
          const compactionSlice = collectCompactionSlice(
            messages,
            boundaryStartIndex,
            keepRecentTokens,
            (msg: ChatMessage) =>
              getMessageTextContentWithoutThinking(msg).trim(),
          );
          const summaryStartIndex = compactionSlice.summaryStartIndex;
          logger.debug("[Summarize] Compaction slice:", {
            boundaryStartIndex,
            summaryStartIndex,
            firstKeptIndex: compactionSlice.firstKeptIndex,
            isSplitTurn: compactionSlice.isSplitTurn,
            turnStartIndex: compactionSlice.turnStartIndex,
          });

          const { userMessages, userTokens } = collectSummaryInputs(
            messages,
            summaryStartIndex,
            (msg: ChatMessage) =>
              getMessageTextContentWithoutThinking(msg).trim(),
            estimateTokenLength,
          );
          const summaryTokens = userTokens;

          /** Destruct max_tokens while summarizing
           * this param is just shit
           **/
          // 获取上下文压缩模板，优先级：会话配置 > 全局配置 > 默认模板
          const globalConfig = useAppConfig.getState().modelConfig;
          const compactionSystemPrompt =
            modelConfig.compactionSystemPrompt ||
            globalConfig.compactionSystemPrompt ||
            DEFAULT_COMPACTION_SYSTEM_PROMPT;
          const compactionInitialPrompt =
            modelConfig.compactionInitialPrompt ||
            globalConfig.compactionInitialPrompt ||
            DEFAULT_COMPACTION_INITIAL_PROMPT;
          const compactionUpdatePrompt =
            modelConfig.compactionUpdatePrompt ||
            globalConfig.compactionUpdatePrompt ||
            DEFAULT_COMPACTION_UPDATE_PROMPT;

          const {
            max_tokens,
            max_completion_tokens,
            maxCompletionTokens,
            ...modelcfg
          } = modelConfig as any;
          const summaryModelConfig = {
            ...modelcfg,
            max_tokens: SUMMARY_MAX_OUTPUT_TOKENS,
          };
          const forceUserMessages =
            forceCompress && !userMessages
              ? buildConversationTranscript(
                  messages.slice(summaryStartIndex),
                  false,
                )
              : userMessages;
          if (!forceUserMessages) {
            return false;
          }

          // 第二次及以后压缩：用「最后一条压缩结果的 assistant 消息」作为上下文
          const previousSummary = getPreviousSummaryText(
            session,
            getMessageTextContent,
          );

          // 设置摘要锁，防止并发。保留之前的压缩结果消息，只追加新占位条，便于用户看到每次压缩的横幅
          const compressedMessageId = nanoid();
          get().updateTargetSession(session, (s) => {
            s.isSummarizing = true;
            s.messages = s.messages.concat(
              createMessage({
                id: compressedMessageId,
                role: "assistant",
                content: "",
                streaming: true,
                isCompressedContextPrompt: true,
              }),
            );
            s.compressingContextIndex = s.messages.length - 1;
          });
          const summarizeInput = buildSummaryPrompt(
            forceUserMessages,
            {
              initialPrompt: compactionInitialPrompt,
              updatePrompt: compactionUpdatePrompt,
            },
            previousSummary,
          );
          const compactionContext = {
            session,
            compressedMessageId,
            summaryTokens,
            lastSummarizeIndex,
          };
          return await executeSummaryStream({
            api,
            systemPrompt: compactionSystemPrompt,
            summarizeInput,
            modelConfig: summaryModelConfig,
            model,
            providerName,
            sanitizeMessage: removeThinkingContent,
            onUpdate: (filteredMessage) => {
              get().updateTargetSession(compactionContext.session, (s) => {
                s.memoryPrompt = filteredMessage;
                const target = s.messages.find(
                  (m) => m.id === compactionContext.compressedMessageId,
                );
                if (target) {
                  target.content = filteredMessage;
                  target.streaming = true;
                }
              });
            },
            onSuccess: (filteredMessage, responseRes) => {
              const candidateSummary = (filteredMessage || "").trim();
              const candidateLength = estimateTokenLength(candidateSummary);
              const tooLong =
                !forceCompress &&
                summaryTokens > 0 &&
                candidateLength > summaryTokens * 0.8;
              const tooShort =
                !forceCompress && summaryTokens > 1000 && candidateLength < 50;
              const emptySummary = candidateSummary.length === 0;
              const guardTriggered = tooLong || tooShort || emptySummary;
              const hasPreviousSummary =
                !!previousSummary && previousSummary.trim().length > 0;
              const appliedSummary =
                guardTriggered && hasPreviousSummary
                  ? previousSummary!.trim()
                  : candidateSummary;
              const summaryLength = estimateTokenLength(appliedSummary);

              if (guardTriggered) {
                logger.warn("[Summarize] Quality guard triggered:", {
                  emptySummary,
                  tooShort,
                  tooLong,
                  candidateLength,
                  summaryTokens,
                  fallbackToPreviousSummary: hasPreviousSummary,
                });
              }

              const reqDebug = (responseRes as any)?.__requestDebug;
              const respHeaders: Record<string, string> = {};
              try {
                responseRes?.headers?.forEach?.((v, k) => {
                  respHeaders[k] = v as string;
                });
              } catch {
                /* ignore */
              }

              get().updateTargetSession(session, (s) => {
                s.mask.modelConfig.sendMemory = true;
                s.lastSummarizeIndex = compactionContext.lastSummarizeIndex;
                s.memoryPrompt = appliedSummary;
                if (
                  isResponseStatefulEnabled(
                    providerName,
                    useAccessStore.getState(),
                  )
                ) {
                  s.responseApiConversationId = undefined;
                }
                const target = s.messages.find(
                  (m) => m.id === compactionContext.compressedMessageId,
                );
                if (target) {
                  target.content = appliedSummary;
                  target.streaming = false;
                  target.isCompressedContextPrompt = true;
                  target.debug = {
                    request: reqDebug,
                    response: {
                      status: responseRes?.status,
                      headers: respHeaders,
                      body:
                        (responseRes as any)?.__responseBody ?? filteredMessage,
                    },
                  };
                  const summaryIndex = s.messages.findIndex(
                    (m) => m.id === compactionContext.compressedMessageId,
                  );
                  s.compressedContextIndex =
                    summaryIndex >= 0
                      ? summaryIndex
                      : Math.max(
                          s.compressedContextIndex ?? 0,
                          compactionContext.lastSummarizeIndex,
                        );
                } else {
                  s.compressedContextIndex = Math.max(
                    s.compressedContextIndex ?? 0,
                    compactionContext.lastSummarizeIndex,
                  );
                }
                s.isSummarizing = false;
                s.compressingContextIndex = undefined;
              });
              logger.debug(
                "[Summarize] Completed for session:",
                session.id,
                "summary length:",
                appliedSummary.length,
                "tokens:",
                summaryLength,
                "compression ratio:",
                (
                  (1 - summaryLength / compactionContext.summaryTokens) *
                  100
                ).toFixed(1) + "%",
              );
              return true;
            },
            onFailure: (status) => {
              get().updateTargetSession(session, (s) => {
                s.isSummarizing = false;
                s.compressingContextIndex = undefined;
                s.messages = s.messages.filter(
                  (m) => m.id !== compactionContext.compressedMessageId,
                );
              });
              logger.error("[Summarize] Failed with status:", status);
            },
            onError: (err) => {
              logger.error("[Summarize] Error:", err);
              get().updateTargetSession(session, (s) => {
                s.isSummarizing = false;
                s.compressingContextIndex = undefined;
                s.messages = s.messages.filter(
                  (m) => m.id !== compactionContext.compressedMessageId,
                );
              });
            },
          });
        }
        return false;
      },

      updateStat(message: ChatMessage, session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },
      updateTargetSession(
        targetSession: ChatSession,
        updater: (session: ChatSession) => void,
      ) {
        const sessions = get().sessions;
        const index = sessions.findIndex((s) => s.id === targetSession.id);
        if (index < 0) return;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },
      async clearAllData() {
        await indexedDBStorage.clear();
        localStorage.clear();
        location.reload();
      },
      setLastInput(lastInput: string) {
        set({
          lastInput,
        });
      },

      /** 重试 bot 消息，在同一条消息中管理多个版本 */
      async retryBotMessage(botMessageId: string, userMessage: ChatMessage) {
        const session = get().currentSession();
        const messageIndex = session.messages.findIndex(
          (m) => m.id === botMessageId,
        );

        if (messageIndex < 0) {
          logger.error("[Chat] Bot message not found for retry", botMessageId);
          return;
        }

        // 保存当前版本到版本数组
        get().updateTargetSession(session, (session) => {
          const currentMessage = session.messages[messageIndex];

          // 初始化版本管理
          if (!currentMessage.versions) {
            currentMessage.versions = [];
            currentMessage.currentVersionIndex = 0;
          }

          // 保存当前内容作为一个版本
          if (
            typeof currentMessage.content === "string" &&
            currentMessage.content.trim()
          ) {
            currentMessage.versions.push(currentMessage.content);
          }

          // 重置消息状态，准备接收新回复
          currentMessage.content = "";
          currentMessage.streaming = true;
          currentMessage.date = new Date().toLocaleString();
          // 更新消息的模型字段为当前会话的模型配置
          currentMessage.model = session.mask.modelConfig.model;
          // 设置当前版本索引为即将生成的新版本
          currentMessage.currentVersionIndex = currentMessage.versions.length;
        });

        // 获取历史消息（不包括当前正在重试的 bot 消息）
        const recentMessages = await get().getMessagesWithMemory();
        const sendMessages = recentMessages.splice(0, messageIndex);

        const modelConfig = session.mask.modelConfig;
        const api: ClientApi = getClientApi(
          modelConfig.providerName || "OpenAI",
        );

        // 读取模型的流式配置，默认为 true（流式）
        const shouldStream = getModelStreamConfig(modelConfig.model);

        // 发送请求
        try {
          const mcpTools = await get().getMcpTools();
          await api.llm.chat({
            messages: sendMessages,
            config: { ...modelConfig, stream: shouldStream },
            tools: mcpTools.length > 0 ? mcpTools : undefined,
            sessionId: session.id,
            onUpdate(message) {
              get().updateTargetSession(session, (session) => {
                const currentMessage = session.messages[messageIndex];
                if (currentMessage) {
                  currentMessage.streaming = true;
                  currentMessage.content = message;
                  // 重试时也使用流式优化器
                  streamOptimizer.updateStreamingMessage(
                    session.id,
                    currentMessage.id,
                    message,
                    session,
                  );
                }
              });
            },
            onFinish(message, responseRes) {
              // 立即刷新待处理的更新
              streamOptimizer.flushUpdates();

              let finishedMessage: ChatMessage | undefined;
              get().updateTargetSession(session, (session) => {
                const currentMessage = session.messages[messageIndex];
                if (currentMessage) {
                  const piMetadata = extractPiResponseMetadata(responseRes);
                  currentMessage.streaming = false;
                  currentMessage.content = message;
                  currentMessage.contentBlocks = piMetadata?.content;
                  currentMessage.stopReason = piMetadata?.stopReason;
                  currentMessage.usage = piMetadata?.usage;
                  currentMessage.piApi = piMetadata?.api;
                  currentMessage.piProvider = piMetadata?.provider;
                  currentMessage.piModel = piMetadata?.model;
                  // 调试信息
                  const reqDebug = (responseRes as any)?.__requestDebug;
                  const respHeaders: Record<string, string> = {};
                  try {
                    responseRes?.headers?.forEach?.((v, k) => {
                      respHeaders[k] = v as any;
                    });
                  } catch {}
                  currentMessage.debug = {
                    request: reqDebug,
                    response: {
                      status: responseRes?.status,
                      headers: respHeaders,
                      body: (responseRes as any)?.__responseBody ?? message,
                    },
                  };
                  finishedMessage = currentMessage;
                }
              });
              if (finishedMessage) {
                get().onNewMessage(finishedMessage, session);
              }

              // 标记控制器为完成状态并清理
              ChatControllerPool.markCompleted(session.id, botMessageId);
              ChatControllerPool.remove(session.id, botMessageId);
            },
            onError(error) {
              const isAborted = error.message.includes("aborted");
              const isOverflow =
                !isAborted && isLikelyContextOverflowError(error);
              let errorMessage: ChatMessage | undefined;
              get().updateTargetSession(session, (session) => {
                const currentMessage = session.messages[messageIndex];
                if (currentMessage) {
                  currentMessage.streaming = false;
                  if (!isAborted) {
                    currentMessage.content = formatChatErrorCodeBlock(
                      isOverflow
                        ? `${error.message}\n\n检测到上下文超限，已触发自动上下文压缩。请重试。`
                        : error.message,
                    );
                    currentMessage.isError = true;
                  }
                  errorMessage = currentMessage;
                }
              });
              if (isOverflow) {
                void get()
                  .summarizeSession(false, session, true)
                  .catch((e) =>
                    logger.warn(
                      "[Chat] Auto compaction after overflow failed (retry):",
                      e,
                    ),
                  );
              }
              if (errorMessage) {
                get().onNewMessage(errorMessage, session);
              }

              // 标记控制器状态并清理
              if (!isAborted) {
                ChatControllerPool.markCompleted(session.id, botMessageId);
              }
              ChatControllerPool.remove(session.id, botMessageId);

              logger.error("[Chat] failed to retry bot message", error);
            },
            onController(controller) {
              // 注册控制器用于停止生成
              ChatControllerPool.addController(
                session.id,
                botMessageId,
                controller,
              );
            },
          });
        } catch (error) {
          logger.error("[Chat] Error in retryBotMessage", error);
        }
      },

      /** check if the message contains MCP JSON and execute the MCP action */
      checkMcpJson(message: ChatMessage) {
        const content = getMessageTextContent(message);
        if (!isMcpJson(content)) return;

        try {
          const mcpRequest = extractMcpJson(content);
          if (!mcpRequest) return;
          executeMcpAction(mcpRequest.clientId, mcpRequest.mcp)
            .then((result: any) => {
              const mcpResponse =
                typeof result === "object" ? JSON.stringify(result) : String(result);
              get().onUserInput(
                `\`\`\`json:mcp-response:${mcpRequest.clientId}\n${mcpResponse}\n\`\`\``,
                [],
                true,
              );
            })
            .catch((error: any) => showToast("MCP execution failed", error));
        } catch {
          // Ignore malformed MCP blocks.
        }
      },

      /** 更新当前对话的 MCP 客户端启用状态 */
      updateSessionMcpClient(clientId: string, enabled: boolean) {
        const session = get().currentSession();
        get().updateTargetSession(session, (session) => {
          if (!session.mcpEnabledClients) {
            session.mcpEnabledClients = {};
          }
          session.mcpEnabledClients[clientId] = enabled;
        });
      },

      /** 获取当前对话的 MCP 客户端启用状态 */
      getSessionMcpClientStatus(clientId: string): boolean {
        const session = get().currentSession();
        return session.mcpEnabledClients?.[clientId] ?? true; // 默认启用
      },

      /** 获取当前对话中所有 MCP 客户端的启用状态 */
      getSessionMcpClients(): Record<string, boolean> {
        const session = get().currentSession();
        return session.mcpEnabledClients ?? {};
      },

      /** 更新当前对话的 MCP 功能总开关 */
      updateSessionMcpEnabled(enabled: boolean) {
        const session = get().currentSession();
        get().updateTargetSession(session, (session) => {
          session.mcpEnabled = enabled;
        });
      },

      /** 获取当前对话的 MCP 功能总开关状态 */
      getSessionMcpEnabled(): boolean {
        const session = get().currentSession();
        return session.mcpEnabled ?? false; // 默认关闭
      },

      /** 清理资源 */
      cleanup() {
        streamOptimizer.destroy();
      },
    };

    // 监听页面卸载，确保清理资源
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        streamOptimizer.destroy();
      });
    }

    return methods;
  },
  {
    name: StoreKey.Chat,
    version: 3.4,
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state),
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.isAutoTopic =
            oldSession.isAutoTopic ?? oldSession.topic === DEFAULT_TOPIC;
          newSession.lastAutoTopicIndex = oldSession.lastAutoTopicIndex ?? 0;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 8192;
          newState.sessions.push(newSession);
        }
      }

      if (version < 3) {
        // migrate id to nanoid
        newState.sessions.forEach((s) => {
          s.id = nanoid();
          s.messages.forEach((m) => (m.id = nanoid()));
        });
      }

      // Enable `enableInjectSystemPrompts` attribute for old sessions.
      // Resolve issue of old sessions not automatically enabling.
      if (version < 3.1) {
        newState.sessions.forEach((s) => {
          if (
            // Exclude those already set by user
            !s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
          ) {
            // Because users may have changed this configuration,
            // the user's current configuration is used instead of the default
            const config = useAppConfig.getState();
            s.mask.modelConfig.enableInjectSystemPrompts =
              config.modelConfig.enableInjectSystemPrompts;
          }
        });
      }

      // add default summarize model for every session
      if (version < 3.2) {
        newState.sessions.forEach((s) => {
          const config = useAppConfig.getState();
          s.mask.modelConfig.compressModel = config.modelConfig.compressModel;
          s.mask.modelConfig.compressProviderName =
            config.modelConfig.compressProviderName;
        });
      }
      // revert default summarize model for every session
      if (version < 3.3) {
        newState.sessions.forEach((s) => {
          s.mask.modelConfig.compressModel = "";
          s.mask.modelConfig.compressProviderName = "";
        });
      }

      // add MCP enabled clients for every session
      if (version < 3.4) {
        newState.sessions.forEach((s) => {
          if (!s.mcpEnabledClients) {
            s.mcpEnabledClients = {};
          }
        });
      }

      return newState as any;
    },
  },
);
