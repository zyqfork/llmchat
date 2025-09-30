import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  getMessageImages,
  isDalle3,
  safeLocalStorage,
  trimTopic,
} from "../utils";

import { indexedDBStorage } from "@/app/utils/indexedDB-storage";
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
} from "../utils/model-resolver";
import { getModelCompressThreshold } from "../config/model-context-tokens";
import { useAccessStore } from "./access";
import { collectModelsWithDefaultModel } from "../utils/model";
import { createDefaultMask, Mask } from "./mask";
import { executeMcpAction, getAllTools } from "../mcp/actions.client";
import { extractMcpJson, isMcpJson } from "../mcp/utils";

const localStorage = safeLocalStorage();

export type ChatMessageTool = {
  id: string;
  index?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
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

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
  // MCP 功能总开关（默认关闭）
  mcpEnabled?: boolean;
  // MCP 在当前对话中的启用状态
  mcpEnabledClients?: Record<string, boolean>;
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
  };
  // 搜索功能状态
  searchEnabled?: boolean;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createDefaultMask(), // 使用默认助手
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
    return [GEMINI_SUMMARIZE_MODEL, ServiceProvider.Google];
  } else if (currentModel.startsWith("deepseek-")) {
    return [DEEPSEEK_SUMMARIZE_MODEL, ServiceProvider.DeepSeek];
  }

  return [currentModel, providerName];
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
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

async function getMcpSystemPrompt(
  mcpEnabled: boolean = false,
  enabledClients?: Record<string, boolean>,
): Promise<string> {
  // 如果 MCP 功能未启用，返回空字符串
  if (!mcpEnabled) {
    return "";
  }

  const tools = await getAllTools();

  let toolsStr = "";
  let totalToolCount = 0;

  tools.forEach((i) => {
    // error client has no tools
    if (!i.tools) return;

    // 如果提供了启用状态配置，则检查该客户端是否启用
    if (enabledClients && enabledClients[i.clientId] === false) {
      return;
    }

    // 统计工具数量
    totalToolCount += i.tools.tools.length;

    toolsStr += MCP_TOOLS_TEMPLATE.replace(
      /\{\{ clientId \}\}/g,
      i.clientId,
    ).replace(
      "{{ tools }}",
      i.tools.tools.map((p: object) => JSON.stringify(p, null, 2)).join("\n"),
    );
  });

  // 根据工具数量决定是否使用强化模式
  let systemTemplate = MCP_SYSTEM_TEMPLATE;
  if (totalToolCount > 0) {
    // 对于少量工具，使用更强化的提示词
    systemTemplate = systemTemplate.replace(
      "## Tool Use Rules",
      `## Tool Use Rules (${totalToolCount} tools available)\n**IMPORTANT: You have ${totalToolCount} powerful tools available. Use them actively to help users!**`,
    );
  }

  return systemTemplate.replace("{{ MCP_TOOLS }}", toolsStr);
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
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
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
          // 创建一个新的助手对象，确保不会修改原始助手
          const newMask = { ...mask };

          // 深拷贝助手的模型配置，确保使用助手的完整配置
          newMask.modelConfig = { ...mask.modelConfig };

          // 如果助手有默认模型设置，需要确保模型配置中的模型和提供商是正确的
          if (mask.defaultModel) {
            const sessionModelConfig = getSessionModelConfig(mask);
            newMask.modelConfig.model = sessionModelConfig.model;
            newMask.modelConfig.providerName = sessionModelConfig.providerName;
            // 根据模型更新压缩阈值
            newMask.modelConfig.compressMessageLengthThreshold =
              getModelCompressThreshold(sessionModelConfig.model);
          } else {
            // 即使没有设置默认模型，也要确保使用全局配置
            const sessionModelConfig = getSessionModelConfig(mask);
            newMask.modelConfig.model = sessionModelConfig.model;
            newMask.modelConfig.providerName = sessionModelConfig.providerName;
            // 根据模型更新压缩阈值
            newMask.modelConfig.compressMessageLengthThreshold =
              getModelCompressThreshold(sessionModelConfig.model);
          }

          // 禁用全局同步，防止后续操作覆盖我们的助手配置
          newMask.syncGlobalConfig = false;

          // 确保使用新创建的助手对象
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

      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

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

        get().summarizeSession(false, targetSession);
      },

      async onUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
      ) {
        const session = get().currentSession();

        // 检查是否为多模型模式
        if (
          session.multiModelMode?.enabled &&
          session.multiModelMode.selectedModels.length > 1
        ) {
          return get().onMultiModelUserInput(
            content,
            attachImages,
            isMcpResponse,
          );
        }

        const modelConfig = session.mask.modelConfig;

        // MCP Response no need to fill template
        let mContent: string | MultimodalContent[] = isMcpResponse
          ? content
          : fillTemplateWith(content, modelConfig);

        if (!isMcpResponse && attachImages && attachImages.length > 0) {
          mContent = [
            ...(content ? [{ type: "text" as const, text: content }] : []),
            ...attachImages.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ];
        }

        let userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
          isMcpResponse,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model,
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

        const api: ClientApi = getClientApi(modelConfig.providerName);

        // make request
        api.llm.chat({
          messages: sendMessages,
          config: { ...modelConfig, stream: true },
          onUpdate(message) {
            botMessage.streaming = true;
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
            const respHeaders: Record<string, string> = {};
            try {
              responseRes?.headers?.forEach?.((v, k) => {
                respHeaders[k] = v as any;
              });
            } catch {}

            get().updateTargetSession(session, (session) => {
              const messageIndex = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );

              if (messageIndex > -1) {
                const finalBotMessage = {
                  ...session.messages[messageIndex],
                  streaming: false,
                  content: message,
                  date: new Date().toLocaleString(),
                  debug: {
                    request: reqDebug,
                    response: {
                      status: responseRes?.status,
                      headers: respHeaders,
                      body: message,
                    },
                  },
                } as ChatMessage;

                session.messages[messageIndex] = finalBotMessage;
                get().onNewMessage(finalBotMessage, session);
              }
            });

            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onBeforeTool(tool: ChatMessageTool) {
            (botMessage.tools = botMessage?.tools || []).push(tool);
            // 工具调用时也使用优化更新
            streamOptimizer.updateStreamingMessage(
              session.id,
              botMessage.id,
              getMessageTextContent(botMessage),
              session,
            );
          },
          onAfterTool(tool: ChatMessageTool) {
            botMessage?.tools?.forEach((t, i, tools) => {
              if (tool.id == t.id) {
                tools[i] = { ...tool };
              }
            });
            // 工具完成时使用优化更新
            streamOptimizer.updateStreamingMessage(
              session.id,
              botMessage.id,
              getMessageTextContent(botMessage),
              session,
            );
          },
          onError(error) {
            const isAborted = error.message?.includes?.("aborted");
            botMessage.content +=
              "\n\n" +
              prettyObject({
                error: true,
                message: error.message,
              });
            botMessage.streaming = false;
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
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
            ...(content ? [{ type: "text" as const, text: content }] : []),
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

        // 为每个选中的模型创建独立的 bot 消息
        const botMessages: Record<string, ChatMessage> = {};
        const modelConfigs: Record<string, any> = {};

        for (const modelKey of multiModelMode.selectedModels) {
          const [modelName, providerId] = modelKey.split("@");

          // 创建该模型的配置
          const modelConfig = {
            ...session.mask.modelConfig,
            model: modelName as ModelType,
            providerName: providerId as ServiceProvider,
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

        // 为每个模型发送请求
        const promises = multiModelMode.selectedModels.map(async (modelKey) => {
          const modelConfig = modelConfigs[modelKey];
          const botMessage = botMessages[modelKey];

          // 获取该模型的独立消息历史
          const modelMessages = multiModelMode.modelMessages[modelKey] || [];
          const recentMessages = [...modelMessages, userMessage];

          // 更新该模型的消息历史
          multiModelMode.modelMessages[modelKey] = recentMessages;

          const api: ClientApi = getClientApi(modelConfig.providerName);

          return api.llm.chat({
            messages: recentMessages,
            config: { ...modelConfig, stream: true },
            onUpdate(message) {
              botMessage.streaming = true;
              if (message) {
                botMessage.content = message;
                // 多模型模式也使用流式优化器
                streamOptimizer.updateStreamingMessage(
                  session.id,
                  botMessage.id,
                  message,
                  session,
                );
              }
            },
            async onFinish(message, responseRes) {
              // 立即刷新待处理的更新
              streamOptimizer.flushUpdates();

              botMessage.streaming = false;
              if (message) {
                botMessage.content = message;
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
                    body: message,
                  },
                };

                // 更新该模型的独立消息历史
                multiModelMode.modelMessages[modelKey].push(botMessage);

                get().onNewMessage(botMessage, session);
              }
              ChatControllerPool.remove(session.id, botMessage.id);
            },
            onBeforeTool(tool: ChatMessageTool) {
              (botMessage.tools = botMessage?.tools || []).push(tool);
              // 多模型工具调用也使用优化更新
              streamOptimizer.updateStreamingMessage(
                session.id,
                botMessage.id,
                getMessageTextContent(botMessage),
                session,
              );
            },
            onController(controller) {
              ChatControllerPool.addController(
                session.id,
                botMessage.id ?? session.messages.length,
                controller,
              );
            },
          });
        });

        // 等待所有模型完成响应
        await Promise.allSettled(promises);
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        if (session.memoryPrompt.length) {
          return {
            role: "system",
            content: Locale.Store.Prompt.History(session.memoryPrompt),
            date: "",
          } as ChatMessage;
        }
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
          // 只在 mcpSystemPrompt 不為空時才創建 system message
          systemPrompts = [
            createMessage({
              role: "system",
              content: mcpSystemPrompt,
            }),
          ];
        }
        // 如果兩者都沒有，systemPrompts 保持為空數組

        if (shouldInjectSystemPrompts || mcpSystemPrompt) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[Global System Prompt] ",
              systemPrompts.at(0)?.content ?? "empty",
            );
          }
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
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
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
                    text: c.text
                      ? c.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
                      : "",
                  };
                }
                return c;
              });
            }
          }
          reversedRecentMessages.push(msgToSend);
        }
        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
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
        });
      },

      summarizeSession(
        refreshTitle: boolean = false,
        targetSession: ChatSession,
      ) {
        const config = useAppConfig.getState();
        const session = targetSession;
        const modelConfig = session.mask.modelConfig;
        // skip summarize when using dalle3?
        if (isDalle3(modelConfig.model)) {
          return;
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

        const api: ClientApi = getClientApi(providerName as ServiceProvider);

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          (config.enableAutoGenerateTitle &&
            session.topic === DEFAULT_TOPIC &&
            countMessages(messages) >= SUMMARIZE_MIN_LEN) ||
          refreshTitle
        ) {
          const startIndex = Math.max(
            0,
            messages.length - modelConfig.historyMessageCount,
          );
          const topicMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .concat(
              createMessage({
                role: "user",
                content: Locale.Store.Prompt.Topic,
              }),
            );
          api.llm.chat({
            messages: topicMessages,
            config: {
              model,
              stream: false,
              providerName,
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(
                  session,
                  (session) =>
                    (session.topic =
                      message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
                );
              }
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > (modelConfig?.max_tokens || 4000)) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        if (memoryPrompt) {
          // add memory prompt
          toBeSummarizedMsgs.unshift(memoryPrompt);
        }

        const lastSummarizeIndex = session.messages.length;

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          /** Destruct max_tokens while summarizing
           * this param is just shit
           **/
          const { max_tokens, ...modelcfg } = modelConfig;
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: Locale.Store.Prompt.Summarize,
                date: "",
              }),
            ),
            config: {
              ...modelcfg,
              stream: true,
              model,
              providerName,
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(session, (session) => {
                  session.lastSummarizeIndex = lastSummarizeIndex;
                  session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
                });
              }
            },
            onError(err) {
              console.error("Summarize error: ", err);
            },
          });
        }
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
          console.error("[Chat] Bot message not found for retry", botMessageId);
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
        const api: ClientApi = getClientApi(modelConfig.providerName);

        // 发送请求
        try {
          await api.llm.chat({
            messages: sendMessages,
            config: { ...modelConfig, stream: true },
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
                  currentMessage.streaming = false;
                  currentMessage.content = message;
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
                      body: message,
                    },
                  };
                  finishedMessage = currentMessage;
                }
              });
              if (finishedMessage) {
                get().onNewMessage(finishedMessage, session);
              }
            },
            onError(error) {
              const isAborted = error.message.includes("aborted");
              let errorMessage: ChatMessage | undefined;
              get().updateTargetSession(session, (session) => {
                const currentMessage = session.messages[messageIndex];
                if (currentMessage) {
                  currentMessage.streaming = false;
                  if (!isAborted) {
                    currentMessage.content = prettyObject({
                      error: true,
                      message: error.message,
                    });
                    currentMessage.isError = true;
                  }
                  errorMessage = currentMessage;
                }
              });
              if (errorMessage) {
                get().onNewMessage(errorMessage, session);
              }
              console.error("[Chat] failed to retry bot message", error);
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
          console.error("[Chat] Error in retryBotMessage", error);
        }
      },

      /** check if the message contains MCP JSON and execute the MCP action */
      checkMcpJson(message: ChatMessage) {
        const content = getMessageTextContent(message);
        if (isMcpJson(content)) {
          try {
            const mcpRequest = extractMcpJson(content);
            if (mcpRequest) {
              executeMcpAction(mcpRequest.clientId, mcpRequest.mcp)
                .then((result: any) => {
                  const mcpResponse =
                    typeof result === "object"
                      ? JSON.stringify(result)
                      : String(result);
                  get().onUserInput(
                    `\`\`\`json:mcp-response:${mcpRequest.clientId}\n${mcpResponse}\n\`\`\``,
                    [],
                    true,
                  );
                })
                .catch((error: any) =>
                  showToast("MCP execution failed", error),
                );
            }
          } catch (error) {
            // MCP JSON 检查失败，静默处理
          }
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
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
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
