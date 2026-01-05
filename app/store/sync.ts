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
  syncConfig: false, // 是否同步配置（手动）
  autoSyncChat: false, // 是否自动同步聊天数据
  encryptionPassword: "", // 加密密码，仅用于加密配置数据

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
     * 获取用户配置数据（Access Store）
     */
    getConfigData() {
      const appState = getLocalAppState();
      return this.safeClone(appState[StoreKey.Access]);
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
     * 上传聊天数据到云端
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
     * 下载聊天数据并合并
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
      if (!get().autoSyncChat || !this.cloudSync()) {
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
     * 下载配置数据（解密并覆盖本地）
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
        const newState: Record<string, any> = { ...localState };
        newState[StoreKey.Access] = configData;
        setLocalAppState(newState as AppState);

        console.log("[Sync] Downloaded config data");
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
     * 导入配置数据
     */
    async importConfigData() {
      const rawContent = await readFromFile();

      try {
        const configData = JSON.parse(rawContent);
        const localState = getLocalAppState();
        const newState: Record<string, any> = { ...localState };

        newState[StoreKey.Access] = configData;

        setLocalAppState(newState as AppState);
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
