"use client";

import React, { useEffect, useRef, useState } from "react";
import { encode } from "plantuml-encoder";
import { showModal } from "../ui-lib";
import { HTMLPreview, type HTMLPreviewHander } from "../artifacts";
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

function openMermaidFullscreenModal(
  code: string,
  highlightedHtml: string | undefined,
  svg: string,
  onReload: () => void,
) {
  showModal({
    title: "Mermaid 预览",
    defaultMax: true,
    children: (
      <div className={styles["modal-body"]}>
        <CodePreviewModalBody
          code={code}
          highlightedHtml={highlightedHtml}
          isPreviewReady={true}
          showZoomControls
          preview={<MermaidSvgPreview svg={svg} />}
          onReload={onReload}
        />
      </div>
    ),
  });
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
          });
          mermaidInitialized = true;
        }

        host.innerHTML = "";
        const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
        const result = await mermaid.render(id, code, host);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setSvg(null);
        }
      } finally {
        if (renderHostRef.current) {
          renderHostRef.current.innerHTML = "";
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
        onFullscreen={
          svg
            ? () =>
                openMermaidFullscreenModal(
                  props.code,
                  highlightedHtml,
                  svg,
                  reloadPreview,
                )
            : undefined
        }
      />
    </>
  );
}

function HtmlFullscreenContent(props: {
  code: string;
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
            autoHeight={true}
            height={600}
          />
        }
        onReload={() => previewRef.current?.reload()}
      />
    </div>
  );
}

export function HtmlPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const previewRef = useRef<HTMLPreviewHander>(null);
  const chatViewportHeight = useChatViewportHeight();
  const highlightedHtml = useHighlightedCode(
    props.code,
    "html",
    !props.isStreaming,
  );
  const isPreviewReady = !props.isStreaming;

  const openFullscreen = () => {
    showModal({
      title: "HTML 预览",
      defaultMax: true,
      children: (
        <HtmlFullscreenContent
          code={props.code}
          highlightedHtml={highlightedHtml}
        />
      ),
    });
  };

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
            autoHeight={true}
            unlimitedHeight
          />
        </div>
      }
      onReload={() => previewRef.current?.reload()}
      onFullscreen={openFullscreen}
    />
  );
}

// 兼容旧引用
export const MermaidDiagram = MermaidPreviewPanel;

function parseSpec(code: string) {
  return JSON.parse(code);
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

function openImageFullscreenModal(
  title: string,
  code: string,
  highlightedHtml: string | undefined,
  body: React.ReactNode,
) {
  showModal({
    title,
    defaultMax: true,
    children: (
      <div className={styles["modal-body"]}>
        <CodePreviewModalBody
          code={code}
          highlightedHtml={highlightedHtml}
          isPreviewReady={true}
          showZoomControls
          preview={body}
        />
      </div>
    ),
  });
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
      onFullscreen={() =>
        openImageFullscreenModal(
          "PlantUML 预览",
          props.code,
          highlightedHtml,
          preview,
        )
      }
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
      onFullscreen={
        svg
          ? () =>
              openImageFullscreenModal(
                "Graphviz 预览",
                props.code,
                highlightedHtml,
                <GraphvizSvgPreview svg={svg} />,
              )
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
  const isPreviewReady = !props.isStreaming;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={
        error ? (
          <ErrorFallback message={error} />
        ) : (
          <EchartsCanvasPreview code={props.code} onError={setError} />
        )
      }
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
  const isPreviewReady = !props.isStreaming;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={
        error ? (
          <ErrorFallback message={error} />
        ) : (
          <VegaPreview code={props.code} onError={setError} />
        )
      }
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
  const isPreviewReady = !props.isStreaming;

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={
        error ? (
          <ErrorFallback message={error} />
        ) : (
          <MarkmapPreview code={props.code} onError={setError} />
        )
      }
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

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={false}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={false}
      preview={<CsvTablePreview code={props.code} language={props.language} />}
    />
  );
}
