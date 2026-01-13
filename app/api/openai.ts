import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { ModelProvider, OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { requestOpenai } from "./common";
import { logger } from "@/app/utils/logger";

const ALLOWED_PATH = new Set(Object.values(OpenaiPath));

logger.debug("[OpenAI Route] Allowed paths:", Array.from(ALLOWED_PATH));

function getModels(remoteModelRes: OpenAIListModelResponse) {
  // 纯前端应用，不过滤模型，由用户的API密钥权限决定
  return remoteModelRes;
}

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  logger.debug("[OpenAI Route] 🚀 API被调用，params:", params);
  logger.debug("[OpenAI Route] 🚀 请求方法:", req.method);
  logger.debug("[OpenAI Route] 🚀 请求路径:", req.nextUrl.pathname);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 检查是否有endpoint参数，如果有则使用代理模式
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    logger.debug("[OpenAI Route] Using proxy mode with endpoint:", endpoint);
    // 使用代理逻辑
    const { handle: proxyHandler } = await import("./proxy");
    return proxyHandler(req, { params });
  }

  const subpath = params.path.join("/");

  if (!ALLOWED_PATH.has(subpath)) {
    logger.warn("[OpenAI Route] forbidden path ", subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }

  const authResult = auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const response = await requestOpenai(req, authResult.useServerConfig);

    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    }

    return response;
  } catch (e) {
    logger.error("[OpenAI] ", e);
    return NextResponse.json(prettyObject(e));
  }
}
