import {
  DEFAULT_MODELS,
  getAllProviders,
  getProviderConfig,
} from "../constant";
import { useAccessStore } from "../store/access";
import { logger } from "../utils/logger";
import { fetch } from "../utils/fetch";
import { LLMModel } from "./api";
import { resolvePiProviderId } from "./pi-provider-resolver";
import { getModels } from "@mariozechner/pi-ai";

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
      return getModels(mappedProvider as any).map((model, index: number) => ({
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

  private static getModelsFromLocalCatalog(
    providerId: string,
    providerName: string,
  ): LLMModel[] {
    return DEFAULT_MODELS.filter(
      (model) =>
        model.provider?.id === providerId ||
        model.provider?.providerName === providerName,
    ).map((model, index) => ({
      ...model,
      available: true,
      sorted: model.sorted ?? index,
      provider: {
        id: providerId,
        providerName,
        providerType: providerId,
        sorted: model.provider?.sorted ?? 0,
      },
    }));
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

      const localModels = this.getModelsFromLocalCatalog(
        providerId,
        providerConfig.name,
      );
      if (localModels.length > 0) {
        return { models: localModels, success: true };
      }

      return {
        models: [],
        success: false,
        error: `No model catalog available for provider ${provider}`,
      };
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

  private static buildAuthHeaders(
    authHeaderName: string,
    apiKey: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!apiKey) return headers;

    headers[authHeaderName] =
      authHeaderName.toLowerCase() === "authorization"
        ? `Bearer ${apiKey}`
        : apiKey;
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
        customProvider.type === "anthropic"
          ? "x-api-key"
          : customProvider.type === "google"
          ? "x-goog-api-key"
          : "Authorization",
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
