import { getModels, getProviders } from "@earendil-works/pi-ai";

type PiModel = ReturnType<typeof getModels>[number];

function normalize(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

let providersCache: Set<string> | null = null;
let providerModelsCache: Map<string, PiModel[]> | null = null;
let modelToProviderCache: Map<string, string> | null = null;

function getModelId(model: PiModel): string {
  return normalize(String(model?.id || ""));
}

function getProvidersNormalized(): Set<string> {
  if (providersCache) return providersCache;
  providersCache = new Set(
    getProviders().map((provider) => normalize(String(provider))),
  );
  return providersCache;
}

function getProviderModels(): Map<string, PiModel[]> {
  if (providerModelsCache) return providerModelsCache;
  const cache = new Map<string, PiModel[]>();
  for (const provider of getProviders()) {
    const providerId = normalize(String(provider));
    if (!providerId) continue;
    cache.set(providerId, getModels(provider as any));
  }
  providerModelsCache = cache;
  return cache;
}

function getModelToProviderMap(): Map<string, string> {
  if (modelToProviderCache) return modelToProviderCache;
  const cache = new Map<string, string>();
  for (const [providerId, models] of getProviderModels().entries()) {
    for (const model of models) {
      const modelId = getModelId(model);
      if (!modelId || cache.has(modelId)) continue;
      cache.set(modelId, providerId);
    }
  }
  modelToProviderCache = cache;
  return cache;
}

export function resolvePiProviderId(providerId: string): string | undefined {
  const normalizedProvider = normalize(providerId);
  if (!normalizedProvider) return undefined;
  return getProvidersNormalized().has(normalizedProvider)
    ? normalizedProvider
    : undefined;
}

export function getPiModelsByProvider(providerId: string): PiModel[] {
  const normalizedProvider = normalize(providerId);
  if (!normalizedProvider) return [];
  return getProviderModels().get(normalizedProvider) || [];
}

export function findPiProviderByModel(modelId: string): string | undefined {
  const normalizedModelId = normalize(modelId);
  if (!normalizedModelId) return undefined;
  return getModelToProviderMap().get(normalizedModelId);
}

export function findPiModelById(
  modelId: string,
  providerId?: string,
): PiModel | null {
  const normalizedModelId = normalize(modelId);
  if (!normalizedModelId) return null;

  if (providerId) {
    return (
      getPiModelsByProvider(providerId).find(
        (model) => getModelId(model) === normalizedModelId,
      ) || null
    );
  }

  const provider = findPiProviderByModel(normalizedModelId);
  if (!provider) return null;
  return (
    getPiModelsByProvider(provider).find(
      (model) => getModelId(model) === normalizedModelId,
    ) || null
  );
}
