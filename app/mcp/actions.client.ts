// Client-side stub for static export builds. This file avoids Server Actions.
// It mirrors the exports of ./actions.ts but provides safe no-op implementations.

import {
  DEFAULT_MCP_CONFIG,
  McpConfigData,
  McpRequestMessage,
  ServerStatusResponse,
} from "./types";

function notSupported<T = never>(action: string): Promise<T> {
  return Promise.reject(
    new Error(`${action} is not available in static export build.`),
  );
}

export async function getClientsStatus(): Promise<
  Record<string, ServerStatusResponse>
> {
  // No servers running in static export; return empty status map
  return {};
}

export async function getClientTools(clientId: string) {
  // No tools in static export
  return null;
}

export async function getAvailableClientsCount() {
  return 0;
}

export async function getAllTools() {
  return [] as any[];
}

export async function initializeMcpSystem() {
  // No initialization in static export
  return DEFAULT_MCP_CONFIG;
}

export async function addMcpServer(
  clientId: string,
  config: any,
): Promise<McpConfigData> {
  // Pretend to add and return a merged config in-memory so UI can continue
  return {
    ...DEFAULT_MCP_CONFIG,
    mcpServers: {
      ...DEFAULT_MCP_CONFIG.mcpServers,
      [clientId]: config,
    },
  };
}

export async function pauseMcpServer(clientId: string): Promise<McpConfigData> {
  return notSupported<McpConfigData>("pauseMcpServer");
}

export async function resumeMcpServer(
  clientId: string,
): Promise<McpConfigData> {
  return notSupported<McpConfigData>("resumeMcpServer");
}

export async function removeMcpServer(
  clientId: string,
): Promise<McpConfigData> {
  return notSupported<McpConfigData>("removeMcpServer");
}

export async function restartAllClients(): Promise<void> {
  return notSupported<void>("restartAllClients");
}

export async function executeMcpAction(
  clientId: string,
  request: McpRequestMessage,
) {
  return notSupported<any>("executeMcpAction");
}

export async function getMcpConfigFromFile(): Promise<McpConfigData> {
  // No filesystem access in static export; use defaults
  return DEFAULT_MCP_CONFIG;
}

export async function updateMcpConfig(config: McpConfigData): Promise<void> {
  // No-op in static export
  return;
}
