import { ServiceProvider, ModelProvider } from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

const providerConfig = ServiceProvider.Alibaba;

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: providerConfig.name,
    modelProvider: ModelProvider.Qwen,
    allowedPaths: new Set([
      providerConfig.endpoints.chat,
      providerConfig.endpoints.response!,
      providerConfig.endpoints.models!,
    ]),
    chatPaths: [providerConfig.endpoints.chat],
    responsePaths: providerConfig.endpoints.response
      ? [providerConfig.endpoints.response]
      : [],
    apiPath: providerConfig.apiPath,
    defaultBaseURL: providerConfig.defaultBaseUrl,
    envApiKeyName: providerConfig.envApiKeyName,
    envBaseURLName: providerConfig.envBaseUrlName,
    provider: providerConfig.sdkType,
    providerDisplayName: providerConfig.id,
    modelListPath: providerConfig.endpoints.models,
  });
}
