"use client";

import React from "react";
import parseHtml from "html-react-parser";
import styles from "./code-preview-shell.module.scss";

export function HighlightedCodeView(props: {
  code: string;
  highlightedHtml?: string;
  showFullContent?: boolean;
}) {
  const { code, highlightedHtml, showFullContent = false } = props;

  return (
    <div
      className={styles["source-viewport"]}
      style={{
        maxHeight: showFullContent ? "none" : undefined,
        overflow: showFullContent ? "visible" : undefined,
      }}
    >
      {highlightedHtml ? (
        parseHtml(highlightedHtml)
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
