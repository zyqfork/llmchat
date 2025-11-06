import { BYTEDANCE_BASE_URL, ApiPath, ModelProvider } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[ByteDance Route] 🚀 API被调用，params:", params);
  console.log("[ByteDance Route] 🚀 请求方法:", req.method);
  console.log("[ByteDance Route] 🚀 请求路径:", req.nextUrl.pathname);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 检查是否有endpoint参数，如果有则使用代理模式
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    console.log("[ByteDance Route] Using proxy mode with endpoint:", endpoint);
    const { handle: proxyHandler } = await import("./proxy");
    return proxyHandler(req, { params });
  }

  const authResult = auth(req, ModelProvider.Doubao);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const response = await request(req, authResult.useServerConfig);
    return response;
  } catch (e) {
    console.error("[ByteDance] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

async function request(req: NextRequest, useServerConfig?: boolean) {
  console.log("[ByteDance Request] 🔥 开始处理请求");
  const controller = new AbortController();

  let path = `${req.nextUrl.pathname}`.replaceAll(ApiPath.ByteDance, "");

  let baseUrl = useServerConfig
    ? process.env.BYTEDANCE_BASE_URL || BYTEDANCE_BASE_URL
    : BYTEDANCE_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[Proxy] ", path);
  console.log("[Base Url]", baseUrl);

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
    const serverApiKey = process.env.BYTEDANCE_API_KEY || "";
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
