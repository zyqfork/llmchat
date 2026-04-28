import { findPiProviderByModel, hasPiProvider } from "../utils/pi-catalog";

export function resolvePiProviderId(providerId: string): string | undefined {
  const normalized = String(providerId || "").toLowerCase();
  if (!normalized) return undefined;
  return hasPiProvider(normalized) ? normalized : undefined;
}

export function resolvePiProviderByModel(modelId: string): string | undefined {
  const model = String(modelId || "")
    .trim()
    .toLowerCase();
  if (!model) return undefined;
  return findPiProviderByModel(model);
}
