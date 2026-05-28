"use client";

import "katex/dist/katex.min.css";
import { useMemo, RefObject, useRef } from "react";
import Locale from "../locales";
import LoadingIcon from "../icons/three-dots.svg";
import React from "react";
import { LlmMarkdownRenderer } from "./llm-ui/LlmMarkdownRenderer";

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

function tryWrapHtmlCode(text: string) {
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, _lang, _newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, _newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

function formatThinkText(
  text: string,
  thinkingTime?: number,
): {
  thinkText: string;
  remainText: string;
} {
  text = text.trimStart();
  if (text.startsWith("<think>") && !text.includes("</think>")) {
    const thinkContent = text.slice("<think>".length);
    const thinkText = `<thinkcollapse title="${Locale.NewChat.Thinking}">\n${thinkContent}\n\n</thinkcollapse>\n`;
    return { thinkText, remainText: "" };
  }

  const pattern = /^<think>([\s\S]*?)<\/think>/;
  const match = text.match(pattern);
  if (match) {
    const thinkContent = match[1];
    let thinkText = "";
    if (thinkContent.trim() === "") {
      thinkText = `<thinkcollapse title="${Locale.NewChat.NoThink}">\n\n</thinkcollapse>\n`;
    } else {
      thinkText = `<thinkcollapse title="${Locale.NewChat.Think}${Locale.NewChat.ThinkFormat(
        thinkingTime,
      )}">\n${thinkContent}\n\n</thinkcollapse>\n`;
    }
    const remainText = text.substring(match[0].length);
    return { thinkText, remainText };
  }

  return { thinkText: "", remainText: text };
}

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    parentRef?: RefObject<HTMLDivElement | null>;
    defaultShow?: boolean;
    thinkingTime?: number;
    status?: boolean;
    isUserMessage?: boolean;
    isStreamFinished?: boolean;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  const processedContent = useMemo(() => {
    if (props.isUserMessage) {
      return props.content;
    }
    const originalContent = tryWrapHtmlCode(escapeBrackets(props.content));
    const { thinkText, remainText } = formatThinkText(
      originalContent,
      props.thinkingTime,
    );
    return thinkText + remainText;
  }, [props.content, props.thinkingTime, props.isUserMessage]);

  return (
    <div
      className="markdown-body"
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
        fontFamily: props.fontFamily || "inherit",
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <LoadingIcon />
      ) : props.isUserMessage ? (
        <div
          className="user-message-content"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            tabSize: 4,
          }}
        >
          {props.content}
        </div>
      ) : (
        <LlmMarkdownRenderer
          content={processedContent}
          isStreamFinished={props.isStreamFinished ?? true}
        />
      )}
    </div>
  );
}
