import { NextRequest, NextResponse } from "next/server";
import { getAllProviders } from "../../constant";

// 获取服务器端配置的API端点（需要访问码验证）
async function handle(req: NextRequest) {
  try {
    const { accessCode } = await req.json();
    const serverAccessCode = process.env.ACCESS_CODE || "";

    // 验证访问码
    if (serverAccessCode && accessCode !== serverAccessCode) {
      return NextResponse.json(
        {
          error: true,
          message: "访问码错误",
        },
        { status: 401 },
      );
    }

    // 动态生成所有厂商的服务器端配置
    const providers = getAllProviders();
    const config: Record<string, any> = {};

    providers.forEach((provider) => {
      const apiKey = process.env[provider.envApiKeyName] || "";
      const baseUrl = provider.envBaseUrlName
        ? process.env[provider.envBaseUrlName] || ""
        : "";

      config[provider.id] = {
        apiKey,
        baseUrl,
      };

      // Azure 特殊处理 - 需要 API 版本
      if (provider.id === "azure") {
        config[provider.id].apiVersion = process.env.AZURE_API_VERSION || "";
      }
    });

    return NextResponse.json({
      error: false,
      config,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: true,
        message: "请求格式错误",
      },
      { status: 400 },
    );
  }
}

export const POST = handle;
export const runtime = "edge";
