/**
 * 统一的 Fetch 工具
 *
 * 自动检测环境并选择最佳的请求方式：
 * - Tauri 环境：使用 Rust 后端代理（统一流式响应，避免 CORS）
 * - 其他环境：使用浏览器原生 fetch
 */

import { logger } from "./logger";

type TauriStreamResponse = {
  request_id: number;
  status: number;
  status_text: string;
  headers: Record<string, string>;
};

type TauriStreamDebugBody = {
  text: string;
  complete: boolean;
  streamError?: string;
  truncated?: boolean;
};

/**
 * 请求类型枚举
 */
export enum FetchType {
  MCP = "mcp", // MCP 请求
  LLM = "llm", // 大模型请求
  Sync = "sync", // 云同步请求
}

export enum DesktopRuntime {
  Browser = "browser",
  Tauri = "tauri",
  Electron = "electron",
}

export function getDesktopRuntime(): DesktopRuntime {
  if (typeof window === "undefined") {
    return DesktopRuntime.Browser;
  }
  if ((window as any).__TAURI__) {
    return DesktopRuntime.Tauri;
  }
  if (window.electronApp?.isElectron) {
    return DesktopRuntime.Electron;
  }
  return DesktopRuntime.Browser;
}

export function isTauriApp(): boolean {
  return getDesktopRuntime() === DesktopRuntime.Tauri;
}

export function isElectronApp(): boolean {
  return getDesktopRuntime() === DesktopRuntime.Electron;
}

/**
 * 根据 URL 自动检测请求类型
 */
function detectFetchType(url: string): FetchType {
  if (url.includes("/api/mcp-proxy") || url.includes("/mcp/")) {
    return FetchType.MCP;
  }
  if (
    url.includes("/api/webdav") ||
    url.includes("/api/upstash") ||
    url.includes("dav.jianguoyun.com")
  ) {
    return FetchType.Sync;
  }
  return FetchType.LLM;
}

/**
 * 统一的 fetch 函数
 *
 * Tauri 环境下通过 Rust 代理发请求，响应体统一为流（与标准 fetch 一致）。
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param fetchType - 请求类型（可选，不指定则自动检测）
 */
export async function fetch(
  url: string,
  options?: RequestInit,
  fetchType?: FetchType,
): Promise<Response> {
  const runtime = getDesktopRuntime();
  if (runtime === DesktopRuntime.Browser) {
    return window.fetch(url, options);
  }

  const type = fetchType || detectFetchType(url);
  const runtimeLabel = runtime === DesktopRuntime.Tauri ? "Tauri" : "Electron";
  logger.debug(
    `[${runtimeLabel} Fetch ${type.toUpperCase()}] ${options?.method || "GET"} ${url}`,
  );

  const {
    signal,
    method = "GET",
    headers: _headers = {},
    body = [],
  } = options || {};

  const headers: Record<string, string> = {};
  for (const item of new Headers(_headers || {})) {
    headers[item[0]] = item[1];
  }

  let bodyBytes: number[] = [];
  if (body) {
    if (typeof body === "string") {
      bodyBytes = Array.from(new TextEncoder().encode(body));
    } else if (body instanceof ArrayBuffer) {
      bodyBytes = Array.from(new Uint8Array(body));
    } else if (body instanceof Uint8Array) {
      bodyBytes = Array.from(body);
    }
  }

  let unlisten: (() => void) | undefined;
  let resolveRequestId!: (id: number) => void;
  const requestIdPromise = new Promise<number>((resolve) => {
    resolveRequestId = resolve;
  });
  const ts = new TransformStream();
  const writer = ts.writable.getWriter();
  const debugBody: TauriStreamDebugBody = {
    text: "",
    complete: false,
  };
  const debugDecoder = new TextDecoder();
  const maxDebugChars = 12000;

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    debugBody.complete = true;
    unlisten?.();
    writer.ready.then(() => writer.close().catch((e) => logger.error(e)));
  };

  if (signal) {
    signal.addEventListener("abort", () => close());
  }

  const onStreamPayload = (payload: any) => {
    requestIdPromise.then((request_id) => {
      const { request_id: rid, chunk, status, error } = payload || {};
      if (request_id !== rid) return;
      if (chunk) {
        if (debugBody.text.length < maxDebugChars) {
          const decoded = debugDecoder.decode(new Uint8Array(chunk), {
            stream: true,
          });
          if (decoded) {
            const rest = maxDebugChars - debugBody.text.length;
            if (decoded.length > rest) {
              debugBody.text += decoded.slice(0, rest);
              debugBody.truncated = true;
            } else {
              debugBody.text += decoded;
            }
          }
        }
        writer.ready.then(() => writer.write(new Uint8Array(chunk)));
      } else if (status === 0) {
        if (typeof error === "string" && error.trim()) {
          debugBody.streamError = error.trim();
        }
        close();
      }
    });
  };

  const timeoutSecs = type === FetchType.Sync ? 60 : 300;

  try {
    let res: TauriStreamResponse;
    if (runtime === DesktopRuntime.Tauri) {
      const { invoke } = await import("@tauri-apps/api/core");
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen("stream-response", (e: any) =>
        onStreamPayload(e?.payload),
      );
      res = await invoke("tauri_fetch", {
        method: method.toUpperCase(),
        url,
        headers,
        body: bodyBytes,
        timeout_secs: timeoutSecs,
      });
    } else if (
      runtime === DesktopRuntime.Electron &&
      window.electronApp?.invokeFetch &&
      window.electronApp?.onStreamResponse
    ) {
      unlisten = window.electronApp.onStreamResponse(onStreamPayload);
      res = await window.electronApp.invokeFetch({
        method: method.toUpperCase(),
        url,
        headers,
        body: bodyBytes,
        timeout_secs: timeoutSecs,
      });
    } else {
      throw new Error("Electron fetch bridge is unavailable");
    }

    const {
      request_id,
      status,
      status_text: statusText,
      headers: respHeaders,
    } = res;
    resolveRequestId(request_id);

    const response = new Response(ts.readable, {
      status,
      statusText,
      headers: respHeaders,
    });
    (response as any).__tauriDebugBody = debugBody;

    return response;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : `Network request failed: ${String(e)}`;
    logger.warn(
      `[${runtimeLabel} Fetch ${type.toUpperCase()}] ${message}`,
      url,
    );
    close();
    return new Response(message, {
      status: 599,
      statusText: "Network Error",
    });
  }
}

/**
 * 获取代理 URL（用于 Standalone 模式）
 */
export function getProxyUrl(
  useProxy: boolean,
  configuredProxyUrl?: string,
): string {
  if (!useProxy) return "";
  if (getDesktopRuntime() !== DesktopRuntime.Browser) {
    logger.debug("[Desktop Fetch] Using native backend proxy");
    return "";
  }
  return configuredProxyUrl && configuredProxyUrl.length > 0
    ? configuredProxyUrl
    : window.location.origin;
}

export default fetch;
