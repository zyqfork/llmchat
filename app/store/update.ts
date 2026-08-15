import { FETCH_COMMIT_URL, FETCH_RELEASE_URL, StoreKey } from "../constant";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import {
  clientUpdate,
  normalizeReleaseTagVersion,
  semverCompare,
} from "../utils";
import ChatGptIcon from "../icons/chatgpt.svg";
import Locale from "../locales";
import { logger } from "../utils/logger";
import { fetch as appFetch, FetchType } from "../utils/fetch";

const ONE_MINUTE = 60 * 1000;
const isApp = !!getClientConfig()?.isApp;

function formatVersionDate(t: string) {
  // 添加输入验证
  if (!t || typeof t !== "string") {
    return "unknown";
  }

  const timestamp = +t;
  if (isNaN(timestamp)) {
    return "unknown";
  }

  const d = new Date(timestamp);
  if (isNaN(d.getTime())) {
    return "unknown";
  }

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  return [
    year.toString(),
    month.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("");
}

type VersionType = "date" | "tag";

function isStableReleaseTag(tag: string) {
  const normalized = normalizeReleaseTagVersion(tag);
  return normalized !== "" && !normalized.includes("-");
}

async function getElectronVersion() {
  if (typeof window === "undefined" || !window.electronApp?.getVersion) {
    return "";
  }

  const version = await window.electronApp.getVersion();
  if (!version || typeof version !== "string") return "";
  return version.startsWith("v") ? version : `v${version}`;
}

async function getCurrentVersion(type: VersionType) {
  const clientConfig = getClientConfig();
  if (type === "date") {
    return clientConfig?.commitDate || "unknown";
  }

  const electronVersion = await getElectronVersion();
  return electronVersion || clientConfig?.version || "unknown";
}

async function getStableReleaseVersion() {
  const data = (await (
    await appFetch(FETCH_RELEASE_URL, undefined, FetchType.Sync)
  ).json()) as {
    tag_name?: string;
    draft?: boolean;
    prerelease?: boolean;
  }[];

  const release = data.find(
    (item) =>
      item?.tag_name &&
      !item.draft &&
      !item.prerelease &&
      isStableReleaseTag(item.tag_name),
  );

  return release?.tag_name || "unknown";
}

async function getVersion(type: VersionType) {
  try {
    if (type === "date") {
      const data = (await (
        await appFetch(FETCH_COMMIT_URL, undefined, FetchType.Sync)
      ).json()) as {
        commit: {
          author: { name: string; date: string };
        };
        sha: string;
      }[];

      if (!data || !data[0] || !data[0].commit || !data[0].commit.author) {
        return "unknown";
      }

      const remoteCommitTime = data[0].commit.author.date;
      if (!remoteCommitTime) {
        return "unknown";
      }

      const remoteId = new Date(remoteCommitTime).getTime().toString();
      return remoteId;
    }

    if (type === "tag") {
      return await getStableReleaseVersion();
    }
  } catch (error) {
    logger.error("[Update] Failed to fetch version:", error);
    return "unknown";
  }

  return "unknown";
}

export const useUpdateStore = createPersistStore(
  {
    versionType: "tag" as VersionType,
    lastUpdate: 0,
    version: "unknown",
    remoteVersion: "",
  },
  (set, get) => ({
    formatVersion(version: string) {
      // 确保 version 是有效的字符串
      if (!version || typeof version !== "string") {
        return "unknown";
      }

      if (get().versionType === "date") {
        version = formatVersionDate(version);
      } else {
        // 移除版本号前缀 "v" 以确保版本比较的一致性
        version = version.replace(/^v/, "");
      }
      return version;
    },

    async getLatestVersion(force = false) {
      const versionType = get().versionType;
      let version = await getCurrentVersion(versionType);

      // 确保 version 是有效的字符串
      if (!version || typeof version !== "string") {
        version = "unknown";
      }

      set(() => ({ version }));

      const shouldCheck = Date.now() - get().lastUpdate > 2 * 60 * ONE_MINUTE;
      if (!force && !shouldCheck) return;

      set(() => ({
        lastUpdate: Date.now(),
      }));

      try {
        const remoteId = await getVersion(versionType);
        // 确保 remoteId 是有效的字符串
        const validRemoteId =
          remoteId && typeof remoteId === "string" ? remoteId : "unknown";
        set(() => ({
          remoteVersion: validRemoteId,
        }));
        if (window.__TAURI__ && isApp) {
          // Check if notification permission is granted
          try {
            const { isPermissionGranted, requestPermission, sendNotification } =
              await import("@tauri-apps/plugin-notification");

            let granted = await isPermissionGranted();
            if (!granted) {
              const permission = await requestPermission();
              granted = permission === "granted";
            }

            if (granted) {
              const normalizedCurrent = normalizeReleaseTagVersion(version);
              const normalizedRemote =
                normalizeReleaseTagVersion(validRemoteId);
              const hasUpdate =
                normalizedCurrent !== "" &&
                normalizedRemote !== "" &&
                semverCompare(normalizedCurrent, normalizedRemote) === -1;

              if (!hasUpdate) {
                // Show a notification using Tauri
                await sendNotification({
                  title: "LLMChat",
                  body: `${Locale.Settings.Update.IsLatest}`,
                  icon: `${ChatGptIcon.src}`,
                });
              } else {
                const updateMessage = Locale.Settings.Update.FoundUpdate(
                  `${remoteId}`,
                );
                // Show a notification for the new version using Tauri
                await sendNotification({
                  title: "LLMChat",
                  body: updateMessage,
                  icon: `${ChatGptIcon.src}`,
                });
                clientUpdate();
              }
            }
          } catch (error) {
            logger.error("[Notification Error]", error);
          }
        }
      } catch (error) {
        logger.error("[Fetch Upstream Commit Id]", error);
      }
    },
  }),
  {
    name: StoreKey.Update,
    version: 1,
  },
);
