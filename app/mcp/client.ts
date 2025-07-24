import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { MCPClientLogger } from "./logger";
import { ListToolsResponse, McpRequestMessage, ServerConfig } from "./types";
import { z } from "zod";
import { createMCPClient } from "./transport-factory";

const logger = new MCPClientLogger();

export async function createClient(
  id: string,
  config: ServerConfig,
): Promise<Client> {
  logger.info(`Creating client for ${id}...`);

  // 使用新的传输工厂创建客户端
  return await createMCPClient(id, config);
}

export async function removeClient(client: Client) {
  logger.info(`Removing client...`);
  await client.close();
}

export async function listTools(client: Client): Promise<ListToolsResponse> {
  return client.listTools();
}

export async function executeRequest(
  client: Client,
  request: McpRequestMessage,
): Promise<any> {
  // 使用类型断言避免复杂的类型推断
  return (client as any).request(request, z.object({}).passthrough());
}
