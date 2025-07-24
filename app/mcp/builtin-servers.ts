import { PresetServer } from "./types";

/**
 * 网页端专用 - 支持基于HTTP的协议服务器
 */
export const BUILTIN_MCP_SERVERS: PresetServer[] = [
  {
    id: "context7",
    name: "Context7",
    description:
      "查询最新库文档和示例的MCP工具，支持多种编程语言和框架的文档查询",
    repo: "https://context7.com",
    tags: ["documentation", "api", "reference", "development"],
    transportType: "streamableHttp",
    baseUrl: "https://mcp.context7.com/mcp",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 30,
    configurable: false,
  },
  {
    id: "edgeone-pages-mcp",
    name: "EdgeOne Pages MCP",
    description:
      "腾讯云EdgeOne Pages部署服务器，专门用于快速部署HTML页面、文件夹和ZIP文件到边缘节点，自动生成公开访问链接",
    repo: "https://edgeone.site",
    tags: [
      "deploy",
      "html",
      "pages",
      "cdn",
      "edge",
      "tencent",
      "cloud",
      "publish",
      "website",
    ],
    transportType: "streamableHttp",
    baseUrl: "https://mcp-on-edge.edgeone.site/mcp-server",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 30,
    configurable: false,
  },
];

/**
 * 根据ID获取内置服务器配置
 */
export function getBuiltinServer(id: string): PresetServer | undefined {
  return BUILTIN_MCP_SERVERS.find((server) => server.id === id);
}

/**
 * 获取所有内置服务器
 */
export function getAllBuiltinServers(): PresetServer[] {
  return [...BUILTIN_MCP_SERVERS];
}

/**
 * 根据标签筛选服务器
 */
export function getServersByTag(tag: string): PresetServer[] {
  return BUILTIN_MCP_SERVERS.filter((server) => server.tags.includes(tag));
}

/**
 * 搜索服务器（按名称和描述）
 */
export function searchServers(query: string): PresetServer[] {
  const lowerQuery = query.toLowerCase();
  return BUILTIN_MCP_SERVERS.filter(
    (server) =>
      server.name.toLowerCase().includes(lowerQuery) ||
      server.description.toLowerCase().includes(lowerQuery) ||
      server.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}
