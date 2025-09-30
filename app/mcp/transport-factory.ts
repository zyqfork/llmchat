import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPClientLogger } from "./logger";
import { ServerConfig } from "./types";

const logger = new MCPClientLogger("Transport Factory");

function normalizeMcpBaseUrl(baseUrl: string): string {
  try {
    const u = new URL(baseUrl);
    // Only rewrite known CORS-prone host to our proxy in browser runtime
    if (typeof window !== "undefined" && u.hostname === "mcp.amap.com") {
      const prefix = `${window.location.origin}/api/proxy/mcp`;
      return `${prefix}${u.pathname}${u.search}`;
    }
    return baseUrl;
  } catch {
    return baseUrl;
  }
}

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
    // Normalize baseUrl to avoid browser CORS where possible
    // Do NOT normalize (proxy) for manually added servers (which have `addedAt` set)
    const baseUrl = config.addedAt
      ? config.baseUrl
      : normalizeMcpBaseUrl(config.baseUrl);
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

          // Headers are already set above

          // 添加超时支持
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => {
              controller.abort();
            },
            (config.timeout || 30) * 1000,
          );

          try {
            const response = await fetch(url, {
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
    // Do NOT normalize (proxy) for manually added servers (which have `addedAt` set)
    const baseUrl = config.addedAt
      ? config.baseUrl
      : normalizeMcpBaseUrl(config.baseUrl);
    config = { ...config, baseUrl };
    if (!config.baseUrl) {
      throw new Error(`Base URL is required for StreamableHTTP transport`);
    }

    logger.debug(
      `Creating StreamableHTTP transport with URL: ${config.baseUrl}`,
    );

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
    };

    // Headers are configured above

    return new StreamableHTTPClientTransport(new URL(config.baseUrl), options);
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
