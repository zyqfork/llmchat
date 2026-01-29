import { NextRequest, NextResponse } from "next/server";
import { CustomProvider } from "../store/access";
import { getAllProviders } from "../constant";
import { logger } from "../utils/logger";

// 获取自定义服务商配置
function getCustomProviderConfig(req: NextRequest): CustomProvider | null {
  try {
    // 从请求头获取自定义服务商配置
    const configHeader = req.headers.get("x-custom-provider-config");
    if (configHeader) {
      // 解码Base64编码的配置
      const decodedBytes = atob(configHeader);
      const decoder = new TextDecoder();
      const uint8Array = new Uint8Array(
        decodedBytes.split("").map((char) => char.charCodeAt(0)),
      );
      const configJson = decoder.decode(uint8Array);
      return JSON.parse(configJson) as CustomProvider;
    }
    return null;
  } catch (error) {
    logger.error("[Custom Provider] Failed to get config:", error);
    return null;
  }
}

// 根据自定义服务商类型路由到相应的处理器
export async function handle(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  logger.debug("[Custom Provider Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 获取自定义服务商配置
  const customConfig = getCustomProviderConfig(req);

  if (!customConfig) {
    return NextResponse.json(
      { error: "Custom provider not found or not configured" },
      { status: 404 },
    );
  }

  if (!customConfig.enabled) {
    return NextResponse.json(
      { error: "Custom provider is disabled" },
      { status: 403 },
    );
  }

  // 设置自定义配置到请求头，供下游处理器使用
  const modifiedHeaders = new Headers(req.headers);
  modifiedHeaders.set("x-custom-provider-id", params.provider);
  modifiedHeaders.set("x-custom-provider-type", customConfig.type);
  modifiedHeaders.set("x-custom-provider-api-key", customConfig.apiKey);
  if (customConfig.endpoint) {
    modifiedHeaders.set("x-custom-provider-endpoint", customConfig.endpoint);
  }

  // 创建修改后的请求
  const modifiedReq = new NextRequest(req.url, {
    method: req.method,
    headers: modifiedHeaders,
    body: req.body,
  });

  // 现在直接使用统一的代理逻辑，而不是导入 handle 函数
  // 构建目标 URL
  const provider = getAllProviders().find((p) => p.id === customConfig.type);
  if (!provider) {
    return NextResponse.json(
      { error: `Provider type ${customConfig.type} not found` },
      { status: 404 },
    );
  }

  const targetUrl = new URL(
    params.path.join("/"),
    customConfig.endpoint || (provider as any).defaultBaseUrl,
  );

  // 复制查询参数
  const searchParams = new URLSearchParams(req.nextUrl.searchParams);
  targetUrl.search = searchParams.toString();

  // 准备请求头
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  // 设置认证头
  const authHeader = provider.authHeaderName || "Authorization";
  if (authHeader === "Authorization") {
    headers.set("Authorization", `Bearer ${customConfig.apiKey}`);
  } else {
    headers.set(authHeader, customConfig.apiKey);
  }

  // 复制其他必要的头
  const allowedHeaders = ["user-agent", "accept", "accept-encoding"];
  allowedHeaders.forEach((header) => {
    const value = req.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  });

  // 准备请求体
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "DELETE") {
    body = await req.text();
  }

  // 发送请求
  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body,
  });

  // 返回响应
  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    },
  });
}
