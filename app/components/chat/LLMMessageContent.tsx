import React, { type RefObject } from "react";
import dynamic from "next/dynamic";
import styles from "../chat.module.scss";

const Markdown = dynamic(async () => (await import("../markdown")).Markdown, {
  loading: () => <span className={styles["loading-icon"]}>...</span>,
});

export function LLMMessageContent(props: {
  content: string;
  isStreamFinished: boolean;
  loading?: boolean;
  fontSize?: number;
  fontFamily?: string;
  parentRef?: RefObject<HTMLDivElement | null>;
  defaultShow?: boolean;
  isUserMessage?: boolean;
}) {
  const {
    content,
    isStreamFinished: _isStreamFinished,
    loading = false,
    fontSize,
    fontFamily,
    parentRef,
    defaultShow,
    isUserMessage = false,
  } = props;
  return (
    <Markdown
      content={content}
      loading={loading}
      fontSize={fontSize}
      fontFamily={fontFamily}
      parentRef={parentRef}
      defaultShow={defaultShow}
      isUserMessage={isUserMessage}
    />
  );
}
