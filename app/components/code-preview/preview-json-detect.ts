import parseVegaSchemaUrl from "vega-schema-url-parser";
import { parseJsonLike } from "./preview-parse";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 尝试解析 JSON（仅用于 fence 为 json/js/ts 时的类型推断） */
export function parsePreviewJson(code: string): unknown | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return parseJsonLike(trimmed);
  } catch {
    return null;
  }
}

/** 使用 vega 官方 schema URL 解析器识别 Vega / Vega-Lite */
export function isVegaJsonSpec(value: unknown): boolean {
  if (!isRecord(value)) return false;

  if (typeof value.$schema === "string") {
    try {
      const parsed = parseVegaSchemaUrl(value.$schema);
      return parsed.library === "vega" || parsed.library === "vega-lite";
    } catch {
      return false;
    }
  }

  // 无 $schema 时按 Vega 规范字段判断（结构检测，非正则）
  return (
    "marks" in value ||
    "scales" in value ||
    "signals" in value ||
    "layer" in value ||
    "hconcat" in value ||
    "vconcat" in value ||
    "concat" in value ||
    ("mark" in value && ("encoding" in value || "data" in value))
  );
}

/** ECharts option 常见顶层字段（结构检测） */
export function isEchartsJsonSpec(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (isVegaJsonSpec(value)) return false;

  const hasSeries =
    "series" in value &&
    (Array.isArray(value.series) || isRecord(value.series as object));
  const hasAxes = "xAxis" in value || "yAxis" in value || "radiusAxis" in value;
  const hasCoord = "polar" in value || "geo" in value || "radar" in value;

  return (
    hasSeries ||
    (hasAxes && ("dataset" in value || "series" in value)) ||
    hasCoord
  );
}

export function detectJsonPreviewType(code: string): "vega" | "echarts" | null {
  const parsed = parsePreviewJson(code);
  if (parsed == null) return null;
  if (isVegaJsonSpec(parsed)) return "vega";
  if (isEchartsJsonSpec(parsed)) return "echarts";
  return null;
}
