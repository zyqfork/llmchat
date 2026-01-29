import { ModelProvider, ServiceProvider } from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

const providerConfig = ServiceProvider.OpenRouter;
const ALLOWED_PATH = new Set(Object.values(providerConfig.endpoints));

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: providerConfig.name,
    modelProvider: ModelProvider.OpenRouter,
    allowedPaths: ALLOWED_PATH,
    chatPaths: [providerConfig.endpoints.chat],
    responsePaths: providerConfig.endpoints.response
      ? [providerConfig.endpoints.response]
      : [],
    imagePaths: providerConfig.endpoints.image
      ? [providerConfig.endpoints.image]
      : [],
    speechPaths: providerConfig.endpoints.speech
      ? [providerConfig.endpoints.speech]
      : [],
    apiPath: providerConfig.apiPath,
    defaultBaseURL: providerConfig.defaultBaseUrl,
    envApiKeyName: providerConfig.envApiKeyName,
    envBaseURLName: providerConfig.envBaseUrlName,
    provider: providerConfig.sdkType,
    modelListPath: providerConfig.endpoints.models,
  });
}
