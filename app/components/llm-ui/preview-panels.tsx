"use client";

import React, { useEffect, useRef, useState } from "react";
import { showModal } from "../ui-lib";
import { HTMLPreview, type HTMLPreviewHander } from "../artifacts";
import { CodePreviewModalBody, CodePreviewShell } from "./CodePreviewShell";
import { useHighlightedCode } from "./use-highlighted-code";
import { useChatViewportHeight } from "./use-chat-viewport-height";
import styles from "./code-preview-shell.module.scss";

let mermaidInitialized = false;

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
