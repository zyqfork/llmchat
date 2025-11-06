// ref: https://spec.modelcontextprotocol.io/specification/basic/messages/

import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export interface McpRequestMessage {
  jsonrpc?: "2.0";
  id?: string | number;
  method: "tools/call" | string;
  params?: {
    [key: string]: unknown;
  };
}

export const McpRequestMessageSchema: z.ZodType<McpRequestMessage> = z.object({
  jsonrpc: z.literal("2.0").optional(),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

export interface McpResponseMessage {
  jsonrpc?: "2.0";
  id?: string | number;
  result?: {
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export const McpResponseMessageSchema: z.ZodType<McpResponseMessage> = z.object(
  {
    jsonrpc: z.literal("2.0").optional(),
    id: z.union([z.string(), z.number()]).optional(),
    result: z.record(z.unknown()).optional(),
    error: z
      .object({
        code: z.number(),
        message: z.string(),
        data: z.unknown().optional(),
      })
      .optional(),
  },
);

export interface McpNotifications {
  jsonrpc?: "2.0";
  method: string;
  params?: {
    [key: string]: unknown;
  };
}

export const McpNotificationsSchema: z.ZodType<McpNotifications> = z.object({
  jsonrpc: z.literal("2.0").optional(),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

////////////
// Next Chat
////////////
export interface ListToolsResponse {
  tools: {
    name?: string;
    description?: string;
    inputSchema?: object;
    [key: string]: any;
  };
}

export type McpClientData =
  | McpActiveClient
  | McpErrorClient
  | McpInitializingClient;

interface McpInitializingClient {
  client: null;
  tools: null;
  errorMsg: null;
}

interface McpActiveClient {
  client: Client;
  tools: ListToolsResponse;
  errorMsg: null;
}

interface McpErrorClient {
  client: null;
  tools: null;
  errorMsg: string;
}

// 服务器状态类型
export type ServerStatus =
  | "undefined"
  | "active"
  | "paused"
  | "error"
  | "initializing";

export interface ServerStatusResponse {
  status: ServerStatus;
  errorMsg: string | null;
}

// MCP 传输协议类型 (网页端支持HTTP-based协议)
export type MCPTransportType = "sse" | "streamableHttp";

// MCP 服务器配置相关类型 (网页端专用 - 支持HTTP-based协议)
export interface ServerConfig {
  // 传输协议类型
  type: MCPTransportType;

  // HTTP 协议配置 (SSE 和 Streamable HTTP 共用)
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number; // 超时时间（秒）

  // 代理配置
  useProxy?: boolean; // 是否启用代理
  proxyUrl?: string; // 代理服务器地址

  // 认证配置（预留）
  // authProvider?: AuthConfig;

  // 服务器状态
  status?: "active" | "paused" | "error" | "initializing";

  // 服务器元信息
  name?: string;
  description?: string;
  provider?: string;
  providerUrl?: string;
  logoUrl?: string;
  tags?: string[];

  // 记录添加时间（用于手动添加的服务器排序）
  addedAt?: number;

  // 禁用的工具列表
  disabledTools?: string[];
  disabledAutoApproveTools?: string[];
}

// 传输类型显示名称映射
export const TRANSPORT_TYPE_LABELS: Record<MCPTransportType, string> = {
  sse: "SSE (Server-Sent Events)",
  streamableHttp: "Streamable HTTP",
};

// 传输类型描述
export const TRANSPORT_TYPE_DESCRIPTIONS: Record<MCPTransportType, string> = {
  sse: "基于 Server-Sent Events 的单向流式传输，适合服务器主动推送数据",
  streamableHttp: "基于 HTTP 的双向流式传输，支持请求-响应模式",
};

// MCP 工具调用模式
export type McpCallMode = "prompt" | "function_call";

export const MCP_CALL_MODE_LABELS: Record<McpCallMode, string> = {
  prompt: "提示词模式 (Prompt-based)",
  function_call: "函数调用模式 (Function Call)",
};

export const MCP_CALL_MODE_DESCRIPTIONS: Record<McpCallMode, string> = {
  prompt:
    "通过系统提示词指导 AI 生成特定格式的代码块来调用工具，兼容性好但可能不够精确",
  function_call:
    "使用 OpenAI Function Calling API 直接调用工具，更精确但需要模型支持",
};

export interface McpConfigData {
  // MCP Server 的配置
  mcpServers: Record<string, ServerConfig>;
  // 自定义系统提示词模板
  customSystemPrompt?: string;
  customToolsPrompt?: string;
  // MCP 工具调用模式
  callMode?: McpCallMode;
}

export const DEFAULT_MCP_CONFIG: McpConfigData = {
  mcpServers: {},
  customSystemPrompt: undefined,
  customToolsPrompt: undefined,
  callMode: "prompt", // 默认使用提示词模式
};

// SSE传输协议配置类型 (网页端专用)
export interface SSETransportConfig {
  type: "sse";
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  // authProvider?: AuthConfig;
}

// Streamable HTTP传输协议配置类型 (网页端专用)
export interface StreamableHTTPTransportConfig {
  type: "streamableHttp";
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  // authProvider?: AuthConfig;
}

export type AnyTransportConfig =
  | SSETransportConfig
  | StreamableHTTPTransportConfig;

// 向后兼容的类型别名
export type TransportType = MCPTransportType;

export interface PresetServer {
  // MCP Server 的唯一标识，作为最终配置文件 Json 的 key
  id: string;

  // MCP Server 的显示名称
  name: string;

  // MCP Server 的描述
  description: string;

  // MCP Server 的仓库地址
  repo: string;

  // MCP Server 的标签
  tags: string[];

  // 传输协议类型
  transportType: MCPTransportType;

  // HTTP传输协议配置 (网页端专用)
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;

  // 认证配置（预留）
  // authProvider?: AuthConfig;

  // MCP Server 是否需要配置
  configurable: boolean;

  // MCP Server 的配置 schema (预留)
  configSchema?: {
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        required?: boolean;
        minItems?: number;
      }
    >;
  };
}
