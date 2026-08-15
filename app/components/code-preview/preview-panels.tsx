"use client";

import React, { useEffect, useRef, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import XMLViewer from "react-xml-viewer";
import { encode } from "plantuml-encoder";
import { HTMLPreview, type HTMLPreviewHander } from "../artifacts";
import { isXmlPreviewContent } from "./preview-xml";
import { parseJsonLike } from "./preview-parse";
import { CodePreviewModalBody, CodePreviewShell } from "./CodePreviewShell";
import { useHighlightedCode } from "./use-highlighted-code";
import { useChatViewportHeight } from "./use-chat-viewport-height";
import styles from "./code-preview-shell.module.scss";

let mermaidInitialized = false;
let graphvizInstancePromise: Promise<any> | null = null;

function MermaidSvgPreview(props: { svg: string }) {
  return (
    <div
      className={styles["mermaid-svg-wrap"]}
      dangerouslySetInnerHTML={{ __html: props.svg }}
    />
  );
}

export function MermaidPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const renderHostRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderToken, setRenderToken] = useState(0);
  const highlightedHtml = useHighlightedCode(
    props.code,
    "mermaid",
    !props.isStreaming,
  );

  const reloadPreview = () => setRenderToken((t) => t + 1);

  useEffect(() => {
    if (props.isStreaming) {
      setSvg(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const code = props.code.trim();
    if (!code) return;

    (async () => {
      try {
        const host = renderHostRef.current;
        if (!host) return;

        const mermaidMod = await import("mermaid");
        const mermaid = mermaidMod.default ?? mermaidMod;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            quadrantChart: {
              chartWidth: 500,
              chartHeight: 500,
            },
          });
          mermaidInitialized = true;
        }

        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.top = "-9999px";
        tempDiv.style.width = "1024px";
        document.body.appendChild(tempDiv);

        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
          const result = await mermaid.render(id, code, tempDiv);
          if (!cancelled) {
            setSvg(result.svg);
            setError(null);
          }
        } finally {
          document.body.removeChild(tempDiv);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setSvg(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.code, props.isStreaming, renderToken]);

  if (error) {
    return (
      <CodePreviewShell
        code={props.code}
        highlightedHtml={highlightedHtml}
        isStreaming={props.isStreaming}
        isRendering={false}
        isPreviewReady={false}
        preview={null}
        showZoomControls
      />
    );
  }

  const isRendering = !props.isStreaming && !svg;
  const isPreviewReady = !props.isStreaming && !!svg;

  return (
    <>
      <div ref={renderHostRef} className={styles["render-host"]} />
      <CodePreviewShell
        code={props.code}
        highlightedHtml={highlightedHtml}
        isStreaming={props.isStreaming}
        isRendering={isRendering}
        isPreviewReady={isPreviewReady}
        showZoomControls
        preview={svg ? <MermaidSvgPreview svg={svg} /> : null}
        onReload={reloadPreview}
        fullscreen={
          svg
            ? {
                title: "Mermaid 预览",
                preview: <MermaidSvgPreview svg={svg} />,
                onReload: reloadPreview,
                showZoomControls: true,
              }
            : undefined
        }
      />
    </>
  );
}

function HtmlFullscreenContent(props: {
  code: string;
  language?: string;
  highlightedHtml?: string;
}) {
  const previewRef = useRef<HTMLPreviewHander>(null);

  return (
    <div className={styles["modal-body"]}>
      <CodePreviewModalBody
        code={props.code}
        highlightedHtml={props.highlightedHtml}
        isPreviewReady={true}
        previewFillWidth
        preview={
          <HTMLPreview
            ref={previewRef}
            code={props.code}
            language={props.language}
            autoHeight={true}
            height={600}
          />
        }
        onReload={() => previewRef.current?.reload()}
      />
    </div>
  );
}

const xmlViewerTheme = {
  tagColor: "#116329",
  textColor: "#24292f",
  attributeKeyColor: "#0550ae",
  attributeValueColor: "#0a3069",
  separatorColor: "#1f2328",
  commentColor: "#6e7781",
  cdataColor: "#0d904f",
  fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
};

function XmlStructuredPreview(props: { code: string }) {
  return (
    <div className={styles["xml-preview-container"]}>
      <XMLViewer
        xml={props.code.trim()}
        collapsible
        indentSize={2}
        initialCollapsedDepth={undefined}
        theme={xmlViewerTheme}
        invalidXml={
          <pre className={styles["xml-invalid-source"]}>
            {props.code.trim()}
          </pre>
        }
      />
    </div>
  );
}

function XmlFullscreenContent(props: {
  code: string;
  highlightedHtml?: string;
}) {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className={styles["modal-body"]}>
      <CodePreviewModalBody
        code={props.code}
        highlightedHtml={props.highlightedHtml}
        isPreviewReady={true}
        previewFillWidth
        showZoomControls
        enableCanvasPanZoom={false}
        preview={<XmlStructuredPreview key={reloadKey} code={props.code} />}
        onReload={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
}

function SvgInlinePreview(props: { code: string }) {
  return (
    <div
      className={styles["mermaid-svg-wrap"]}
      dangerouslySetInnerHTML={{ __html: props.code.trim() }}
    />
  );
}

export function SvgPreviewPanel(props: { code: string; isStreaming: boolean }) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "svg",
    !props.isStreaming,
  );
  const isPreviewReady = !props.isStreaming;
  const preview = <SvgInlinePreview code={props.code} />;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      showZoomControls
      preview={preview}
      fullscreen={{
        title: "SVG 预览",
        preview,
        showZoomControls: true,
      }}
    />
  );
}

export function HtmlPreviewPanel(props: {
  code: string;
  language?: string;
  isStreaming: boolean;
}) {
  const previewRef = useRef<HTMLPreviewHander>(null);
  const chatViewportHeight = useChatViewportHeight();
  const isXml = isXmlPreviewContent(props.code, props.language);
  const previewTitle = isXml ? "XML 预览" : "HTML 预览";
  const highlightLang = isXml ? "xml" : "html";
  const highlightedHtml = useHighlightedCode(
    props.code,
    highlightLang,
    !props.isStreaming,
  );
  const [xmlReloadKey, setXmlReloadKey] = useState(0);
  const isPreviewReady = !props.isStreaming;

  if (isXml) {
    const reloadPreview = () => setXmlReloadKey((k) => k + 1);

    return (
      <CodePreviewShell
        code={props.code}
        highlightedHtml={highlightedHtml}
        isStreaming={props.isStreaming}
        isRendering={false}
        isPreviewReady={isPreviewReady}
        previewFillWidth
        previewViewportMaxHeight={chatViewportHeight}
        showZoomControls
        enableCanvasPanZoom={false}
        preview={<XmlStructuredPreview key={xmlReloadKey} code={props.code} />}
        onReload={reloadPreview}
        fullscreen={{
          title: previewTitle,
          content: (
            <XmlFullscreenContent
              code={props.code}
              highlightedHtml={highlightedHtml}
            />
          ),
        }}
      />
    );
  }

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      previewViewportMaxHeight={chatViewportHeight}
      showZoomControls
      preview={
        <div className={styles["html-frame-wrap"]}>
          <HTMLPreview
            ref={previewRef}
            code={props.code}
            language={props.language}
            autoHeight={true}
            unlimitedHeight
          />
        </div>
      }
      onReload={() => previewRef.current?.reload()}
      fullscreen={{
        title: previewTitle,
        content: (
          <HtmlFullscreenContent
            code={props.code}
            language={props.language}
            highlightedHtml={highlightedHtml}
          />
        ),
      }}
    />
  );
}

// 兼容旧引用
export const MermaidDiagram = MermaidPreviewPanel;

function parseSpec(code: string): Record<string, unknown> {
  const parsed = parseJsonLike(code);
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new Error("需要 JSON 对象作为配置");
}

function ErrorFallback(props: { message: string }) {
  return (
    <div className={styles["preview-error"]}>
      <pre>{props.message}</pre>
    </div>
  );
}

function PlantUmlImagePreview(props: { code: string }) {
  const encoded = encode(props.code);
  const src = `https://www.plantuml.com/plantuml/svg/${encoded}`;
  return <img className={styles["preview-image"]} src={src} alt="PlantUML" />;
}

export function PlantUmlPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "plantuml",
    !props.isStreaming,
  );
  const isPreviewReady = !props.isStreaming;
  const preview = <PlantUmlImagePreview code={props.code} />;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      showZoomControls
      preview={preview}
      fullscreen={{
        title: "PlantUML 预览",
        preview,
        showZoomControls: true,
      }}
    />
  );
}

function GraphvizSvgPreview(props: { svg: string }) {
  return (
    <div
      className={styles["mermaid-svg-wrap"]}
      dangerouslySetInnerHTML={{ __html: props.svg }}
    />
  );
}

export function GraphvizPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "dot",
    !props.isStreaming,
  );
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderToken, setRenderToken] = useState(0);

  const reloadPreview = () => setRenderToken((t) => t + 1);

  useEffect(() => {
    if (props.isStreaming) {
      setSvg(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (!graphvizInstancePromise) {
          graphvizInstancePromise = import("@viz-js/viz").then((m) =>
            m.instance(),
          );
        }
        const viz = await graphvizInstancePromise;
        const rendered = viz.renderString(props.code, { format: "svg" });
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null);
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.code, props.isStreaming, renderToken]);

  const isRendering = !props.isStreaming && !svg && !error;
  const isPreviewReady = !props.isStreaming && !!svg;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={isRendering}
      isPreviewReady={isPreviewReady}
      showZoomControls
      preview={
        error ? (
          <ErrorFallback message={error} />
        ) : svg ? (
          <GraphvizSvgPreview svg={svg} />
        ) : null
      }
      onReload={reloadPreview}
      fullscreen={
        svg
          ? {
              title: "Graphviz 预览",
              preview: <GraphvizSvgPreview svg={svg} />,
              showZoomControls: true,
            }
          : undefined
      }
    />
  );
}

function EchartsCanvasPreview(props: {
  code: string;
  onError: (msg: string | null) => void;
}) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let chart: any;
    (async () => {
      try {
        const echarts = await import("echarts");
        if (!chartRef.current) return;
        chart = echarts.init(chartRef.current, undefined, {
          renderer: "canvas",
        });
        const option = parseSpec(props.code);
        chart.setOption(option, true);
        props.onError(null);
      } catch (err) {
        props.onError(err instanceof Error ? err.message : String(err));
      }
    })();
    const resize = () => chart?.resize?.();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (!disposed) {
        disposed = true;
        chart?.dispose?.();
      }
    };
  }, [props.code, props]);

  return <div ref={chartRef} className={styles["chart-canvas"]} />;
}

export function EchartsPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "json",
    !props.isStreaming,
  );
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const reloadPreview = () => setRenderKey((k) => k + 1);
  const isPreviewReady = !props.isStreaming;
  const preview = error ? (
    <ErrorFallback message={error} />
  ) : (
    <EchartsCanvasPreview
      key={renderKey}
      code={props.code}
      onError={setError}
    />
  );

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={preview}
      onReload={reloadPreview}
      fullscreen={{
        title: "ECharts 预览",
        preview,
        onReload: reloadPreview,
        previewFillWidth: true,
        showZoomControls: false,
      }}
    />
  );
}

function VegaPreview(props: {
  code: string;
  onError: (msg: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let finalize: (() => void) | undefined;
    (async () => {
      try {
        if (!containerRef.current) return;
        const embedMod = await import("vega-embed");
        const embed = embedMod.default;
        containerRef.current.innerHTML = "";
        const spec = parseSpec(props.code);
        const result = await embed(containerRef.current, spec, {
          actions: false,
          renderer: "canvas",
          defaultStyle: true,
        });
        finalize = result.finalize;
        props.onError(null);
      } catch (err) {
        props.onError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      finalize?.();
    };
  }, [props.code, props]);

  return <div ref={containerRef} className={styles["vega-wrap"]} />;
}

export function VegaPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "json",
    !props.isStreaming,
  );
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const reloadPreview = () => setRenderKey((k) => k + 1);
  const isPreviewReady = !props.isStreaming;
  const preview = error ? (
    <ErrorFallback message={error} />
  ) : (
    <VegaPreview key={renderKey} code={props.code} onError={setError} />
  );

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={preview}
      onReload={reloadPreview}
      fullscreen={{
        title: "Vega 预览",
        preview,
        onReload: reloadPreview,
        previewFillWidth: true,
        showZoomControls: false,
      }}
    />
  );
}

function MarkmapPreview(props: {
  code: string;
  onError: (msg: string | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let mm: any;
    (async () => {
      try {
        const libMod = await import("markmap-lib");
        const viewMod = await import("markmap-view");
        const { Transformer } = libMod;
        const { Markmap } = viewMod;
        const transformer = new Transformer();
        const { root } = transformer.transform(props.code);
        if (!svgRef.current) return;
        svgRef.current.innerHTML = "";
        mm = Markmap.create(svgRef.current, { autoFit: true }, root);
        props.onError(null);
      } catch (err) {
        props.onError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      mm?.destroy?.();
    };
  }, [props.code, props]);

  return <svg ref={svgRef} className={styles["markmap-svg"]} />;
}

export function MarkmapPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "markdown",
    !props.isStreaming,
  );
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const reloadPreview = () => setRenderKey((k) => k + 1);
  const isPreviewReady = !props.isStreaming;
  const preview = error ? (
    <ErrorFallback message={error} />
  ) : (
    <MarkmapPreview key={renderKey} code={props.code} onError={setError} />
  );

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={true}
      preview={preview}
      onReload={reloadPreview}
      fullscreen={{
        title: "Markmap 预览",
        preview,
        onReload: reloadPreview,
        previewFillWidth: true,
        showZoomControls: true,
      }}
    />
  );
}

function parseCsvRows(code: string, delimiter: "," | "\t") {
  const lines = code.trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
}

function CsvTablePreview(props: { code: string; language?: string }) {
  const delimiter = props.language?.toLowerCase() === "tsv" ? "\t" : ",";
  const rows = parseCsvRows(props.code, delimiter as "," | "\t");
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  return (
    <div className={styles["table-wrap"]}>
      <table className={styles["csv-table"]}>
        <thead>
          <tr>
            {header.map((cell, idx) => (
              <th key={`h-${idx}`}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rIdx) => (
            <tr key={`r-${rIdx}`}>
              {row.map((cell, cIdx) => (
                <td key={`c-${rIdx}-${cIdx}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CsvPreviewPanel(props: {
  code: string;
  language?: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    props.language || "csv",
    !props.isStreaming,
  );
  const isPreviewReady = !props.isStreaming;
  const preview = (
    <CsvTablePreview code={props.code} language={props.language} />
  );

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={preview}
      fullscreen={{
        title:
          props.language?.toLowerCase() === "tsv" ? "TSV 预览" : "CSV 预览",
        preview,
        previewFillWidth: true,
        showZoomControls: false,
      }}
    />
  );
}

const jsonViewTheme = {
  ...githubLightTheme,
  "--w-rjv-font-family": 'Menlo, Monaco, Consolas, "Courier New", monospace',
  "--w-rjv-background-color": "transparent",
  "--w-rjv-color": "var(--black)",
  "--w-rjv-key-string": "#881391",
  "--w-rjv-key-number": "#881391",
  "--w-rjv-info-color": "rgba(31, 35, 40, 0.45)",
  "--w-rjv-string-color": "#0d904f",
  "--w-rjv-number-color": "#1c00cf",
  "--w-rjv-boolean-color": "#aa0d91",
  "--w-rjv-null-color": "#808080",
  "--w-rjv-arrow-color": "rgba(31, 35, 40, 0.55)",
};

async function parseStructuredPreviewCode(
  code: string,
  language?: string,
): Promise<{ data: unknown; error: string | null }> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { data: null, error: null };
  }

  const lang = (language || "").trim().toLowerCase();
  try {
    if (lang === "yaml" || lang === "yml") {
      const yamlMod = await import("yaml");
      const data = yamlMod.parse(trimmed);
      return { data, error: null };
    }
    const data = parseJsonLike(trimmed);
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function JsonStructuredPreview(props: { code: string; language?: string }) {
  const isYaml =
    props.language?.toLowerCase() === "yaml" ||
    props.language?.toLowerCase() === "yml";

  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await parseStructuredPreviewCode(
        props.code,
        props.language,
      );
      if (cancelled) return;
      if (error) {
        setParsedData(null);
        setParseError(error);
        return;
      }
      if (data === null) {
        setParsedData(null);
        setParseError(null);
        return;
      }
      setParsedData(data);
      setParseError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [props.code, props.language]);

  if (parseError) {
    return (
      <div style={{ padding: 12 }}>
        <ErrorFallback
          message={`${isYaml ? "YAML" : "JSON"} 解析失败:\n${parseError}`}
        />
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div style={{ padding: 12 }}>
        <ErrorFallback
          message={`未找到可解析的 ${isYaml ? "YAML" : "JSON"} 内容`}
        />
      </div>
    );
  }

  return (
    <div className={styles["json-preview-container"]}>
      <div className={styles["json-tree-viewport"]}>
        {typeof parsedData === "object" ? (
          <JsonView
            value={parsedData as object}
            collapsed={2}
            displayDataTypes={false}
            displayObjectSize
            enableClipboard
            shortenTextAfterLength={0}
            style={jsonViewTheme}
          />
        ) : (
          <pre className={styles["json-primitive-value"]}>
            {JSON.stringify(parsedData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function JsonFullscreenModalContent(props: {
  code: string;
  language?: string;
  highlightedHtml?: string;
}) {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className={styles["modal-body"]}>
      <CodePreviewModalBody
        code={props.code}
        highlightedHtml={props.highlightedHtml}
        isPreviewReady={true}
        showZoomControls
        enableCanvasPanZoom={false}
        previewFillWidth
        preview={
          <JsonStructuredPreview
            key={reloadKey}
            code={props.code}
            language={props.language}
          />
        }
        onReload={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
}

export function JsonPreviewPanel(props: {
  code: string;
  language?: string;
  isStreaming: boolean;
}) {
  const isYaml =
    props.language?.toLowerCase() === "yaml" ||
    props.language?.toLowerCase() === "yml";
  const previewTitle = isYaml ? "YAML 预览" : "JSON 预览";
  const highlightedHtml = useHighlightedCode(
    props.code,
    isYaml ? "yaml" : "json",
    !props.isStreaming,
  );

  const [reloadKey, setReloadKey] = useState(0);
  const reloadPreview = () => setReloadKey((k) => k + 1);

  const isPreviewReady = React.useMemo(() => {
    if (props.isStreaming) return false;
    const trimmed = props.code.trim();
    if (!trimmed) return false;
    if (isYaml) return true;
    try {
      parseJsonLike(trimmed);
      return true;
    } catch {
      return false;
    }
  }, [props.code, props.isStreaming, isYaml]);
  const isRendering = props.isStreaming;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={isRendering}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={true}
      enableCanvasPanZoom={false}
      preview={
        <JsonStructuredPreview
          key={reloadKey}
          code={props.code}
          language={props.language}
        />
      }
      onReload={reloadPreview}
      fullscreen={
        isPreviewReady
          ? {
              title: previewTitle,
              content: (
                <JsonFullscreenModalContent
                  code={props.code}
                  language={props.language}
                  highlightedHtml={highlightedHtml}
                />
              ),
            }
          : undefined
      }
    />
  );
}
