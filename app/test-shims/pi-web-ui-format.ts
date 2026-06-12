export function formatTokenCount(tokens: number): string {
  return String(tokens);
}

export function formatCost(cost: number): string {
  return String(cost);
}

export function formatModelCost(cost: unknown): string {
  return String(cost ?? "");
}

export function formatUsage(usage: unknown): string {
  return String(usage ?? "");
}
