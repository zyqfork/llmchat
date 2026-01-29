import { NextRequest } from "next/server";
import { auth } from "./auth";
import { ServiceProvider, ModelProvider } from "@/app/constant";
import { logger } from "@/app/utils/logger";
import {
  handleChatRequest,
  parseChatRequest,
  convertMessages,
  handleModelsRequest,
  type OpenAICompatibleConfig,
} from "@/app/api/sdk-utils";
import { prettyObject } from "@/app/utils/format";
import { NextResponse } from "next/server";

const providerConfig = ServiceProvider.Google;

export async function handle(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 检查是否有endpoint参数，如果有则使用代理模式
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    logger.debug("[Google Route] Using proxy mode with endpoint:", endpoint);
    const { handle: proxyHandler } = await import("./proxy");
    return proxyHandler(req, { params });
  }

  const authResult = auth(req, ModelProvider.GeminiPro);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const path = `${req.nextUrl.pathname}`.replaceAll(
      providerConfig.apiPath,
      "",
    );

    // 获取API密钥
    let apiKey = "";
    if (authResult.useServerConfig) {
      apiKey = process.env[providerConfig.envApiKeyName] || "";
    } else {
      const bearToken =
        req.headers.get(providerConfig.authHeaderName!) ||
        req.headers.get("Authorization") ||
        "";
      apiKey = bearToken.trim().replaceAll("Bearer ", "").trim();
    }

    if (!apiKey) {
      throw new Error("Missing API key");
    }

    // 获取Base URL
    const baseURL = authResult.useServerConfig
      ? process.env[providerConfig.envBaseUrlName!] ||
        providerConfig.defaultBaseUrl
      : providerConfig.defaultBaseUrl;

    const normalizedBaseURL = baseURL.startsWith("http")
      ? baseURL
      : `https://${baseURL}`;

    // 处理模型列表请求
    if (path === `/${providerConfig.endpoints.models}` || path === "/models") {
      logger.debug("[Google] Using SDK for models list");
      return await handleModelsRequest({
        provider: providerConfig.sdkType,
        apiKey,
        baseURL: normalizedBaseURL,
      });
    }

    // 处理聊天请求 - Google使用不同的路径格式
    if (
      path.includes("streamGenerateContent") ||
      path.includes("generateContent")
    ) {
      logger.debug("[Google] Using SDK for chat");

      const chatParams = await parseChatRequest(req);

      // 从路径中提取模型名称，例如 /v1beta/models/gemini-pro:streamGenerateContent
      const modelMatch = path.match(/\/v1beta\/models\/([^:]+)/);
      const modelName = modelMatch
        ? modelMatch[1]
        : chatParams.model || "gemini-pro";

      return await handleChatRequest({
        provider: providerConfig.sdkType,
        apiKey,
        baseURL: normalizedBaseURL,
        model: modelName,
        messages: convertMessages(chatParams.messages),
        stream: chatParams.stream || path.includes("streamGenerateContent"),
        temperature: chatParams.temperature,
        maxTokens: chatParams.max_tokens,
        topP: chatParams.top_p,
        // Google不支持这些参数
        frequencyPenalty: undefined,
        presencePenalty: undefined,
        stop: chatParams.stop,
      });
    }

    // 不支持的端点
    return NextResponse.json(
      { error: true, msg: "Endpoint not supported with SDK" },
      { status: 400 },
    );
  } catch (e) {
    logger.error("[Google] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
export const preferredRegion = [
  "bom1",
  "cle1",
  "cpt1",
  "gru1",
  "hnd1",
  "iad1",
  "icn1",
  "kix1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
];
