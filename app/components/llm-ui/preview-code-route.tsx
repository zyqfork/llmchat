"use client";

import React from "react";
import {
  CsvPreviewPanel,
  EchartsPreviewPanel,
  GraphvizPreviewPanel,
  HtmlPreviewPanel,
  SvgPreviewPanel,
  JsonPreviewPanel,
  MarkmapPreviewPanel,
  MermaidPreviewPanel,
  PlantUmlPreviewPanel,
  VegaPreviewPanel,
} from "./preview-panels";
import type { PreviewLanguage } from "./preview-utils";

export function PreviewCodeBlockRoute(props: {
  previewKind: PreviewLanguage;
  code: string;
  language?: string;
  isStreaming: boolean;
  enableArtifacts: boolean;
}) {
  const { previewKind, code, language, isStreaming, enableArtifacts } = props;

  switch (previewKind) {
    case "mermaid":
      return <MermaidPreviewPanel code={code} isStreaming={isStreaming} />;
    case "html":
      if (!enableArtifacts) return null;
      return (
        <HtmlPreviewPanel
          code={code}
          language={language}
          isStreaming={isStreaming}
        />
      );
    case "svg":
      return <SvgPreviewPanel code={code} isStreaming={isStreaming} />;
    case "plantuml":
      return <PlantUmlPreviewPanel code={code} isStreaming={isStreaming} />;
    case "graphviz":
      return <GraphvizPreviewPanel code={code} isStreaming={isStreaming} />;
    case "echarts":
      return <EchartsPreviewPanel code={code} isStreaming={isStreaming} />;
    case "vega":
      return <VegaPreviewPanel code={code} isStreaming={isStreaming} />;
    case "markmap":
      return <MarkmapPreviewPanel code={code} isStreaming={isStreaming} />;
    case "csv":
      return (
        <CsvPreviewPanel
          code={code}
          language={language}
          isStreaming={isStreaming}
        />
      );
    case "json":
    case "yaml":
      return (
        <JsonPreviewPanel
          code={code}
          language={language}
          isStreaming={isStreaming}
        />
      );
    default:
      return null;
  }
}
