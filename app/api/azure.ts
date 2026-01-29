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

const providerConfig = ServiceProvider.Azure;

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  logger.debug("[Azure Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 检查是否有endpoint参数，如果有则使用代理模式
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    logger.debug("[Azure Route] Using proxy mode with endpoint:", endpoint);
    const { handle: proxyHandler } = await import("./proxy");
    return proxyHandler(req, { params });
  }

  const subpath = params.path.join("/");

  const authResult = auth(req, ModelProvider.GPT);
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
    const apiKey = authResult.useServerConfig
      ? process.env[providerConfig.envApiKeyName] || ""
      : req.headers.get("Authorization")?.replace("Bearer ", "") ||
        req.headers.get("api-key") ||
        "";

    if (!apiKey) {
      throw new Error("Missing API key");
    }

    // 从路径中解析Azure特有的参数
    // 路径格式: /deployments/{deployment-name}/chat/completions?api-version={api-version}
    const deploymentMatch = path.match(/\/deployments\/([^\/]+)/);
    const deploymentName = deploymentMatch ? deploymentMatch[1] : "";

    const apiVersion =
      req.nextUrl.searchParams.get("api-version") ||
      providerConfig.azure?.apiVersion ||
      "2024-02-01";

    // 从环境变量或请求头获取资源名称
    const resourceName = authResult.useServerConfig
      ? process.env.AZURE_RESOURCE_NAME || ""
      : req.headers.get("azure-resource-name") || "";

    // 处理聊天请求
    if (path.includes(providerConfig.endpoints.chat)) {
      logger.debug("[Azure] Using SDK for chat");

      const chatParams = await parseChatRequest(req);

      return await handleChatRequest({
        provider: providerConfig.sdkType,
        apiKey,
        baseURL: "", // Azure SDK不需要baseURL
        model: chatParams.model,
        messages: convertMessages(chatParams.messages),
        stream: chatParams.stream,
        temperature: chatParams.temperature,
        maxTokens: chatParams.max_tokens,
        topP: chatParams.top_p,
        frequencyPenalty: chatParams.frequency_penalty,
        presencePenalty: chatParams.presence_penalty,
        stop: chatParams.stop,
        // Azure特有配置
        resourceName,
        deploymentName,
        apiVersion,
      });
    }

    // 处理模型列表请求
    if (path.includes("models")) {
      logger.debug("[Azure] Using SDK for models list");
      // Azure的模型列表需要特殊处理，因为它使用部署名称
      return NextResponse.json({
        data: [
          {
            id: deploymentName || "gpt-35-turbo",
            object: "model",
            created: Date.now(),
            owned_by: "azure",
          },
        ],
        object: "list",
      });
    }

    // 不支持的端点
    return NextResponse.json(
      { error: true, msg: "Endpoint not supported with SDK" },
      { status: 400 },
    );
  } catch (e) {
    logger.error("[Azure] ", e);
    return NextResponse.json(prettyObject(e));
  }
}
