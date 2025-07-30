import { NextRequest } from "next/server";
import { ACCESS_CODE_PREFIX, ModelProvider } from "../constant";

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

  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  // 纯前端应用，用户必须提供自己的API密钥
  // 对于Google，检查x-goog-api-key头部
  const finalApiKey =
    modelProvider === ModelProvider.GeminiPro ? xGoogApiKey || apiKey : apiKey;

  if (!finalApiKey) {
    return {
      error: true,
      msg: "Empty api key",
    };
  }

  console.log("[Auth] use user api key");

  return {
    error: false,
  };
}
