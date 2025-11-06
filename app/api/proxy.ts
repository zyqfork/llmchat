import { NextRequest, NextResponse } from "next/server";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[Proxy Route] 🚀 代理API被调用，params:", params);
  console.log("[Proxy Route] 🚀 请求方法:", req.method);
  console.log("[Proxy Route] 🚀 请求路径:", req.nextUrl.pathname);

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

  // remove path params from searchParams
  req.nextUrl.searchParams.delete("path");
  req.nextUrl.searchParams.delete("provider");
  req.nextUrl.searchParams.delete("endpoint");

  // 直接使用endpoint参数作为目标URL
  // endpoint已经包含了完整的API URL（包括baseUrl和path）
  const remainingParams = req.nextUrl.searchParams.toString();
  const fetchUrl = remainingParams
    ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${remainingParams}`
    : endpoint;

  console.log("[Proxy] Fetching URL:", fetchUrl);
  console.log("[Proxy] Original endpoint:", endpoint);
  console.log("[Proxy] Method:", req.method);

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
  // 纯前端应用，用户需要提供自己的API密钥

  const controller = new AbortController();
  const fetchOptions: RequestInit = {
    headers,
    method: req.method,
    body: req.body,
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
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

    // 检查响应的content-encoding
    const contentEncoding = res.headers.get("content-encoding");

    // 如果响应被压缩，fetch API会自动解压
    // 但我们需要删除content-encoding header，因为返回的body已经是解压后的
    if (contentEncoding) {
      newHeaders.delete("content-encoding");
    }

    // 对于流式响应，需要特殊处理以避免连接中断错误
    if (res.body) {
      const reader = res.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              controller.enqueue(value);
            }
          } catch (error) {
            // 流错误通常是因为连接被对方关闭，这在流式响应结束时是正常的
            // 只记录非预期的错误
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (
              !errorMessage.includes("terminated") &&
              !errorMessage.includes("closed")
            ) {
              console.error("[Proxy] Unexpected stream error:", error);
            }
            // 静默关闭控制器
            try {
              controller.close();
            } catch (e) {
              // 控制器可能已经关闭，忽略错误
            }
          }
        },
        cancel() {
          try {
            reader.cancel();
          } catch (e) {
            // 忽略取消错误
          }
        },
      });

      return new Response(stream, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
      });
    }

    // 如果没有body，直接返回
    return new Response(null, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error("[Proxy] Fetch error:", error);
    console.error("[Proxy] Target URL:", fetchUrl);

    // 返回错误响应而不是抛出异常
    return NextResponse.json(
      {
        error: "Proxy request failed",
        message: error instanceof Error ? error.message : String(error),
        targetUrl: fetchUrl,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
