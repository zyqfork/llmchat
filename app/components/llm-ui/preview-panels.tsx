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
      showZoomControls={true}
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

function getAllCollapsiblePaths(data: any): string[] {
  const paths: string[] = [];
  const traverse = (val: any, currentPath: string) => {
    if (val === null || typeof val !== "object") return;
    paths.push(currentPath);
    if (Array.isArray(val)) {
      val.forEach((item, index) => {
        traverse(item, `${currentPath}[${index}]`);
      });
    } else {
      Object.entries(val).forEach(([key, value]) => {
        traverse(value, currentPath ? `${currentPath}.${key}` : key);
      });
    }
  };
  traverse(data, "root");
  return paths;
}

function getInitialExpandedPaths(data: any): Set<string> {
  const expanded = new Set<string>();
  expanded.add("root");
  if (data && typeof data === "object") {
    if (Array.isArray(data)) {
      data.slice(0, 10).forEach((item, index) => {
        if (item && typeof item === "object") {
          expanded.add(`root[${index}]`);
        }
      });
    } else {
      Object.entries(data).forEach(([key, val]) => {
        if (val && typeof val === "object") {
          expanded.add(`root.${key}`);
        }
      });
    }
  }
  return expanded;
}

function filterJson(data: any, query: string): any {
  if (!query) return data;
  const q = query.toLowerCase();

  const match = (val: any): boolean => {
    if (typeof val === "string" && val.toLowerCase().includes(q)) return true;
    if (typeof val === "number" && String(val).toLowerCase().includes(q))
      return true;
    if (typeof val === "boolean" && String(val).toLowerCase().includes(q))
      return true;
    return false;
  };

  const traverse = (node: any): any => {
    if (node === null || typeof node !== "object") {
      return match(node) ? node : undefined;
    }
    if (Array.isArray(node)) {
      const nextArr: any[] = [];
      for (const item of node) {
        const res = traverse(item);
        if (res !== undefined) {
          nextArr.push(res);
        }
      }
      return nextArr.length > 0 ? nextArr : undefined;
    }
    // object
    const nextObj: any = {};
    let hasKeys = false;
    for (const [key, val] of Object.entries(node)) {
      if (key.toLowerCase().includes(q)) {
        nextObj[key] = val;
        hasKeys = true;
      } else {
        const res = traverse(val);
        if (res !== undefined) {
          nextObj[key] = res;
          hasKeys = true;
        }
      }
    }
    return hasKeys ? nextObj : undefined;
  };

  return traverse(data);
}

type JsonNodeProps = {
  name: string | null;
  value: any;
  path: string;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  copyValue: (val: any) => void;
  query: string;
};

function JsonTreeNode({
  name,
  value,
  path,
  expandedPaths,
  togglePath,
  copyValue,
  query,
}: JsonNodeProps) {
  const isCollapsible = value !== null && typeof value === "object";
  const isExpanded = expandedPaths.has(path);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePath(path);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyValue(value);
  };

  if (isCollapsible) {
    const isArray = Array.isArray(value);
    const keys = isArray ? value : Object.keys(value);
    const isEmpty = keys.length === 0;

    const openingBracket = isArray ? "[" : "{";
    const closingBracket = isArray ? "]" : "}";

    const renderCollapsedSummary = () => {
      if (isArray) {
        return (
          <span
            className={styles["json-collapsed-text"]}
            onClick={handleToggle}
          >
            {`${value.length} items`}
          </span>
        );
      }
      const keysList = Object.keys(value);
      if (keysList.length <= 3) {
        const preview = keysList
          .map((k) => {
            const v = value[k];
            let vStr = "";
            if (v === null) vStr = "null";
            else if (typeof v === "object")
              vStr = Array.isArray(v) ? "[...]" : "{...}";
            else if (typeof v === "string")
              vStr = `"${v.slice(0, 10)}${v.length > 10 ? "..." : ""}"`;
            else vStr = String(v);
            return `${k}: ${vStr}`;
          })
          .join(", ");
        return (
          <span
            className={styles["json-collapsed-text"]}
            onClick={handleToggle}
          >
            {`{ ${preview} }`}
          </span>
        );
      }
      return (
        <span className={styles["json-collapsed-text"]} onClick={handleToggle}>
          {`${keysList.length} keys`}
        </span>
      );
    };

    return (
      <div className={`${styles["json-tree-node"]} ${styles["collapsible"]}`}>
        <div className={styles["json-node-row"]}>
          {!isEmpty && (
            <span
              className={`${styles["json-toggle-btn"]} ${isExpanded ? styles["expanded"] : ""}`}
              onClick={handleToggle}
            >
              ▶
            </span>
          )}
          {isEmpty && <span style={{ width: 18 }} />}
          {name !== null && (
            <>
              <span className={styles["json-key"]}>{name}</span>
              <span className={styles["json-colon"]}>:</span>
            </>
          )}
          <span className={styles["json-bracket"]}>{openingBracket}</span>

          {!isExpanded && renderCollapsedSummary()}

          {!isExpanded && (
            <span className={styles["json-bracket"]}>{closingBracket}</span>
          )}
          {isArray && (
            <span
              className={styles["json-meta"]}
            >{`// ${value.length} items`}</span>
          )}
          {!isArray && (
            <span
              className={styles["json-meta"]}
            >{`// ${Object.keys(value).length} keys`}</span>
          )}

          <span
            className={styles["json-copy-btn"]}
            onClick={handleCopy}
            title="复制节点数据"
          >
            📋
          </span>
        </div>

        {isExpanded && !isEmpty && (
          <div style={{ position: "relative" }}>
            <div className={styles["json-indent-line"]} />
            <div style={{ paddingLeft: 16 }}>
              {isArray
                ? (value as any[]).map((item, idx) => {
                    const childPath = `${path}[${idx}]`;
                    return (
                      <JsonTreeNode
                        key={childPath}
                        name={null}
                        value={item}
                        path={childPath}
                        expandedPaths={expandedPaths}
                        togglePath={togglePath}
                        copyValue={copyValue}
                        query={query}
                      />
                    );
                  })
                : Object.entries(value).map(([k, v]) => {
                    const childPath = `${path}.${k}`;
                    return (
                      <JsonTreeNode
                        key={childPath}
                        name={k}
                        value={v}
                        path={childPath}
                        expandedPaths={expandedPaths}
                        togglePath={togglePath}
                        copyValue={copyValue}
                        query={query}
                      />
                    );
                  })}
            </div>
            <div
              className={styles["json-node-row"]}
              style={{ paddingLeft: 18 }}
            >
              <span className={styles["json-bracket"]}>{closingBracket}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderValue = () => {
    if (value === null) {
      return <span className={styles["json-value-null"]}>null</span>;
    }
    if (typeof value === "string") {
      return (
        <span className={styles["json-value-string"]}>{`"${value}"`}</span>
      );
    }
    if (typeof value === "number") {
      return <span className={styles["json-value-number"]}>{value}</span>;
    }
    if (typeof value === "boolean") {
      return (
        <span className={styles["json-value-boolean"]}>{String(value)}</span>
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className={styles["json-tree-node"]}>
      <div className={styles["json-node-row"]}>
        {name !== null && (
          <>
            <span className={styles["json-key"]}>{name}</span>
            <span className={styles["json-colon"]}>:</span>
          </>
        )}
        {renderValue()}
        <span
          className={styles["json-copy-btn"]}
          onClick={handleCopy}
          title="复制值"
        >
          📋
        </span>
      </div>
    </div>
  );
}

export function JsonPreviewPanel(props: {
  code: string;
  isStreaming: boolean;
}) {
  const highlightedHtml = useHighlightedCode(
    props.code,
    "json",
    !props.isStreaming,
  );

  const [query, setQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = props.code.trim();
    if (!trimmed) {
      setParsedData(null);
      setParseError(null);
      return;
    }

    try {
      const data = JSON.parse(trimmed);
      setParsedData(data);
      setParseError(null);
      setExpandedPaths(getInitialExpandedPaths(data));
    } catch (err) {
      setParsedData(null);
      setParseError(err instanceof Error ? err.message : String(err));
    }
  }, [props.code]);

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (!parsedData) return;
    const paths = getAllCollapsiblePaths(parsedData);
    setExpandedPaths(new Set(paths));
  };

  const handleCollapseAll = () => {
    const rootSet = new Set<string>();
    rootSet.add("root");
    setExpandedPaths(rootSet);
  };

  const handleCopyValue = (val: any) => {
    const text = typeof val === "string" ? val : JSON.stringify(val, null, 2);
    import("../../utils").then((m) => m.copyToClipboard(text));
  };

  const filteredData = React.useMemo(() => {
    if (!parsedData || !query) return parsedData;
    return filterJson(parsedData, query);
  }, [parsedData, query]);

  useEffect(() => {
    if (query && filteredData) {
      const paths = getAllCollapsiblePaths(filteredData);
      setExpandedPaths(new Set(paths));
    }
  }, [query, filteredData]);

  const isPreviewReady = !props.isStreaming && parsedData !== null;
  const isRendering = props.isStreaming;

  const renderPreview = () => {
    if (parseError) {
      return (
        <div style={{ padding: 12 }}>
          <ErrorFallback message={`JSON 解析失败:\n${parseError}`} />
        </div>
      );
    }

    if (!parsedData) {
      return (
        <div style={{ padding: 12 }}>
          <ErrorFallback message="未找到可解析的 JSON 内容" />
        </div>
      );
    }

    if (filteredData === undefined) {
      return (
        <div className={styles["json-no-results"]}>
          没有找到匹配 &quot;{query}&quot; 的节点
        </div>
      );
    }

    return (
      <div className={styles["json-preview-container"]}>
        <div className={styles["json-search-bar"]}>
          <input
            type="text"
            placeholder="搜索键或值..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles["json-actions"]}>
            <button type="button" onClick={handleExpandAll}>
              展开全部
            </button>
            <button type="button" onClick={handleCollapseAll}>
              折叠全部
            </button>
          </div>
        </div>
        <div className={styles["json-tree-viewport"]}>
          <JsonTreeNode
            name={null}
            value={filteredData}
            path="root"
            expandedPaths={expandedPaths}
            togglePath={togglePath}
            copyValue={handleCopyValue}
            query={query}
          />
        </div>
      </div>
    );
  };

  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={highlightedHtml}
      isStreaming={props.isStreaming}
      isRendering={isRendering}
      isPreviewReady={isPreviewReady}
      previewFillWidth
      showZoomControls={true}
      preview={renderPreview()}
    />
  );
}
