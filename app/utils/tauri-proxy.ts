/**
 * Tauri Proxy Utilities
 *
 * 在 Tauri 应用中提供代理支持，让 export 模式也能使用代理功能
 */

// Tauri 代理服务器默认端口
export const TAURI_PROXY_PORT = 3210;
export const TAURI_PROXY_URL = `http://localhost:${TAURI_PROXY_PORT}`;

/**
 * 检测是否在 Tauri 环境中运行
 */
export function isTauriApp(): boolean {
  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI__;
  console.log(`[Tauri Detection] isTauriApp: ${isTauri}`);
  return isTauri;
}

/**
 * 使用 Tauri invoke 进行代理请求（避免 CORS）
 */
export async function tauriFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  if (!isTauriApp()) {
    // 非 Tauri 环境，使用普通 fetch
    return fetch(url, options);
  }

  console.log(`[Tauri Fetch] Requesting: ${options?.method || "GET"} ${url}`);

  try {
    const { invoke } = (window as any).__TAURI__.tauri;

    const headers: Record<string, string> = {};
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    let body: number[] | undefined;
    if (options?.body) {
      if (typeof options.body === "string") {
        body = Array.from(new TextEncoder().encode(options.body));
      } else if (options.body instanceof ArrayBuffer) {
        body = Array.from(new Uint8Array(options.body));
      } else if (options.body instanceof Uint8Array) {
        body = Array.from(options.body);
      }
    }

    const response = await invoke("proxy_fetch", {
      request: {
        method: options?.method || "GET",
        url,
        headers,
        body,
      },
    });

    const {
      status,
      headers: respHeaders,
      body: respBody,
    } = response as {
      status: number;
      headers: Record<string, string>;
      body: number[];
    };

    return new Response(new Uint8Array(respBody), {
      status,
      headers: respHeaders,
    });
  } catch (e) {
    console.error("[Tauri Fetch] Error:", e);
    throw e;
  }
}

/**
 * 获取代理 URL
 *
 * 在 Tauri 环境中：
 * - 大模型服务：返回空字符串（使用 stream_fetch 命令，已在 Rust 后端执行）
 * - MCP 服务：由 MCP 代码直接使用 tauriFetch，不调用此函数
 *
 * 在非 Tauri 环境（standalone 模式）：
 * - 使用配置的代理 URL 或当前域名
 */
export function getProxyUrl(
  useProxy: boolean,
  configuredProxyUrl?: string,
): string {
  if (!useProxy) {
    return "";
  }

  // 在 Tauri 环境中，不使用 HTTP 代理服务器
  // 因为 stream_fetch 和 proxy_fetch 命令已经在 Rust 后端执行
  if (isTauriApp()) {
    console.log(
      "[Tauri Proxy] In Tauri environment: proxy handled by Rust backend (stream_fetch/proxy_fetch)",
    );
    return ""; // 返回空字符串，表示不使用 HTTP 代理
  }

  // 在非 Tauri 环境（standalone 模式）
  // 使用配置的代理 URL 或当前域名
  return configuredProxyUrl && configuredProxyUrl.length > 0
    ? configuredProxyUrl
    : window.location.origin;
}

/**
 * 检查代理服务器是否可用
 */
export async function checkProxyAvailable(): Promise<boolean> {
  if (!isTauriApp()) {
    return true; // 非 Tauri 环境，假设代理可用
  }

  try {
    const response = await fetch(`${TAURI_PROXY_URL}/api/proxy/health`, {
      method: "GET",
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch (e) {
    console.warn("[Tauri Proxy] Proxy server not available:", e);
    return false;
  }
}

/**
 * 等待代理服务器启动
 */
export async function waitForProxyServer(
  maxRetries: number = 10,
  retryDelay: number = 500,
): Promise<boolean> {
  if (!isTauriApp()) {
    return true;
  }

  for (let i = 0; i < maxRetries; i++) {
    const available = await checkProxyAvailable();
    if (available) {
      console.log("[Tauri Proxy] Proxy server is ready");
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  console.error("[Tauri Proxy] Proxy server failed to start");
  return false;
}
