import { getAllProviders, getProviderConfig } from "../constant";
import { useAccessStore } from "../store/access";
import { logger } from "../utils/logger";
import { fetch } from "../utils/fetch";
import { LLMModel } from "./api";
import { resolvePiProviderId } from "./pi-provider-resolver";

type PiAiModelCatalogModule = {
  getModels: (provider: string) => Array<{ id: string; name?: string }>;
};

let piAiCatalogPromise: Promise<PiAiModelCatalogModule> | null = null;

async function loadPiAiCatalog(): Promise<PiAiModelCatalogModule | null> {
  if (typeof window === "undefined") return null;
  if (!piAiCatalogPromise) {
    piAiCatalogPromise = import(
      "@mariozechner/pi-ai"
    ) as Promise<PiAiModelCatalogModule>;
  }
  try {
    return await piAiCatalogPromise;
  } catch (error) {
    logger.warn("[ModelFetcher] Failed to load pi-ai catalog module:", error);
    return null;
  }
}

export interface ModelFetchResponse {
  models: LLMModel[];
  success: boolean;
  error?: string;
}

export class ModelFetcher {
  private static async getModelsFromPiAiCatalog(
    providerId: string,
  ): Promise<LLMModel[]> {
    const mappedProvider = await resolvePiProviderId(providerId);
    if (!mappedProvider) return [];
    try {
      const piAiCatalog = await loadPiAiCatalog();
      if (!piAiCatalog?.getModels) return [];
      return piAiCatalog
        .getModels(mappedProvider as any)
        .map((model: any, index: number) => ({
          name: model.id,
          displayName: model.name,
          available: true,
          sorted: index,
          provider: {
            id: providerId,
            providerName: providerId,
            providerType: providerId,
            sorted: 0,
          },
        }));
    } catch (error) {
      logger.warn(
        `[ModelFetcher] Failed to read pi-ai model catalog for ${providerId}:`,
        error,
      );
      return [];
    }
  }

  static async fetchModels(provider: string): Promise<ModelFetchResponse> {
    try {
      const accessStore = useAccessStore.getState();

      if (typeof provider === "string" && provider.startsWith("custom_")) {
        const customProvider = accessStore.customProviders.find(
          (p) => p.id === provider,
        );
        if (!customProvider) {
          return {
            models: [],
            success: false,
            error: `Custom provider ${provider} not found`,
          };
        }
        return await this.fetchCustomProviderModels(customProvider);
      }

      let providerConfig = getProviderConfig(provider);
      if (!providerConfig) {
        providerConfig = getAllProviders().find((p) => p.name === provider);
      }
      if (!providerConfig) {
        return {
          models: [],
          success: false,
          error: `Unsupported provider ${provider}`,
        };
      }

      const providerId = providerConfig.id;

      // Built-in providers should primarily use pi-ai's catalog to avoid
      // provider-specific drift in this codebase.
      const catalogModels = await this.getModelsFromPiAiCatalog(providerId);
      if (catalogModels.length > 0) {
        return { models: catalogModels, success: true };
      }

      // For providers not covered by pi-ai catalog, keep a direct-request fallback.
      return await this.fetchProviderModelsDirectly(providerId, providerConfig);
    } catch (error) {
      logger.error(
        `[ModelFetcher] Failed to fetch models for ${provider}:`,
        error,
      );
      return {
        models: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private static async fetchProviderModelsDirectly(
    providerId: string,
    providerConfig: any,
  ): Promise<ModelFetchResponse> {
    try {
      const accessStore = useAccessStore.getState();
      const apiKey = (accessStore as any)[providerConfig.storeKeys.apiKey];
      const baseUrl =
        (accessStore as any)[providerConfig.storeKeys.baseUrl] ||
        providerConfig.defaultBaseUrl;

      if (!baseUrl) {
        throw new Error("Missing provider endpoint URL");
      }
      if (!apiKey && providerId !== "ollama") {
        throw new Error("Missing API key");
      }

      const endpoint = providerConfig.endpoints?.models || "models";
      const requestUrl = `${baseUrl}/${endpoint}`;
      const headers = this.buildAuthHeaders(
        providerId,
        providerConfig,
        String(apiKey || ""),
      );

      const finalUrl = this.withAzureApiVersionIfNeeded(
        requestUrl,
        providerId,
        providerConfig,
        accessStore,
      );

      const response = await fetch(finalUrl, {
        method: "GET",
        headers,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        models: this.normalizeModelsResponse(data, providerId, providerId),
        success: true,
      };
    } catch (error) {
      return {
        models: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private static withAzureApiVersionIfNeeded(
    requestUrl: string,
    providerId: string,
    providerConfig: any,
    accessStore: any,
  ) {
    if (providerId !== "azure") return requestUrl;
    const apiVersionKey = providerConfig.storeKeys?.apiVersion;
    if (!apiVersionKey) return requestUrl;
    const apiVersion = accessStore?.[apiVersionKey];
    if (!apiVersion) return requestUrl;
    const url = new URL(requestUrl);
    url.searchParams.set("api-version", apiVersion);
    return url.toString();
  }

  private static buildAuthHeaders(
    providerId: string,
    providerConfig: any,
    apiKey: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!apiKey) return headers;

    const authHeaderName = providerConfig?.authHeaderName || "Authorization";
    headers[authHeaderName] =
      authHeaderName.toLowerCase() === "authorization"
        ? `Bearer ${apiKey}`
        : apiKey;

    if (providerId === "anthropic") {
      headers["anthropic-version"] = "2023-06-01";
    }
    return headers;
  }

  private static async fetchCustomProviderModels(
    customProvider: any,
  ): Promise<ModelFetchResponse> {
    try {
      const apiKey = customProvider.apiKey;
      const baseUrl = customProvider.endpoint;
      if (!apiKey) throw new Error("Missing API key");
      if (!baseUrl) throw new Error("Missing endpoint URL");

      const requestUrl = `${baseUrl}/models`;
      const headers = this.buildAuthHeaders(
        customProvider.id,
        {
          authHeaderName:
            customProvider.type === "anthropic"
              ? "x-api-key"
              : customProvider.type === "google"
              ? "x-goog-api-key"
              : "Authorization",
        },
        apiKey,
      );

      const response = await fetch(requestUrl, {
        method: "GET",
        headers,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        models: this.normalizeModelsResponse(
          data,
          customProvider.id,
          customProvider.name,
        ),
        success: true,
      };
    } catch (error) {
      logger.error(
        "[ModelFetcher] Failed to fetch custom provider models:",
        error,
      );
      return {
        models: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private static normalizeModelsResponse(
    data: any,
    providerId: string,
    providerName: string,
  ): LLMModel[] {
    const source = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.models)
      ? data.models
      : [];

    return source
      .map((model: any, index: number) => {
        const rawName =
          typeof model === "string" ? model : model?.id || model?.name;
        if (!rawName) return null;
        const name =
          providerId === "google" && String(rawName).startsWith("models/")
            ? String(rawName).replace("models/", "")
            : String(rawName);
        return {
          name,
          displayName: name,
          available: true,
          sorted: index,
          provider: {
            id: providerId,
            providerName,
            providerType: providerId.startsWith("custom_")
              ? "custom"
              : providerId,
            sorted: 0,
          },
        } as LLMModel;
      })
      .filter(Boolean) as LLMModel[];
  }
}
