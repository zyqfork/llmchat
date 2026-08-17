import { useEffect, useState } from "react";
import { showToast } from "./components/ui-lib";
import Locale from "./locales";
import { RequestMessage } from "./client/api";
import {
  REQUEST_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS_FOR_THINKING,
  RELEASE_URL,
  ServiceProvider,
  isVisionModel,
  getModelCapabilities,
} from "./constant";
// import { fetch as tauriFetch, ResponseType } from "@tauri-apps/api/http";
import { fetch as tauriStreamFetch } from "./utils/fetch";
import { logger } from "./utils/logger";
import { useAccessStore } from "./store";
import { ModelSize } from "./typing";

export function trimTopic(topic: string) {
  // Fix an issue where double quotes still show in the Indonesian language
  // This will remove the specified punctuation from the end of the string
  // and also trim quotes from both the start and end if they exist.
  return (
    topic
      // fix for gemini
      .replace(/^["“”*]+|["“”*]+$/g, "")
      .replace(/[，。！？”“"、,.!?*]*$/, "")
  );
}

export async function copyToClipboard(text: string) {
  try {
    if (window.__TAURI__) {
      const { writeText } =
        await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }

    showToast(Locale.Copy.Success);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(Locale.Copy.Success);
    } catch (error) {
      showToast(Locale.Copy.Failed);
    }
    document.body.removeChild(textArea);
  }
}

export async function downloadAs(text: string, filename: string) {
  if (window.__TAURI__) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");

    const result = await save({
      defaultPath: `${filename}`,
      filters: [
        {
          name: `${filename.split(".").pop()} files`,
          extensions: [`${filename.split(".").pop()}`],
        },
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });

    if (result !== null) {
      try {
        await fs.writeTextFile(result, text);
        showToast(Locale.Download.Success);
      } catch (error) {
        showToast(Locale.Download.Failed);
      }
    } else {
      showToast(Locale.Download.Failed);
    }
  } else {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

export function readFromFile() {
  return new Promise<string>((res, rej) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";

    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        res(e.target.result);
      };
      fileReader.onerror = (e) => rej(e);
      fileReader.readAsText(file);
    };

    fileInput.click();
  });
}

export function isIOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let rafId = 0;
    const onResize = () => {
      // 用 rAF 合并同一帧内的多次 resize 事件，减少无谓的重渲染
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

export const MOBILE_MAX_WIDTH = 600;
export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function isFirefox() {
  return (
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)
  );
}

export function selectOrCopy(el: HTMLElement, content: string) {
  const currentSelection = window.getSelection();

  if (currentSelection?.type === "Range") {
    return false;
  }

  copyToClipboard(content);

  return true;
}

function getDomContentWidth(dom: HTMLElement) {
  const style = window.getComputedStyle(dom);
  const paddingWidth =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = dom.clientWidth - paddingWidth;
  return width;
}

function getOrCreateMeasureDom(id: string, init?: (dom: HTMLElement) => void) {
  let dom = document.getElementById(id);

  if (!dom) {
    dom = document.createElement("span");
    dom.style.position = "absolute";
    dom.style.wordBreak = "break-word";
    dom.style.fontSize = "14px";
    dom.style.transform = "translateY(-200vh)";
    dom.style.pointerEvents = "none";
    dom.style.opacity = "0";
    dom.id = id;
    document.body.appendChild(dom);
    init?.(dom);
  }

  return dom!;
}

export function autoGrowTextArea(dom: HTMLTextAreaElement) {
  const measureDom = getOrCreateMeasureDom("__measure");
  const singleLineDom = getOrCreateMeasureDom("__single_measure", (dom) => {
    dom.innerText = "TEXT_FOR_MEASURE";
  });

  const width = getDomContentWidth(dom);
  measureDom.style.width = width + "px";
  measureDom.innerText = dom.value !== "" ? dom.value : "1";
  measureDom.style.fontSize = dom.style.fontSize;
  measureDom.style.fontFamily = dom.style.fontFamily;
  const endWithEmptyLine = dom.value.endsWith("\n");
  const height = parseFloat(window.getComputedStyle(measureDom).height);
  const singleLineHeight = parseFloat(
    window.getComputedStyle(singleLineDom).height,
  );

  const rows =
    Math.round(height / singleLineHeight) + (endWithEmptyLine ? 1 : 0);

  return rows;
}

export function getCSSVar(varName: string) {
  return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

/**
 * Detects Macintosh
 */
export function isMacOS(): boolean {
  if (typeof window !== "undefined") {
    let userAgent = window.navigator.userAgent.toLocaleLowerCase();
    const macintosh = /iphone|ipad|ipod|macintosh/.test(userAgent);
    return !!macintosh;
  }
  return false;
}

export function getMessageTextContent(message: RequestMessage) {
  if (typeof message.content === "string") {
    return message.content;
  }
  for (const c of message.content) {
    if (c.type === "text") {
      return c.text ?? "";
    }
  }
  return "";
}

/**
 * 移除文本中的思考内容
 * 支持多种格式的思考标签：
 * - <think>...</think>
 * - <think>...</think>
 * - 不完整的标签
 */
export function removeThinkingContent(text: string): string {
  if (!text) return "";

  // 移除 <think> 和 </think> 标签及其之间的内容
  let cleaned = text.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, "");

  // 移除 <think> 和 </think> 标签及其之间的内容（某些模型可能使用这种格式）
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 移除可能残留的不完整思考标签
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/^[\s\S]*?<\/redacted_reasoning>/gi, "");
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/^[\s\S]*?<\/think>/gi, "");

  // 清理多余的空白行（保留单个换行）
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return cleaned.trim();
}

export function getMessageTextContentWithoutThinking(message: RequestMessage) {
  let content = "";

  if (typeof message.content === "string") {
    content = message.content;
  } else {
    for (const c of message.content) {
      if (c.type === "text") {
        content = c.text ?? "";
        break;
      }
    }
  }

  // 使用通用的移除思考内容函数
  return removeThinkingContent(content);
}

export function getMessageImages(message: RequestMessage): string[] {
  if (typeof message.content === "string") {
    return [];
  }
  const urls: string[] = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push(c.image_url?.url ?? "");
    }
  }
  return urls;
}

export function isDalle3(model: string) {
  return "dall-e-3" === model;
}

export function getTimeoutMSByModel(model: string) {
  model = model.toLowerCase();
  if (
    model.startsWith("dall-e") ||
    model.startsWith("dalle") ||
    model.startsWith("o1") ||
    model.startsWith("o3") ||
    model.includes("deepseek-r") ||
    model.includes("-thinking") ||
    model.includes("-image-preview") // 添加图片预览模型支持
  )
    return REQUEST_TIMEOUT_MS_FOR_THINKING;
  return REQUEST_TIMEOUT_MS;
}

export function getModelSizes(model: string): ModelSize[] {
  if (isDalle3(model)) {
    return ["1024x1024", "1792x1024", "1024x1792"];
  }
  if (model.toLowerCase().includes("cogview")) {
    return [
      "1024x1024",
      "768x1344",
      "864x1152",
      "1344x768",
      "1152x864",
      "1440x720",
      "720x1440",
    ];
  }
  return [];
}

export function supportsCustomSize(model: string): boolean {
  return getModelSizes(model).length > 0;
}

export function fetch(
  url: string,
  options?: Record<string, unknown>,
): Promise<any> {
  if (window.__TAURI__) {
    return tauriStreamFetch(url, options);
  }
  return window.fetch(url, options);
}

export function adapter(config: Record<string, unknown>) {
  const { baseURL, url, params, data: body, ...rest } = config;
  const path = baseURL ? `${baseURL}${url}` : url;
  const fetchUrl = params
    ? `${path}?${new URLSearchParams(params as any).toString()}`
    : path;
  return fetch(fetchUrl as string, { ...rest, body }).then((res) => {
    const { status, headers, statusText } = res;
    return res
      .text()
      .then((data: string) => ({ status, statusText, headers, data }));
  });
}

export function safeLocalStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} {
  let storage: Storage | null;
  const isBrowser = typeof window !== "undefined";

  try {
    if (isBrowser && window.localStorage) {
      storage = window.localStorage;
    } else {
      storage = null;
    }
  } catch (e) {
    if (isBrowser) {
      logger.error("localStorage is not available:", e);
    }
    storage = null;
  }

  return {
    getItem(key: string): string | null {
      if (storage) {
        return storage.getItem(key);
      } else {
        // 只在浏览器环境输出警告，服务端静默处理
        if (isBrowser) {
          logger.warn(
            `Attempted to get item "${key}" from localStorage, but localStorage is not available.`,
          );
        }
        return null;
      }
    },
    setItem(key: string, value: string): void {
      if (storage) {
        storage.setItem(key, value);
      } else {
        // 只在浏览器环境输出警告，服务端静默处理
        if (isBrowser) {
          logger.warn(
            `Attempted to set item "${key}" in localStorage, but localStorage is not available.`,
          );
        }
      }
    },
    removeItem(key: string): void {
      if (storage) {
        storage.removeItem(key);
      } else {
        // 只在浏览器环境输出警告，服务端静默处理
        if (isBrowser) {
          logger.warn(
            `Attempted to remove item "${key}" from localStorage, but localStorage is not available.`,
          );
        }
      }
    },
    clear(): void {
      if (storage) {
        storage.clear();
      } else {
        // 只在浏览器环境输出警告，服务端静默处理
        if (isBrowser) {
          logger.warn(
            "Attempted to clear localStorage, but localStorage is not available.",
          );
        }
      }
    },
  };
}

export function getOperationId(operation: {
  operationId?: string;
  method: string;
  path: string;
}) {
  // pattern '^[a-zA-Z0-9_-]+$'
  return (
    operation?.operationId ||
    `${operation.method.toUpperCase()}${operation.path.replaceAll("/", "_")}`
  );
}

export async function clientUpdate() {
  // this a wild for updating client app
  if (window.electronApp?.isElectron) {
    await window.electronApp.openExternal?.(RELEASE_URL);
    return;
  }

  if (!window.__TAURI__) return;

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();
    if (update?.available) {
      await update.downloadAndInstall();
      showToast(Locale.Settings.Update.Success);
      await relaunch();
    }
  } catch (e) {
    logger.error("[Check Update Error]", e);
    showToast(Locale.Settings.Update.Failed);
  }
}

/** 将 v2.19 / 2.19.0 / v2.20-beta 等与 GitHub Release tag 对齐后再做 semver 比较 */
export function normalizeReleaseTagVersion(raw: string): string {
  if (!raw || typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "unknown") {
    return "";
  }
  const withoutV = trimmed.replace(/^v/i, "");
  const buildSep = withoutV.indexOf("+");
  const withoutBuild = buildSep === -1 ? withoutV : withoutV.slice(0, buildSep);
  const prereleaseSep = withoutBuild.indexOf("-");
  const core =
    prereleaseSep === -1 ? withoutBuild : withoutBuild.slice(0, prereleaseSep);
  const suffix = prereleaseSep === -1 ? "" : withoutBuild.slice(prereleaseSep);
  const parts = core.split(".").filter((p) => p !== "");
  if (
    parts.length === 0 ||
    parts.length > 3 ||
    parts.some((p) => !/^\d+$/.test(p))
  ) {
    return "";
  }
  const maj = parts[0];
  const min = parts[1] ?? "0";
  const pat = parts[2] ?? "0";
  return `${maj}.${min}.${pat}${suffix}`;
}

function parseSemver(version: string) {
  const normalized = normalizeReleaseTagVersion(version);
  const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split(".") ?? [],
  };
}

function comparePrereleaseIdentifier(a: string, b: string) {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);
  if (aNumeric && bNumeric) {
    return Number(a) - Number(b);
  }
  if (aNumeric) return -1;
  if (bNumeric) return 1;
  return a.localeCompare(b);
}

export function semverCompare(a: string, b: string) {
  // 添加空值检查，防止 startsWith 方法调用失败
  if (!a || !b) {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
  }

  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) {
    return normalizeReleaseTagVersion(a).localeCompare(
      normalizeReleaseTagVersion(b),
      undefined,
      { numeric: true },
    );
  }

  for (const key of ["major", "minor", "patch"] as const) {
    const diff = parsedA[key] - parsedB[key];
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }

  if (parsedA.prerelease.length === 0 && parsedB.prerelease.length === 0) {
    return 0;
  }
  if (parsedA.prerelease.length === 0) return 1;
  if (parsedB.prerelease.length === 0) return -1;

  const len = Math.max(parsedA.prerelease.length, parsedB.prerelease.length);
  for (let i = 0; i < len; i += 1) {
    const idA = parsedA.prerelease[i];
    const idB = parsedB.prerelease[i];
    if (idA == null && idB == null) return 0;
    if (idA == null) return -1;
    if (idB == null) return 1;
    const diff = comparePrereleaseIdentifier(idA, idB);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }

  return 0;
}

export function isThinkingModel(model: string | undefined) {
  if (!model) {
    return false;
  }

  // 使用模型能力配置系统来判断是否具有推理能力
  const capabilities = getModelCapabilities(model);
  return capabilities.reasoning === true;
}

export function wrapThinkingPart(full_reply: string) {
  // 现在所有模型都直接生成<think>标签，这个函数主要用于确保兼容性
  // 直接返回原内容，因为思考内容已经被正确包装
  return full_reply;
}
