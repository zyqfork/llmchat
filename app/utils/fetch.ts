/**
 * 统一的 Fetch 工具
 *
 * 自动检测环境并选择最佳的请求方式：
 * - Tauri 环境：使用 Rust 后端代理（避免 CORS）
 * - 其他环境：使用浏览器原生 fetch
 */

import { logger } from "./logger";

type TauriStreamResponse = {
  request_id: number;
  status: number;
  status_text: string;
  headers: Record<string, string>;
};

type TauriProxyResponse = {
  status: number;
  headers: Record<string, string>;
  body: number[];
};

type ResponseEvent = {
  id: number;
  payload: {
    request_id: number;
    status?: number;
    chunk?: number[];
  };
};

/**
 * 请求类型枚举
 */
export enum FetchType {
  MCP = "mcp", // MCP 请求
  LLM = "llm", // 大模型请求
  Sync = "sync", // 云同步请求
}

/**
 * 检测是否在 Tauri 环境中运行
 */
export function isTauriApp(): boolean {
  return typeof window !== "undefined" && !!(window as any).__TAURI__;
}

/**
 * 根据 URL 自动检测请求类型
 */
function detectFetchType(url: string): FetchType {
  // MCP 请求检测
  if (url.includes("/api/mcp-proxy") || url.includes("/mcp/")) {
    return FetchType.MCP;
  }

  // 云同步请求检测
  if (
    url.includes("/api/webdav") ||
    url.includes("/api/upstash") ||
    url.includes("dav.jianguoyun.com")
  ) {
    return FetchType.Sync;
  }

  // 默认为大模型请求
  return FetchType.LLM;
}

/**
 * 统一的 fetch 函数
 *
 * 在 Tauri 环境中自动使用 Rust 代理，支持流式和非流式请求
 * 在其他环境中使用浏览器原生 fetch
 *
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param fetchType - 请求类型（可选，不指定则自动检测）
 * @returns Promise<Response>
 */
export async function fetch(
  url: string,
  options?: RequestInit,
  fetchType?: FetchType,
): Promise<Response> {
  // 非 Tauri 环境，使用浏览器原生 fetch
  if (!isTauriApp()) {
    return window.fetch(url, options);
  }

  // 自动检测请求类型
  const type = fetchType || detectFetchType(url);

  // Tauri 环境，使用 Rust 代理
  logger.debug(
    `[Tauri Fetch ${type.toUpperCase()}] ${options?.method || "GET"} ${url}`,
  );

  const {
    signal,
    method = "GET",
    headers: _headers = {},
    body = [],
  } = options || {};

  // 构建请求头
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    "User-Agent": navigator.userAgent,
  };
  for (const item of new Headers(_headers || {})) {
    headers[item[0]] = item[1];
  }

  // 构建请求体
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

  // 检测是否需要流式响应
  // 检查多个条件：
  // 1. Accept 头包含流式类型
  // 2. URL 包含 stream 参数
  // 3. 请求体包含 "stream":true
  const acceptHeader = headers["Accept"] || headers["accept"] || "";
  const bodyString = typeof body === "string" ? body : "";

  const isStreamRequest =
    acceptHeader.includes("text/event-stream") ||
    acceptHeader.includes("application/stream+json") ||
    url.includes("stream=true") ||
    bodyString.includes('"stream":true') ||
    bodyString.includes('"stream": true');

  if (isStreamRequest) {
    // 使用流式代理
    return fetchStream(
      url,
      method,
      headers,
      bodyBytes,
      signal || undefined,
      type,
    );
  } else {
    // 使用非流式代理
    return fetchNonStream(
      url,
      method,
      headers,
      bodyBytes,
      signal || undefined,
      type,
    );
  }
}

/**
 * 流式请求（用于大模型等需要实时响应的场景）
 */
async function fetchStream(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: number[],
  signal?: AbortSignal,
  fetchType: FetchType = FetchType.LLM,
): Promise<Response> {
  const { invoke } = await import("@tauri-apps/api/core");
  const { listen } = await import("@tauri-apps/api/event");

  let unlisten: Function | undefined;
  let setRequestId: Function | undefined;
  const requestIdPromise = new Promise((resolve) => (setRequestId = resolve));
  const ts = new TransformStream();
  const writer = ts.writable.getWriter();

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    unlisten && unlisten();
    writer.ready.then(() => {
      writer.close().catch((e) => logger.error(e));
    });
  };

  if (signal) {
    signal.addEventListener("abort", () => close());
  }

  // 监听流式响应事件
  unlisten = await listen("stream-response", (e: any) => {
    requestIdPromise.then((request_id) => {
      const { request_id: rid, chunk, status } = e?.payload || {};
      if (request_id != rid) {
        return;
      }
      if (chunk) {
        writer.ready.then(() => {
          writer.write(new Uint8Array(chunk));
        });
      } else if (status === 0) {
        // 流结束
        close();
      }
    });
  });

  // 根据请求类型选择对应的 Tauri 命令
  const commandMap = {
    [FetchType.MCP]: "tauri_fetch_mcp_stream",
    [FetchType.LLM]: "tauri_fetch_llm_stream",
    [FetchType.Sync]: "tauri_fetch_sync_stream",
  };

  try {
    const res: TauriStreamResponse = await invoke(commandMap[fetchType], {
      method: method.toUpperCase(),
      url,
      headers,
      body,
    });

    const {
      request_id,
      status,
      status_text: statusText,
      headers: respHeaders,
    } = res;
    setRequestId?.(request_id);

    const response = new Response(ts.readable, {
      status,
      statusText,
      headers: respHeaders,
    });

    if (status >= 300) {
      setTimeout(close, 100);
    }

    return response;
  } catch (e) {
    logger.error(`[Tauri Fetch ${fetchType.toUpperCase()} Stream] Error:`, e);
    close();
    return new Response("", { status: 599 });
  }
}

/**
 * 非流式请求（用于普通 API 调用）
 */
async function fetchNonStream(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: number[],
  signal?: AbortSignal,
  fetchType: FetchType = FetchType.LLM,
): Promise<Response> {
  const { invoke } = await import("@tauri-apps/api/core");

  // 根据请求类型选择对应的 Tauri 命令
  const commandMap = {
    [FetchType.MCP]: "tauri_fetch_mcp",
    [FetchType.LLM]: "tauri_fetch_llm",
    [FetchType.Sync]: "tauri_fetch_sync",
  };

  try {
    const res: TauriProxyResponse = await invoke(commandMap[fetchType], {
      method: method.toUpperCase(),
      url,
      headers,
      body,
    });

    const { status, headers: respHeaders, body: respBody } = res;

    return new Response(new Uint8Array(respBody), {
      status,
      headers: respHeaders,
    });
  } catch (e) {
    logger.error(`[Tauri Fetch ${fetchType.toUpperCase()}] Error:`, e);
    throw e;
  }
}

/**
 * 获取代理 URL（用于 Standalone 模式）
 *
 * 在 Tauri 环境中返回空字符串（因为使用 Rust 代理）
 * 在其他环境中返回配置的代理 URL
 */
export function getProxyUrl(
  useProxy: boolean,
  configuredProxyUrl?: string,
): string {
  if (!useProxy) {
    return "";
  }

  // 在 Tauri 环境中，不使用 HTTP 代理服务器
  // 因为所有请求都通过 Rust 后端发送
  if (isTauriApp()) {
    logger.debug("[Tauri Fetch] Using Rust backend proxy");
    return "";
  }

  // 在非 Tauri 环境（standalone 模式）
  // 使用配置的代理 URL 或当前域名
  return configuredProxyUrl && configuredProxyUrl.length > 0
    ? configuredProxyUrl
    : window.location.origin;
}

// 导出默认的 fetch 函数
export default fetch;
