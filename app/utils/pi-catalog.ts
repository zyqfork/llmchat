import { getModel, getModels, getProviders } from "@mariozechner/pi-ai";

type PiModel = ReturnType<typeof getModels>[number];

let providerSetCache: Set<string> | null = null;
let providerModelsCache: Map<string, PiModel[]> | null = null;
let modelToProviderCache: Map<string, string> | null = null;

function normalize(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function ensureProviderSet(): Set<string> {
  if (providerSetCache) return providerSetCache;
  try {
    providerSetCache = new Set(getProviders().map((p) => normalize(String(p))));
  } catch {
    providerSetCache = new Set<string>();
  }
  return providerSetCache;
}

function ensureProviderModels(): Map<string, PiModel[]> {
  if (providerModelsCache) return providerModelsCache;
  const cache = new Map<string, PiModel[]>();
  try {
    for (const provider of getProviders()) {
      const pid = normalize(String(provider));
      if (!pid) continue;
      cache.set(pid, getModels(provider));
    }
  } catch {
    // keep empty cache
  }
  providerModelsCache = cache;
  return cache;
}

function ensureModelToProviderMap(): Map<string, string> {
  if (modelToProviderCache) return modelToProviderCache;
  const map = new Map<string, string>();
  const providerModels = ensureProviderModels();
  for (const [providerId, models] of providerModels.entries()) {
    for (const model of models) {
      const modelId = normalize(String(model?.id || ""));
      if (!modelId || map.has(modelId)) continue;
      map.set(modelId, providerId);
    }
  }
  modelToProviderCache = map;
  return map;
}

export function hasPiProvider(providerId: string): boolean {
  const normalized = normalize(providerId);
  return normalized ? ensureProviderSet().has(normalized) : false;
}

export function getPiModelsByProvider(providerId: string): PiModel[] {
  const normalized = normalize(providerId);
  if (!normalized) return [];
  const providerModels = ensureProviderModels();
  return providerModels.get(normalized) || [];
}

export function findPiProviderByModel(modelId: string): string | undefined {
  const normalized = normalize(modelId);
  if (!normalized) return undefined;
  return ensureModelToProviderMap().get(normalized);
}

export function findPiModelById(
  modelId: string,
  providerId?: string,
): PiModel | null {
  const normalizedModel = normalize(modelId);
  if (!normalizedModel) return null;

  if (providerId) {
    const normalizedProvider = normalize(providerId);
    if (!normalizedProvider) return null;
    try {
      return (getModel(normalizedProvider as any, normalizedModel as any) ||
        null) as PiModel | null;
    } catch {
      return (
        getPiModelsByProvider(normalizedProvider).find(
          (candidate) => normalize(String(candidate.id)) === normalizedModel,
        ) || null
      );
    }
  }

  const matchedProvider = findPiProviderByModel(normalizedModel);
  if (!matchedProvider) return null;
  return (
    getPiModelsByProvider(matchedProvider).find(
      (candidate) => normalize(String(candidate.id)) === normalizedModel,
    ) || null
  );
}
