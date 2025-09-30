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

export async function getAllTools() {
  const list = [] as any[];
  for (const [clientId, status] of clientsMap.entries()) {
    list.push({ clientId, tools: status.tools });
  }
  return list;
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
  } catch (e) {
    clientsMap.set(clientId, {
      client: null,
      tools: null,
      errorMsg: e instanceof Error ? e.message : String(e),
    });
    logger.error(`Failed to init client [${clientId}]: ${e}`);
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
  const runtime = clientsMap.get(clientId);
  if (runtime?.client) await removeClient(runtime.client);
  clientsMap.delete(clientId);
  return next;
}

export async function validateMcpServer(config: ServerConfig): Promise<void> {
  // Try to create a throwaway client and list tools to validate connectivity/credentials
  try {
    const client = await createClient("__validate__", config);
    await listTools(client);
    // cleanup if created; no need to keep in map
    try {
      await removeClient(client as any);
    } catch {}
  } catch (e) {
    throw e;
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
