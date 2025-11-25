// Client-side implementation for static export builds.
// This file mirrors the exports of ./actions.ts but runs fully in the browser
// using localStorage for persistence and in-memory clients for runtime state.

import {
  DEFAULT_MCP_CONFIG,
  McpConfigData,
  McpRequestMessage,
  ServerConfig,
  ServerStatusResponse,
} from "./types";
import {
  createClient,
  executeRequest,
  listTools,
  removeClient,
} from "./client";
import { MCPClientLogger } from "./logger";

const logger = new MCPClientLogger("MCP Actions (client)");
const LS_KEY = "mcp_config";

// In-memory runtime state for clients
const clientsMap = new Map<
  string,
  {
    client: any | null;
    tools: any | null;
    errorMsg: string | null;
  }
>();

function readConfig(): McpConfigData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_MCP_CONFIG };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_MCP_CONFIG };
    // shallow validate
    if (!("mcpServers" in parsed)) return { ...DEFAULT_MCP_CONFIG };
    return parsed as McpConfigData;
  } catch (e) {
    logger.error(`Failed to read local MCP config: ${String(e)}`);
    return { ...DEFAULT_MCP_CONFIG };
  }
}

function writeConfig(cfg: McpConfigData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch (e) {
    logger.error(`Failed to write local MCP config: ${String(e)}`);
  }
}

export async function getClientsStatus(): Promise<
  Record<string, ServerStatusResponse>
> {
  const cfg = readConfig();
  const result: Record<string, ServerStatusResponse> = {};
  for (const id of Object.keys(cfg.mcpServers)) {
    const serverCfg = cfg.mcpServers[id];
    if (serverCfg.status === "paused") {
      result[id] = { status: "paused", errorMsg: null };
      continue;
    }
    const status = clientsMap.get(id);
    if (!status) {
      result[id] = { status: "undefined", errorMsg: null };
      continue;
    }
    if (status.errorMsg) {
      result[id] = { status: "error", errorMsg: status.errorMsg };
      continue;
    }
    if (status.client) {
      result[id] = { status: "active", errorMsg: null };
      continue;
    }
    result[id] = { status: "initializing", errorMsg: null };
  }
  return result;
}

export async function getClientTools(clientId: string) {
  return clientsMap.get(clientId)?.tools ?? null;
}

export async function getAvailableClientsCount() {
  let count = 0;
  clientsMap.forEach((m) => !m.errorMsg && count++);
  return count;
}

// 工具列表缓存
let cachedAllTools: any[] | null = null;
let cachedFunctionCallTools: any[] | null = null;
let toolsCacheVersion = 0;

// 使工具缓存失效
function invalidateToolsCache() {
  cachedAllTools = null;
  cachedFunctionCallTools = null;
  toolsCacheVersion++;
  logger.info(`Tools cache invalidated (version: ${toolsCacheVersion})`);
}

export async function getAllTools() {
  // 返回缓存的结果
  if (cachedAllTools) {
    return cachedAllTools;
  }

  const list = [] as any[];
  for (const [clientId, status] of clientsMap.entries()) {
    list.push({ clientId, tools: status.tools });
  }

  cachedAllTools = list;
  return list;
}

// 获取 MCP 工具的 OpenAI Function Call 格式定义
export async function getMcpToolsForFunctionCall() {
  // 返回缓存的结果
  if (cachedFunctionCallTools) {
    return cachedFunctionCallTools;
  }

  const cfg = readConfig();
  const tools: any[] = [];

  for (const [clientId, status] of clientsMap.entries()) {
    if (!status.tools?.tools) continue;

    // 检查服务器是否被暂停
    const serverCfg = cfg.mcpServers[clientId];
    if (serverCfg?.status === "paused") continue;

    // 转换 MCP 工具格式为 OpenAI Function Call 格式
    status.tools.tools.forEach((tool: any) => {
      tools.push({
        type: "function",
        function: {
          name: `mcp_${clientId}_${tool.name}`,
          description:
            tool.description || `Tool ${tool.name} from MCP server ${clientId}`,
          parameters: tool.inputSchema || {
            type: "object",
            properties: {},
          },
        },
        // 保存原始信息用于调用
        _mcpMeta: {
          clientId,
          toolName: tool.name,
        },
      });
    });
  }

  cachedFunctionCallTools = tools;
  return tools;
}

// 执行 MCP 请求
export async function executeMcpRequest(
  clientId: string,
  request: McpRequestMessage,
): Promise<any> {
  const status = clientsMap.get(clientId);
  if (!status?.client) {
    throw new Error(`MCP client ${clientId} not found or not initialized`);
  }

  try {
    const result = await executeRequest(status.client, request);
    return result;
  } catch (error) {
    logger.error(`Failed to execute MCP request for ${clientId}: ${error}`);
    throw error;
  }
}

async function initializeSingleClient(
  clientId: string,
  serverConfig: ServerConfig,
) {
  if (serverConfig.status === "paused") {
    logger.info(`Skipping paused client [${clientId}]`);
    return;
  }
  logger.info(`Initializing client [${clientId}]...`);
  clientsMap.set(clientId, { client: null, tools: null, errorMsg: null });
  try {
    const client = await createClient(clientId, serverConfig);
    const tools = await listTools(client);
    clientsMap.set(clientId, { client, tools, errorMsg: null });
    logger.success(`Client [${clientId}] initialized`);

    // 使工具缓存失效
    invalidateToolsCache();
  } catch (e) {
    clientsMap.set(clientId, {
      client: null,
      tools: null,
      errorMsg: e instanceof Error ? e.message : String(e),
    });
    logger.error(`Failed to init client [${clientId}]: ${e}`);

    // 使工具缓存失效
    invalidateToolsCache();
  }
}

export async function initializeMcpSystem() {
  try {
    const cfg = readConfig();
    if (clientsMap.size > 0) {
      logger.info("MCP system already initialized (client)");
      return cfg;
    }
    for (const [clientId, serverConfig] of Object.entries(cfg.mcpServers)) {
      await initializeSingleClient(clientId, serverConfig);
    }
    return cfg;
  } catch (e) {
    logger.error(`Failed to initialize MCP system (client): ${e}`);
    throw e;
  }
}

export async function addMcpServer(
  clientId: string,
  config: ServerConfig,
): Promise<McpConfigData> {
  const current = readConfig();
  const isNew = !(clientId in current.mcpServers);
  if (isNew && !config.status) config.status = "active";
  if (isNew && typeof config.addedAt !== "number") config.addedAt = Date.now();
  const next: McpConfigData = {
    ...current,
    mcpServers: { ...current.mcpServers, [clientId]: config },
  };
  writeConfig(next);
  if (isNew || config.status === "active") {
    await initializeSingleClient(clientId, config);
  }
  return next;
}

export async function pauseMcpServer(clientId: string): Promise<McpConfigData> {
  const current = readConfig();
  const serverCfg = current.mcpServers[clientId];
  if (!serverCfg) throw new Error(`Server ${clientId} not found`);
  const next: McpConfigData = {
    ...current,
    mcpServers: {
      ...current.mcpServers,
      [clientId]: { ...serverCfg, status: "paused" },
    },
  };
  writeConfig(next);
  const runtime = clientsMap.get(clientId);
  if (runtime?.client) {
    await removeClient(runtime.client);
  }
  clientsMap.delete(clientId);
  return next;
}

export async function resumeMcpServer(clientId: string): Promise<void> {
  const current = readConfig();
  const serverCfg = current.mcpServers[clientId];
  if (!serverCfg) throw new Error(`Server ${clientId} not found`);
  try {
    const client = await createClient(clientId, serverCfg);
    const tools = await listTools(client);
    clientsMap.set(clientId, { client, tools, errorMsg: null });
    const next: McpConfigData = {
      ...current,
      mcpServers: {
        ...current.mcpServers,
        [clientId]: { ...serverCfg, status: "active" },
      },
    };
    writeConfig(next);
  } catch (e) {
    clientsMap.set(clientId, {
      client: null,
      tools: null,
      errorMsg: e instanceof Error ? e.message : String(e),
    });
    const cur = readConfig();
    const sc = cur.mcpServers[clientId];
    if (sc) {
      sc.status = "error";
      writeConfig(cur);
    }
    throw e;
  }
}

export async function removeMcpServer(
  clientId: string,
): Promise<McpConfigData> {
  const current = readConfig();
  const { [clientId]: _omit, ...rest } = current.mcpServers;
  const next: McpConfigData = { ...current, mcpServers: rest };
  writeConfig(next);

  // 立即清理客户端资源
  const runtime = clientsMap.get(clientId);
  if (runtime?.client) {
    try {
      await removeClient(runtime.client);
      logger.info(`Client [${clientId}] removed successfully`);
    } catch (e) {
      logger.error(`Failed to remove client [${clientId}]: ${e}`);
    }
  }
  clientsMap.delete(clientId);

  return next;
}

// 清理未使用的客户端（防止内存泄漏）
export async function cleanupUnusedClients() {
  const cfg = readConfig();
  const validIds = new Set(Object.keys(cfg.mcpServers));

  const toRemove: string[] = [];
  for (const [clientId] of clientsMap.entries()) {
    if (!validIds.has(clientId)) {
      toRemove.push(clientId);
    }
  }

  for (const clientId of toRemove) {
    const runtime = clientsMap.get(clientId);
    if (runtime?.client) {
      try {
        await removeClient(runtime.client);
      } catch (e) {
        logger.error(`Failed to cleanup client [${clientId}]: ${e}`);
      }
    }
    clientsMap.delete(clientId);
  }

  if (toRemove.length > 0) {
    logger.info(`Cleaned up ${toRemove.length} unused MCP clients`);
  }

  return toRemove.length;
}

// 启动定期清理任务
export function startMcpCleanupTimer() {
  // 每 10 分钟清理一次未使用的客户端
  const cleanupInterval = setInterval(
    () => {
      cleanupUnusedClients().catch((e) => {
        logger.error(`MCP cleanup failed: ${e}`);
      });
    },
    10 * 60 * 1000,
  );

  logger.info("MCP cleanup timer started (runs every 10 minutes)");

  return cleanupInterval;
}

export async function updateCustomPrompts(
  customSystemPrompt?: string,
  customToolsPrompt?: string,
  callMode?: "prompt" | "function_call",
): Promise<McpConfigData> {
  const current = readConfig();
  const next: McpConfigData = {
    ...current,
    customSystemPrompt,
    customToolsPrompt,
    callMode: callMode || current.callMode || "prompt",
  };
  writeConfig(next);
  return next;
}

export async function validateMcpServer(config: ServerConfig): Promise<void> {
  // 验证基本配置
  if (!config.baseUrl) {
    throw new Error("Base URL is required");
  }

  // 验证 URL 格式
  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error("Invalid Base URL format");
  }

  // 注意：浏览器环境中的 fetch API 对某些 headers 有限制
  // 特别是 Accept header，可能被浏览器修改或忽略，导致 406 错误
  // 我们只做基本的 URL 格式验证，实际的连接验证在 MCP SDK 初始化时进行

  if (config.type === "sse") {
    logger.info(`Validating SSE server at ${config.baseUrl}...`);
    logger.warn(
      "Skipping fetch validation for SSE (browser fetch API limitations with Accept headers)",
    );
    logger.success(
      "SSE server URL format validated, actual connection will be tested during SDK initialization",
    );
  } else if (config.type === "streamableHttp") {
    logger.info(`Validating Streamable HTTP server at ${config.baseUrl}...`);
    logger.warn(
      "Skipping fetch validation for Streamable HTTP (browser fetch API limitations)",
    );
    logger.success(
      "Streamable HTTP server URL format validated, actual connection will be tested during SDK initialization",
    );
  }
}

export async function restartAllClients(): Promise<McpConfigData> {
  for (const runtime of clientsMap.values()) {
    if (runtime.client) await removeClient(runtime.client);
  }
  clientsMap.clear();
  const cfg = readConfig();
  for (const [clientId, serverCfg] of Object.entries(cfg.mcpServers)) {
    await initializeSingleClient(clientId, serverCfg);
  }
  return cfg;
}

export async function executeMcpAction(
  clientId: string,
  request: McpRequestMessage,
) {
  const runtime = clientsMap.get(clientId);
  if (!runtime?.client) throw new Error(`Client ${clientId} not found`);
  return await executeRequest(runtime.client, request);
}

export async function getMcpConfigFromFile(): Promise<McpConfigData> {
  return readConfig();
}

export async function updateMcpConfig(config: McpConfigData): Promise<void> {
  writeConfig(config);
}
