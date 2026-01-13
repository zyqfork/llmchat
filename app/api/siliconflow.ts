import { SILICONFLOW_BASE_URL, ApiPath, ModelProvider } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth";
import { logger } from "@/app/utils/logger";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  logger.debug("[SiliconFlow Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 检查是否有endpoint参数，如果有则使用代理模式
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    logger.debug(
      "[SiliconFlow Route] Using proxy mode with endpoint:",
      endpoint,
    );
    const { handle: proxyHandler } = await import("./proxy");
    return proxyHandler(req, { params });
  }

  const authResult = auth(req, ModelProvider.SiliconFlow);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const response = await request(req, authResult.useServerConfig);
    return response;
  } catch (e) {
    logger.error("[SiliconFlow] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

async function request(req: NextRequest, useServerConfig?: boolean) {
  const controller = new AbortController();

  // siliconflow use base url or just remove the path
  let path = `${req.nextUrl.pathname}`.replaceAll(ApiPath.SiliconFlow, "");

  let baseUrl = useServerConfig
    ? process.env.SILICONFLOW_BASE_URL || SILICONFLOW_BASE_URL
    : SILICONFLOW_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  logger.debug("[Proxy] ", path);
  logger.debug("[Base Url]", baseUrl);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const fetchUrl = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 设置 Authorization
  if (useServerConfig) {
    const serverApiKey = process.env.SILICONFLOW_API_KEY || "";
    headers["Authorization"] = `Bearer ${serverApiKey}`;
  } else {
    headers["Authorization"] = req.headers.get("Authorization") ?? "";
  }

  const fetchOptions: RequestInit = {
    headers,
    method: req.method,
    body: req.body,
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // 纯前端应用，不限制模型使用，由用户API密钥权限决定
  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
