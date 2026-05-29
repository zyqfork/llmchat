"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HighlightedCodeView } from "./HighlightedCodeView";
import { copyToClipboard } from "../../utils";
import styles from "./code-preview-shell.module.scss";

const TOOLBAR_HEIGHT = 45;

export type CodePreviewShellProps = {
  code: string;
  highlightedHtml?: string;
  /** 流式未完成 */
  isStreaming: boolean;
  /** 预览内容生成中 */
  isRendering: boolean;
  /** 预览已就绪，可切换展示 */
  isPreviewReady: boolean;
  preview: ReactNode;
  onFullscreen?: () => void;
  /** 刷新预览（重新渲染） */
  onReload?: () => void;
  hideFullscreen?: boolean;
  /** HTML 等块级预览应铺满容器宽度 */
  previewFillWidth?: boolean;
  /** 预览区最大高度（如对齐聊天可视区域，超出才滚动） */
  previewViewportMaxHeight?: number;
  /** 是否显示缩放控件（Mermaid 等） */
  showZoomControls?: boolean;
  viewportClassName?: string;
  minViewportHeight?: number;
};

export function CodePreviewShell(props: CodePreviewShellProps) {
  const {
    code,
    highlightedHtml,
    isStreaming,
    isRendering,
    isPreviewReady,
    preview,
    onFullscreen,
    onReload,
    hideFullscreen = false,
    previewFillWidth = false,
    previewViewportMaxHeight,
    showZoomControls = true,
    viewportClassName,
    minViewportHeight = 200,
  } = props;

  const [showSource, setShowSource] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const codeKeyRef = useRef(code);

  const enablePanZoom = showZoomControls;

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (codeKeyRef.current !== code) {
      codeKeyRef.current = code;
      resetView();
    }
  }, [code, resetView]);

  useEffect(() => {
    if (isPreviewReady && !isStreaming && !isRendering) {
      setShowSource(false);
    }
  }, [isPreviewReady, isStreaming, isRendering]);

  const isLoading = isStreaming || isRendering;
  const effectiveShowSource = isLoading || showSource;

  const zoomIn = () =>
    setScale((s) => Math.min(Number((s + 0.2).toFixed(2)), 4));
  const zoomOut = () =>
    setScale((s) => Math.max(Number((s - 0.2).toFixed(2)), 0.2));

  const handleRefresh = () => {
    onReload?.();
    setShowSource(false);
    resetView();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || effectiveShowSource || !enablePanZoom) return;
    draggingRef.current = true;
    setIsDragging(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const showToolbar =
    !isStreaming && (effectiveShowSource ? isPreviewReady : true);

  const viewportMaxHeight = previewViewportMaxHeight
    ? Math.max(previewViewportMaxHeight - TOOLBAR_HEIGHT, minViewportHeight)
    : undefined;

  return (
    <div className={styles.shell}>
      {showToolbar && (
        <div className={styles.toolbar}>
          {effectiveShowSource ? (
            isPreviewReady && (
              <button
                type="button"
                onClick={() => setShowSource(false)}
                title="查看渲染结果"
              >
                预览
              </button>
            )
          ) : (
            <>
              {showZoomControls && (
                <>
                  <button type="button" onClick={zoomOut} title="缩小">
                    −
                  </button>
                  <span className={styles["scale-label"]}>
                    {Math.round(scale * 100)}%
                  </span>
                  <button type="button" onClick={zoomIn} title="放大">
                    +
                  </button>
                </>
              )}
              <button type="button" onClick={resetView} title="重置">
                重置
              </button>
              <button
                type="button"
                onClick={() => setShowSource(true)}
                title="查看源码"
              >
                源码
              </button>
              {onReload && (
                <button type="button" onClick={handleRefresh} title="刷新预览">
                  刷新
                </button>
              )}
              {!hideFullscreen && onFullscreen && (
                <button type="button" onClick={onFullscreen} title="全屏预览">
                  全屏
                </button>
              )}
            </>
          )}
          <div className={styles["toolbar-right"]}>
            <button
              type="button"
              onClick={() => copyToClipboard(code)}
              title="复制当前源码"
            >
              复制
            </button>
          </div>
        </div>
      )}

      {effectiveShowSource ? (
        <HighlightedCodeView code={code} highlightedHtml={highlightedHtml} />
      ) : (
        <div
          ref={viewportRef}
          className={[
            styles.viewport,
            previewFillWidth ? styles["viewport-fill"] : "",
            viewportClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            minHeight: previewFillWidth ? undefined : minViewportHeight,
            maxHeight: viewportMaxHeight,
          }}
          onWheel={(e) => {
            if (!enablePanZoom || (!e.ctrlKey && !e.metaKey)) return;
            e.preventDefault();
            if (e.deltaY < 0) zoomIn();
            else zoomOut();
          }}
        >
          <div
            ref={contentRef}
            className={[
              styles.canvas,
              previewFillWidth ? styles["canvas-fill"] : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              transform: enablePanZoom
                ? `translate(${pan.x}px, ${pan.y}px) scale(${scale})`
                : undefined,
              cursor: enablePanZoom
                ? isDragging
                  ? "grabbing"
                  : "grab"
                : undefined,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}

/** 全屏弹窗内复用同一套预览壳 */
export function CodePreviewModalBody(props: {
  code: string;
  highlightedHtml?: string;
  isPreviewReady: boolean;
  preview: ReactNode;
  onReload?: () => void;
  previewFillWidth?: boolean;
  showZoomControls?: boolean;
}) {
  return (
    <CodePreviewShell
      code={props.code}
      highlightedHtml={props.highlightedHtml}
      isStreaming={false}
      isRendering={!props.isPreviewReady}
      isPreviewReady={props.isPreviewReady}
      preview={props.preview}
      onReload={props.onReload}
      hideFullscreen
      previewFillWidth={props.previewFillWidth}
      showZoomControls={props.showZoomControls}
      viewportClassName={styles["modal-viewport"]}
      minViewportHeight={376}
    />
  );
}
