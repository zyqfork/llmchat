import { getClientConfig } from "../config/client";
import { ApiPath, STORAGE_KEY, StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  AppState,
  getLocalAppState,
  GetStoreState,
  mergeAppState,
  setLocalAppState,
} from "../utils/sync";
import { downloadAs, readFromFile } from "../utils";
import { showToast } from "../components/ui-lib";
import Locale from "../locales";
import { createSyncClient, ProviderType } from "../utils/cloud";
import { encrypt, decrypt } from "../utils/crypto";

export interface WebDavConfig {
  server: string;
  username: string;
  password: string;
}

const isApp = !!getClientConfig()?.isApp;
export type SyncStore = GetStoreState<typeof useSyncStore>;

// 聊天数据文件名
const CHAT_FILE_NAME = "chat.json";
// 配置数据文件名
const CONFIG_FILE_NAME = "config.json";

const DEFAULT_SYNC_STATE = {
  provider: ProviderType.WebDAV,
  useProxy: true,
  proxyUrl: ApiPath.Cors as string,

  // 同步选项
  syncChat: false, // 是否同步聊天数据
  syncConfig: false, // 是否同步配置数据
  autoSyncChat: false, // 是否自动同步聊天数据（需要先开启 syncChat）
  encryptionPassword: "", // 加密密码，用于加密聊天和配置数据

  webdav: {
    endpoint: "",
    username: STORAGE_KEY,
    password: "",
  },

  upstash: {
    endpoint: "",
    username: STORAGE_KEY,
    apiKey: "",
  },

  github: {
    token: "",
    repo: "",
    branch: "main",
    path: "",
    username: STORAGE_KEY,
  },

  s3: {
    endpoint: "",
    bucket: "",
    accessKey: "",
    secretKey: "",
    region: "us-east-1",
    username: STORAGE_KEY,
  },

  lastSyncTime: 0,
  lastProvider: "",
};

export const useSyncStore = createPersistStore(
  DEFAULT_SYNC_STATE,
  (set, get) => ({
    cloudSync() {
      const provider = get().provider;

      switch (provider) {
        case ProviderType.WebDAV: {
          const config = get().webdav;
          return !!(config.endpoint && config.password);
        }
        case ProviderType.UpStash: {
          const config = get().upstash;
          return !!(config.endpoint && config.apiKey);
        }
        case ProviderType.GitHub: {
          const config = get().github;
          return !!(config.token && config.repo);
        }
        case ProviderType.S3: {
          const config = get().s3;
          return !!(
            config.endpoint &&
            config.bucket &&
            config.accessKey &&
            config.secretKey
          );
        }
        default:
          return false;
      }
    },

    markSyncTime() {
      set({ lastSyncTime: Date.now(), lastProvider: get().provider });
    },

    /**
     * 安全克隆对象，避免循环引用
     */
    safeClone<T>(obj: T): T {
      try {
        const seen = new WeakSet();
        const result = JSON.stringify(obj, function (key, value) {
          if (typeof value === "function") {
            return undefined;
          }
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return undefined;
            }
            seen.add(value);
          }
          return value;
        });
        return JSON.parse(result);
      } catch (e) {
        console.error("[Sync] Failed to clone object:", e);
        return {} as T;
      }
    },

    /**
     * 获取聊天数据
     */
    getChatData() {
      const appState = getLocalAppState();
      return this.safeClone(appState[StoreKey.Chat]);
    },

    /**
     * 获取用户修改的配置数据（只同步用户修改的部分，不同步默认值）
     */
    getConfigData() {
      const appState = getLocalAppState();

      // Access Store: 只提取用户配置的敏感信息
      const accessState = appState[StoreKey.Access] as Record<string, any>;
      const userAccess: Record<string, any> = {};

      // 启用的服务商
      const enabledProviders = Object.entries(
        accessState.enabledProviders || {},
      ).filter(([_, enabled]) => enabled);
      if (enabledProviders.length > 0) {
        userAccess.enabledProviders = Object.fromEntries(enabledProviders);
      }

      // 各服务商的 API Key 和 URL（只保存非空的）
      const providerConfigs = [
        { key: "openai", apiKey: "openaiApiKey", url: "openaiUrl" },
        {
          key: "azure",
          apiKey: "azureApiKey",
          url: "azureUrl",
          extra: ["azureApiVersion"],
        },
        { key: "google", apiKey: "googleApiKey", url: "googleUrl" },
        { key: "anthropic", apiKey: "anthropicApiKey", url: "anthropicUrl" },
        { key: "bytedance", apiKey: "bytedanceApiKey", url: "bytedanceUrl" },
        { key: "alibaba", apiKey: "alibabaApiKey", url: "alibabaUrl" },
        { key: "moonshot", apiKey: "moonshotApiKey", url: "moonshotUrl" },
        { key: "deepseek", apiKey: "deepseekApiKey", url: "deepseekUrl" },
        { key: "xai", apiKey: "xaiApiKey", url: "xaiUrl" },
        {
          key: "siliconflow",
          apiKey: "siliconflowApiKey",
          url: "siliconflowUrl",
        },
        { key: "ollama", apiKey: "ollamaApiKey", url: "ollamaUrl" },
      ];

      providerConfigs.forEach(({ apiKey, url, extra }) => {
        if (accessState[apiKey]) {
          userAccess[apiKey] = accessState[apiKey];
        }
        if (accessState[url]) {
          userAccess[url] = accessState[url];
        }
        extra?.forEach((k) => {
          if (accessState[k]) {
            userAccess[k] = accessState[k];
          }
        });
      });

      // 自定义服务商
      if (accessState.customProviders?.length > 0) {
        userAccess.customProviders = accessState.customProviders;
      }

      // 启用的模型列表（只保存非空的）
      const enabledModels = Object.entries(
        accessState.enabledModels || {},
      ).filter(([_, models]: [string, any]) => models?.length > 0);
      if (enabledModels.length > 0) {
        userAccess.enabledModels = Object.fromEntries(enabledModels);
      }

      // Config Store: 提取所有用户配置
      const configState = appState[StoreKey.Config] as Record<string, any>;
      const userConfig: Record<string, any> = {};

      // 模型配置 - 始终同步
      if (configState.modelConfig) {
        userConfig.modelConfig = this.safeClone(configState.modelConfig);
      }

      // TTS 配置 - 始终同步
      if (configState.ttsConfig) {
        userConfig.ttsConfig = this.safeClone(configState.ttsConfig);
      }

      // 实时语音配置 - 始终同步
      if (configState.realtimeConfig) {
        userConfig.realtimeConfig = this.safeClone(configState.realtimeConfig);
      }

      // 其他用户可能修改的配置 - 始终同步
      const configKeys = [
        "theme",
        "colorScheme",
        "fontSize",
        "fontFamily",
        "avatar",
        "systemAvatar",
        "assistantAvatar",
        "sendPreviewBubble",
        "enableAutoGenerateTitle",
        "enableArtifacts",
        "enableCodeFold",
        "disablePromptHint",
        "useModelIconAsAvatar",
        "submitKey",
        "tightBorder",
        "sidebarWidth",
        "sidebarCollapsed",
      ];
      configKeys.forEach((key) => {
        if (configState[key] !== undefined) {
          userConfig[key] = configState[key];
        }
      });

      // Mask Store: 提取用户创建的助手（builtin !== true）
      const maskState = appState[StoreKey.Mask] as Record<string, any>;
      const userMasks = Object.entries(maskState.masks || {})
        .filter(([id, mask]: [string, any]) => {
          // 排除内置助手（builtin === true）
          // 用户创建的助手 builtin 为 false 或 undefined
          return mask.builtin !== true;
        })
        .reduce(
          (acc, [id, mask]) => {
            acc[id] = mask;
            return acc;
          },
          {} as Record<string, any>,
        );

      // Prompt Store: 提取所有用户存储的提示词
      // 用户创建的提示词存储在 prompts 对象中，内置提示词不在这里
      const promptState = appState[StoreKey.Prompt] as Record<string, any>;
      const userPrompts = this.safeClone(promptState.prompts || {});

      // MCP 配置
      const mcpState = appState[StoreKey.Mcp] as Record<string, any>;

      const result = {
        access: Object.keys(userAccess).length > 0 ? userAccess : undefined,
        config: Object.keys(userConfig).length > 0 ? userConfig : undefined,
        masks:
          Object.keys(userMasks).length > 0 ? { masks: userMasks } : undefined,
        prompts:
          Object.keys(userPrompts).length > 0
            ? { prompts: userPrompts }
            : undefined,
        mcp:
          mcpState?.mcpServers && Object.keys(mcpState.mcpServers).length > 0
            ? mcpState
            : undefined,
      };

      console.log("[Sync] getConfigData:", {
        accessKeys: Object.keys(userAccess),
        configKeys: Object.keys(userConfig),
        masksCount: Object.keys(userMasks).length,
        promptsCount: Object.keys(userPrompts).length,
        mcpCount: mcpState?.mcpServers
          ? Object.keys(mcpState.mcpServers).length
          : 0,
      });

      return result;
    },

    getClient() {
      const provider = get().provider;
      const client = createSyncClient(provider, get());
      return client;
    },

    /**
     * 获取当前 provider 的 username
     */
    getUsername() {
      const provider = get().provider;
      const config = get()[provider];
      return config.username || STORAGE_KEY;
    },

    async check() {
      const client = this.getClient();
      return await client.check();
    },

    /**
     * 上传聊天数据到云端（不加密）
     */
    async uploadChat() {
      const client = this.getClient();
      const username = this.getUsername();
      const chatData = this.getChatData();
      const filePath = `${username}/${CHAT_FILE_NAME}`;
      await client.set(filePath, JSON.stringify(chatData));
      console.log("[Sync] Uploaded chat data:", filePath);
    },

    /**
     * 下载聊天数据并合并（不加密）
     */
    async downloadAndMergeChat() {
      const client = this.getClient();
      const username = this.getUsername();
      const filePath = `${username}/${CHAT_FILE_NAME}`;

      const remoteData = await client.get(filePath);
      if (!remoteData || remoteData === "") {
        console.log("[Sync] No remote chat data found");
        return;
      }

      try {
        const remoteChatData = JSON.parse(remoteData);
        const localState = getLocalAppState();
        const localChat = localState[StoreKey.Chat];

        // 合并会话
        const localSessions: Record<string, any> = {};
        localChat.sessions.forEach((s: any) => (localSessions[s.id] = s));

        let hasChanges = false;
        remoteChatData.sessions.forEach((remoteSession: any) => {
          if (!remoteSession.messages || remoteSession.messages.length === 0)
            return;

          const localSession = localSessions[remoteSession.id];
          if (!localSession) {
            // 新会话，直接添加
            localChat.sessions.push(remoteSession);
            hasChanges = true;
          } else {
            // 合并消息
            const localMessageIds = new Set(
              localSession.messages.map((v: any) => v.id),
            );
            remoteSession.messages.forEach((m: any) => {
              if (!localMessageIds.has(m.id)) {
                localSession.messages.push(m);
                hasChanges = true;
              }
            });
            // 按时间排序
            localSession.messages.sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
            // 更新 lastUpdate
            if (
              new Date(remoteSession.lastUpdate) >
              new Date(localSession.lastUpdate)
            ) {
              localSession.lastUpdate = remoteSession.lastUpdate;
            }
          }
        });

        if (hasChanges) {
          // 按最后更新时间排序
          localChat.sessions.sort(
            (a: any, b: any) =>
              new Date(b.lastUpdate).getTime() -
              new Date(a.lastUpdate).getTime(),
          );
          setLocalAppState(localState);
          console.log("[Sync] Merged remote chat data");
        }
      } catch (e) {
        console.error("[Sync] Failed to parse remote chat data:", e);
      }
    },

    /**
     * 自动同步聊天数据（双向合并）
     */
    async autoSync() {
      if (!get().syncChat || !get().autoSyncChat || !this.cloudSync()) {
        return;
      }

      try {
        // 先下载合并远程数据
        await this.downloadAndMergeChat();
        // 再上传本地数据
        await this.uploadChat();
        this.markSyncTime();
        console.log("[Sync] Auto sync completed");
      } catch (e) {
        console.error("[Sync] Auto sync failed:", e);
      }
    },

    /**
     * 上传配置数据到云端（加密）
     */
    async uploadConfig() {
      const client = this.getClient();
      const username = this.getUsername();
      const configData = this.getConfigData();
      const password = get().encryptionPassword;
      const encryptedConfig = await encrypt(
        JSON.stringify(configData),
        password,
      );
      const filePath = `${username}/${CONFIG_FILE_NAME}`;
      await client.set(filePath, encryptedConfig);
      console.log("[Sync] Uploaded config data:", filePath);
    },

    /**
     * 下载配置数据（解密并合并到本地）
     */
    async downloadConfig() {
      const client = this.getClient();
      const username = this.getUsername();
      const filePath = `${username}/${CONFIG_FILE_NAME}`;

      const encryptedConfig = await client.get(filePath);
      if (!encryptedConfig || encryptedConfig === "") {
        throw new Error("Remote config is empty");
      }

      try {
        const password = get().encryptionPassword;
        const decrypted = await decrypt(encryptedConfig, password);
        const configData = JSON.parse(decrypted);

        const localState = getLocalAppState();

        // 合并 Access 配置（部分合并，不覆盖整个 store）
        if (configData.access) {
          const localAccess = localState[StoreKey.Access] as Record<
            string,
            any
          >;
          Object.entries(configData.access).forEach(([key, value]) => {
            if (key === "enabledProviders" || key === "enabledModels") {
              // 合并对象类型的配置
              localAccess[key] = { ...localAccess[key], ...(value as object) };
            } else if (key === "customProviders") {
              // 合并自定义服务商（按 id 去重）
              const existingIds = new Set(
                (localAccess.customProviders || []).map((p: any) => p.id),
              );
              const newProviders = (value as any[]).filter(
                (p) => !existingIds.has(p.id),
              );
              localAccess.customProviders = [
                ...(localAccess.customProviders || []),
                ...newProviders,
              ];
            } else {
              // 直接覆盖其他配置
              localAccess[key] = value;
            }
          });
        }

        // 合并 Config 配置（部分合并）
        if (configData.config) {
          const localConfig = localState[StoreKey.Config] as Record<
            string,
            any
          >;
          Object.entries(configData.config).forEach(([key, value]) => {
            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              // 深度合并对象
              localConfig[key] = { ...localConfig[key], ...(value as object) };
            } else {
              localConfig[key] = value;
            }
          });
        }

        // 合并 Masks（按 id 合并）
        if (configData.masks?.masks) {
          const localMasks = localState[StoreKey.Mask] as Record<string, any>;
          localMasks.masks = { ...localMasks.masks, ...configData.masks.masks };
        }

        // 合并 Prompts（按 id 合并）
        if (configData.prompts?.prompts) {
          const localPrompts = localState[StoreKey.Prompt] as Record<
            string,
            any
          >;
          localPrompts.prompts = {
            ...localPrompts.prompts,
            ...configData.prompts.prompts,
          };
        }

        // 合并 MCP 配置
        if (configData.mcp?.mcpServers) {
          const localMcp = localState[StoreKey.Mcp] as Record<string, any>;
          localMcp.mcpServers = {
            ...localMcp.mcpServers,
            ...configData.mcp.mcpServers,
          };
          if (configData.mcp.customSystemPrompt) {
            localMcp.customSystemPrompt = configData.mcp.customSystemPrompt;
          }
          if (configData.mcp.customToolsPrompt) {
            localMcp.customToolsPrompt = configData.mcp.customToolsPrompt;
          }
          if (configData.mcp.callMode) {
            localMcp.callMode = configData.mcp.callMode;
          }
        }

        setLocalAppState(localState);

        console.log("[Sync] Downloaded and merged config data");
      } catch (e) {
        console.error("[Sync] Failed to decrypt config:", e);
        showToast(
          Locale.Settings.Sync.DecryptFailed || "解密失败，请检查加密密码",
        );
        throw e;
      }
    },

    export() {
      const state = getLocalAppState();
      const datePart = isApp
        ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
            .toLocaleTimeString()
            .replace(/:/g, "_")}`
        : new Date().toLocaleString();

      const fileName = `Backup-${datePart}.json`;
      downloadAs(JSON.stringify(state), fileName);
    },

    async import() {
      const rawContent = await readFromFile();

      try {
        const remoteState = JSON.parse(rawContent) as AppState;
        const localState = getLocalAppState();
        mergeAppState(localState, remoteState);
        setLocalAppState(localState);
        location.reload();
      } catch (e) {
        console.error("[Import]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },

    /**
     * 导出聊天数据
     */
    exportChatData() {
      const chatData = this.getChatData();
      const datePart = isApp
        ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
            .toLocaleTimeString()
            .replace(/:/g, "_")}`
        : new Date().toLocaleString();

      const fileName = `ChatBackup-${datePart}.json`;
      downloadAs(JSON.stringify(chatData), fileName);
    },

    /**
     * 导入聊天数据
     */
    async importChatData() {
      const rawContent = await readFromFile();

      try {
        const chatData = JSON.parse(rawContent);
        const localState = getLocalAppState();

        // 合并聊天数据
        const localChat = localState[StoreKey.Chat];
        const localSessions: Record<string, any> = {};
        localChat.sessions.forEach((s: any) => (localSessions[s.id] = s));

        chatData.sessions.forEach((remoteSession: any) => {
          if (remoteSession.messages.length === 0) return;

          const localSession = localSessions[remoteSession.id];
          if (!localSession) {
            localChat.sessions.push(remoteSession);
          } else {
            const localMessageIds = new Set(
              localSession.messages.map((v: any) => v.id),
            );
            remoteSession.messages.forEach((m: any) => {
              if (!localMessageIds.has(m.id)) {
                localSession.messages.push(m);
              }
            });
            localSession.messages.sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
          }
        });

        localChat.sessions.sort(
          (a: any, b: any) =>
            new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime(),
        );

        setLocalAppState(localState);
        location.reload();
      } catch (e) {
        console.error("[Import Chat]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },

    /**
     * 导出配置数据
     */
    exportConfigData() {
      const configData = this.getConfigData();
      const datePart = isApp
        ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
            .toLocaleTimeString()
            .replace(/:/g, "_")}`
        : new Date().toLocaleString();

      const fileName = `ConfigBackup-${datePart}.json`;
      downloadAs(JSON.stringify(configData), fileName);
    },

    /**
     * 导入配置数据（合并到本地）
     */
    async importConfigData() {
      const rawContent = await readFromFile();

      try {
        const configData = JSON.parse(rawContent);
        const localState = getLocalAppState();

        // 合并 Access 配置
        if (configData.access) {
          const localAccess = localState[StoreKey.Access] as Record<
            string,
            any
          >;
          Object.entries(configData.access).forEach(([key, value]) => {
            if (key === "enabledProviders" || key === "enabledModels") {
              localAccess[key] = { ...localAccess[key], ...(value as object) };
            } else if (key === "customProviders") {
              const existingIds = new Set(
                (localAccess.customProviders || []).map((p: any) => p.id),
              );
              const newProviders = (value as any[]).filter(
                (p) => !existingIds.has(p.id),
              );
              localAccess.customProviders = [
                ...(localAccess.customProviders || []),
                ...newProviders,
              ];
            } else {
              localAccess[key] = value;
            }
          });
        }

        // 合并 Config 配置
        if (configData.config) {
          const localConfig = localState[StoreKey.Config] as Record<
            string,
            any
          >;
          Object.entries(configData.config).forEach(([key, value]) => {
            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              localConfig[key] = { ...localConfig[key], ...(value as object) };
            } else {
              localConfig[key] = value;
            }
          });
        }

        // 合并 Masks
        if (configData.masks?.masks) {
          const localMasks = localState[StoreKey.Mask] as Record<string, any>;
          localMasks.masks = { ...localMasks.masks, ...configData.masks.masks };
        }

        // 合并 Prompts
        if (configData.prompts?.prompts) {
          const localPrompts = localState[StoreKey.Prompt] as Record<
            string,
            any
          >;
          localPrompts.prompts = {
            ...localPrompts.prompts,
            ...configData.prompts.prompts,
          };
        }

        // 合并 MCP 配置
        if (configData.mcp?.mcpServers) {
          const localMcp = localState[StoreKey.Mcp] as Record<string, any>;
          localMcp.mcpServers = {
            ...localMcp.mcpServers,
            ...configData.mcp.mcpServers,
          };
          if (configData.mcp.customSystemPrompt) {
            localMcp.customSystemPrompt = configData.mcp.customSystemPrompt;
          }
          if (configData.mcp.customToolsPrompt) {
            localMcp.customToolsPrompt = configData.mcp.customToolsPrompt;
          }
          if (configData.mcp.callMode) {
            localMcp.callMode = configData.mcp.callMode;
          }
        }

        setLocalAppState(localState);
        location.reload();
      } catch (e) {
        console.error("[Import Config]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },
  }),
  {
    name: StoreKey.Sync,
    version: 2.0,

    migrate(persistedState, version) {
      const newState = persistedState as typeof DEFAULT_SYNC_STATE;

      if (version < 2.0) {
        // 重置为新的默认值
        newState.webdav.username = STORAGE_KEY;
        newState.upstash.username = STORAGE_KEY;
        newState.github.username = STORAGE_KEY;
        newState.s3.username = STORAGE_KEY;
        newState.autoSyncChat = false;
      }

      return newState as any;
    },
  },
);
