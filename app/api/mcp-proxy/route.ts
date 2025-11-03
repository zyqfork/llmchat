import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  return handleMCPProxy(req);
}

export async function POST(req: NextRequest) {
  return handleMCPProxy(req);
}

async function handleMCPProxy(req: NextRequest) {
  console.log("[MCP Proxy] Request received");

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 从URL参数中获取endpoint
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing endpoint parameter" },
      { status: 400 },
    );
  }

  // 移除代理相关参数
  req.nextUrl.searchParams.delete("endpoint");

  // 构建目标URL
  const remainingParams = req.nextUrl.searchParams.toString();
  const fetchUrl = remainingParams
    ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${remainingParams}`
    : endpoint;

  console.log("[MCP Proxy] Proxying to:", fetchUrl);

  // 准备headers
  const skipHeaders = [
    "connection",
    "host",
    "origin",
    "referer",
    "cookie",
    "accept-encoding", // 不转发accept-encoding，让fetch自动处理
  ];

  const headers = new Headers(
    Array.from(req.headers.entries()).filter((item) => {
      if (
        item[0].indexOf("x-") > -1 ||
        item[0].indexOf("sec-") > -1 ||
        skipHeaders.includes(item[0])
      ) {
        return false;
      }
      return true;
    }),
  );

  // 创建请求
  const controller = new AbortController();
  const fetchOptions: RequestInit = {
    headers,
    method: req.method,
    body: req.body,
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // 复制响应头
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    newHeaders.set("X-Accel-Buffering", "no");

    // 删除content-encoding，因为fetch会自动解压
    const contentEncoding = res.headers.get("content-encoding");
    if (contentEncoding) {
      newHeaders.delete("content-encoding");
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error("[MCP Proxy] Error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
