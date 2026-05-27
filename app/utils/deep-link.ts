import { Path } from "../constant";

export type DeepLinkTarget =
  | { type: "home" }
  | { type: "chat" }
  | { type: "settings" }
  | { type: "new-chat" };

/** 解析 llmchat://chat 或 llmchat://settings 等深链接 */
export function parseDeepLinkUrl(raw: string): DeepLinkTarget | null {
  try {
    const normalized = raw.trim();
    const url = normalized.includes("://")
      ? new URL(normalized)
      : new URL(`llmchat://${normalized.replace(/^\/+/, "")}`);

    if (url.protocol !== "llmchat:") return null;

    const path = (
      url.hostname || url.pathname.replace(/^\//, "")
    ).toLowerCase();

    switch (path) {
      case "":
      case "home":
        return { type: "home" };
      case "chat":
        return { type: "chat" };
      case "settings":
        return { type: "settings" };
      case "new-chat":
      case "newchat":
        return { type: "new-chat" };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function deepLinkToPath(target: DeepLinkTarget): string {
  switch (target.type) {
    case "home":
      return Path.Home;
    case "chat":
      return Path.Chat;
    case "settings":
      return Path.Settings;
    case "new-chat":
      return Path.NewChat;
    default:
      return Path.Home;
  }
}
