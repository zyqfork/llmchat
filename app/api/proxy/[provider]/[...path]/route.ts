import { NextRequest, NextResponse } from "next/server";
import { getAllProviders } from "../../../../constant";
import { logger } from "../../../../utils/logger";

async function handleRequest(
  req: NextRequest,
  params: { provider: string; path: string[] },
  method: string,
) {
  try {
    const { provider: providerId, path } = params;

    // 查找厂商配置
    const provider = getAllProviders().find((p) => p.id === providerId);
    if (!provider) {
      return NextResponse.json(
        { error: `Provider ${providerId} not found` },
        { status: 404 },
      );
    }

    // 从请求头获取配置信息（由客户端或其他中间件设置）
    const apiKey =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.headers
        .get(provider.authHeaderName || "authorization")
        ?.replace("Bearer ", "");
    const baseUrl =
      req.headers.get("x-base-url") || (provider as any).defaultBaseUrl;

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not provided for ${providerId}` },
        { status: 401 },
      );
    }

    // 构建目标 URL
    const targetUrl = new URL(path.join("/"), baseUrl);

    // 复制查询参数
    const searchParams = new URLSearchParams(req.nextUrl.searchParams);
    targetUrl.search = searchParams.toString();

    // 准备请求头
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    // 设置认证头
    const authHeader = provider.authHeaderName || "Authorization";
    if (authHeader === "Authorization") {
      headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      headers.set(authHeader, apiKey);
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
    if (method !== "GET" && method !== "DELETE") {
      body = await req.text();
    }

    // 发送请求
    const response = await fetch(targetUrl.toString(), {
      method,
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
  } catch (error) {
    logger.error(`[Proxy API] Error for ${params.provider}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  return handleRequest(req, params, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  return handleRequest(req, params, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  return handleRequest(req, params, "PUT");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  return handleRequest(req, params, "DELETE");
}
