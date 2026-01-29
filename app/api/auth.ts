import { NextRequest } from "next/server";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  ServiceProvider,
  getAllProviders,
} from "../constant";
import { logger } from "../utils/logger";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
  };
}

export function auth(req: NextRequest, modelProvider: ModelProvider) {
  const authToken = req.headers.get("Authorization") ?? "";
  const xGoogApiKey = req.headers.get("x-goog-api-key") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  logger.debug("[User IP] ", getIP(req));
  logger.debug("[Time] ", new Date().toLocaleString());

  // 检查是否有服务器端配置
  const serverAccessCode = process.env.ACCESS_CODE || "";
  const hasValidAccessCode =
    serverAccessCode && accessCode === serverAccessCode;

  // 获取服务器端API密钥（动态根据模型提供商）
  let serverApiKey = "";
  if (hasValidAccessCode) {
    // 查找对应的服务提供商配置
    const provider = getAllProviders().find(
      (p) => p.modelProvider === modelProvider,
    );
    if (provider) {
      serverApiKey = process.env[provider.envApiKeyName] || "";
    }
  }

  // 对于Google，检查x-goog-api-key头部
  const finalApiKey =
    modelProvider === ModelProvider.GeminiPro ? xGoogApiKey || apiKey : apiKey;

  // 如果有有效的访问码和服务器端API密钥，允许通过
  if (hasValidAccessCode && serverApiKey) {
    logger.debug("[Auth] use server api key");
    return {
      error: false,
      useServerConfig: true,
    };
  }

  // 否则必须提供用户自己的API密钥
  if (!finalApiKey) {
    return {
      error: true,
      msg: "Empty api key",
    };
  }

  logger.debug("[Auth] use user api key");

  return {
    error: false,
    useServerConfig: false,
  };
}
