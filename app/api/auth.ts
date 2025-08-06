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

  // 检查是否有服务器端配置
  const serverAccessCode = process.env.ACCESS_CODE || "";
  const hasValidAccessCode =
    serverAccessCode && accessCode === serverAccessCode;

  // 获取服务器端API密钥（根据模型提供商）
  let serverApiKey = "";
  if (hasValidAccessCode) {
    switch (modelProvider) {
      case ModelProvider.GPT:
        serverApiKey = process.env.OPENAI_API_KEY || "";
        break;
      case ModelProvider.GeminiPro:
        serverApiKey = process.env.GOOGLE_API_KEY || "";
        break;
      case ModelProvider.Claude:
        serverApiKey = process.env.ANTHROPIC_API_KEY || "";
        break;
      case ModelProvider.Doubao:
        serverApiKey = process.env.BYTEDANCE_API_KEY || "";
        break;
      case ModelProvider.Qwen:
        serverApiKey = process.env.ALIBABA_API_KEY || "";
        break;
      case ModelProvider.Moonshot:
        serverApiKey = process.env.MOONSHOT_API_KEY || "";
        break;
      case ModelProvider.DeepSeek:
        serverApiKey = process.env.DEEPSEEK_API_KEY || "";
        break;
      case ModelProvider.XAI:
        serverApiKey = process.env.XAI_API_KEY || "";
        break;
      case ModelProvider.SiliconFlow:
        serverApiKey = process.env.SILICONFLOW_API_KEY || "";
        break;
    }
  }

  // 对于Google，检查x-goog-api-key头部
  const finalApiKey =
    modelProvider === ModelProvider.GeminiPro ? xGoogApiKey || apiKey : apiKey;

  // 如果有有效的访问码和服务器端API密钥，允许通过
  if (hasValidAccessCode && serverApiKey) {
    console.log("[Auth] use server api key");
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

  console.log("[Auth] use user api key");

  return {
    error: false,
    useServerConfig: false,
  };
}
