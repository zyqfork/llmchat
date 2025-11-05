import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPClientLogger } from "./logger";
import { ServerConfig } from "./types";
import { fetch, getProxyUrl, isTauriApp } from "@/app/utils/fetch";

const logger = new MCPClientLogger("Transport Factory");

// 网页端支持HTTP-based传输
export type MCPTransport = SSEClientTransport | StreamableHTTPClientTransport;

/**
 * 传输工厂类，负责根据配置创建相应的传输实例
 */
export class TransportFactory {
  /**
   * 根据配置创建传输实例 (网页端专用 - 支持HTTP-based协议)
   */
  static async createTransport(
    id: string,
    config: ServerConfig,
  ): Promise<MCPTransport> {
    logger.info(`Creating ${config.type} transport for ${id}...`);

    switch (config.type) {
      case "sse":
        return this.createSSETransport(id, config);

      case "streamableHttp":
        return this.createStreamableHTTPTransport(id, config);

      default:
        throw new Error(
          `Unsupported transport type: ${config.type}. Supported types: sse, streamableHttp`,
        );
    }
  }

  /**
   * 创建 SSE 传输
   */
  private static createSSETransport(
    id: string,
    config: ServerConfig,
  ): SSEClientTransport {
    const baseUrl = config.baseUrl;
    config = { ...config, baseUrl };
    if (!config.baseUrl) {
      throw new Error(`Base URL is required for SSE transport`);
    }

    logger.debug(`Creating SSE transport with URL: ${config.baseUrl}`);

    const options = {
      eventSourceInit: {
        fetch: async (url: string | URL | Request, init?: RequestInit) => {
          let headers: Record<string, string> = {
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            ...(config.headers || {}),
          };

          // 合并init中的headers
          if (init?.headers) {
            const initHeaders = init.headers;
            if (initHeaders instanceof Headers) {
              initHeaders.forEach((value, key) => {
                headers[key] = value;
              });
            } else if (Array.isArray(initHeaders)) {
              initHeaders.forEach(([key, value]) => {
                headers[key] = value;
              });
            } else {
              Object.assign(headers, initHeaders);
            }
          }

          // 处理代理配置
          let finalUrl = url;
          const urlString = typeof url === "string" ? url : url.toString();

          logger.info(
            `[MCP SSE Config] useProxy: ${
              config.useProxy
            }, isTauriApp: ${isTauriApp()}`,
          );

          // 统一的代理处理：
          // - Tauri 环境：直接使用目标 URL，fetch 会自动使用 Rust 代理
          // - 非 Tauri 环境：使用代理 URL
          if (config.useProxy) {
            if (isTauriApp()) {
              // Tauri 环境：直接使用目标 URL
              finalUrl = urlString;
              logger.info(
                `[MCP SSE] Tauri with proxy, using unified fetch for: ${finalUrl}`,
              );
            } else {
              // 非 Tauri 环境：使用代理 URL
              const proxyUrl = getProxyUrl(config.useProxy, config.proxyUrl);
              logger.info(
                `[MCP SSE] Non-Tauri with proxy, proxyUrl: ${proxyUrl}`,
              );
              try {
                const u = new URL(`${proxyUrl}/api/mcp-proxy`);
                u.searchParams.append("endpoint", urlString);
                finalUrl = u.toString();
                logger.debug(`Using proxy for MCP SSE request: ${finalUrl}`);
              } catch (e) {
                logger.error(`Failed to build proxy URL: ${e}`);
              }
            }
          } else {
            logger.info(`[MCP SSE] No proxy, direct request: ${urlString}`);
          }

          // 添加超时支持
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => {
              controller.abort();
            },
            (config.timeout || 30) * 1000,
          );

          try {
            // 使用统一的 fetch，自动处理 Tauri 环境
            const finalUrlString =
              typeof finalUrl === "string" ? finalUrl : finalUrl.toString();

            logger.info(`[MCP SSE] Fetching: ${finalUrlString}`);

            const response = await fetch(finalUrlString, {
              ...init,
              headers,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(
                `SSE request failed: ${response.status} ${response.statusText}`,
              );
            }

            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        },
      },
      requestInit: {
        headers: {
          "Content-Type": "application/json",
          ...(config.headers || {}),
        },
      },
    };

    return new SSEClientTransport(new URL(config.baseUrl), options);
  }

  /**
   * 创建 StreamableHTTP 传输
   */
  private static createStreamableHTTPTransport(
    _id: string,
    config: ServerConfig,
  ): StreamableHTTPClientTransport {
    // Normalize baseUrl to avoid browser CORS where possible
    const baseUrl = config.baseUrl;
    config = { ...config, baseUrl };
    if (!config.baseUrl) {
      throw new Error(`Base URL is required for StreamableHTTP transport`);
    }

    logger.debug(
      `Creating StreamableHTTP transport with URL: ${config.baseUrl}`,
    );

    // 处理代理配置
    let finalUrl = config.baseUrl;

    // 统一的代理处理
    if (config.useProxy) {
      if (isTauriApp()) {
        // Tauri 环境：直接使用目标 URL，fetch 会自动使用 Rust 代理
        finalUrl = config.baseUrl;
        logger.debug(`Using unified fetch for MCP StreamableHTTP: ${finalUrl}`);
      } else {
        // 非 Tauri 环境：使用代理 URL
        const proxyUrl = getProxyUrl(config.useProxy, config.proxyUrl);
        try {
          const u = new URL(`${proxyUrl}/api/mcp-proxy`);
          u.searchParams.append("endpoint", config.baseUrl);
          finalUrl = u.toString();
          logger.debug(`Using proxy for MCP StreamableHTTP: ${finalUrl}`);
        } catch (e) {
          logger.error(`Failed to build proxy URL: ${e}`);
        }
      }
    }

    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(config.headers || {}),
    };

    const options = {
      requestInit: {
        headers,
        // 添加超时支持
        signal: AbortSignal.timeout((config.timeout || 30) * 1000),
      },
      // 使用统一的 fetch，自动处理 Tauri 环境
      fetch: async (url: string | URL | Request, init?: RequestInit) => {
        const urlString = url instanceof Request ? url.url : url.toString();
        logger.info(`[StreamableHTTP] Fetching: ${urlString}`);
        return fetch(urlString, init);
      },
    };

    return new StreamableHTTPClientTransport(new URL(finalUrl), options);
  }

  /**
   * 验证传输配置 (网页端专用)
   */
  static validateConfig(config: ServerConfig): void {
    switch (config.type) {
      case "sse":
      case "streamableHttp":
        if (!config.baseUrl) {
          throw new Error(`Base URL is required for ${config.type} transport`);
        }
        try {
          new URL(config.baseUrl);
        } catch (error) {
          throw new Error(`Invalid base URL: ${config.baseUrl}`);
        }
        break;

      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
}

/**
 * 创建 MCP 客户端 (网页端专用)
 */
export async function createMCPClient(
  id: string,
  config: ServerConfig,
): Promise<Client> {
  // 验证配置
  TransportFactory.validateConfig(config);

  // 创建SSE传输
  const transport = await TransportFactory.createTransport(id, config);

  // 创建客户端
  const client = new Client(
    {
      name: `nextchat-mcp-client-${id}`,
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  // 连接传输
  await client.connect(transport);

  logger.success(`Client ${id} connected successfully using SSE transport`);

  return client;
}
