"use client";

import React from "react";
import parseHtml from "html-react-parser";
import { copyToClipboard } from "../../utils";
import styles from "./code-preview-shell.module.scss";

export function HighlightedCodeView(props: {
  code: string;
  highlightedHtml?: string;
}) {
  const { code, highlightedHtml } = props;

  return (
    <div className={styles["source-viewport"]}>
      <span
        className="copy-code-button"
        onClick={() => copyToClipboard(code)}
      />
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
