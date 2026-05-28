"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Collapse } from "antd";
import type { LLMOutputComponent } from "@llm-ui/react";
import { copyToClipboard } from "../../utils";
import Locale from "../../locales";
import { showImageModal } from "../ui-lib";
import styles from "../markdown.module.scss";

const sanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div || []),
      ["className", "math", "math-display"],
    ],
    img: [
      ...(defaultSchema.attributes?.img || []),
      ["src", ["http:", "https:", "data"]],
    ],
    math: [["xmlns", "http://www.w3.org/1998/Math/MathML"], "display"],
    annotation: ["encoding"],
    span: ["className", "style"],
    svg: [
      ["xmlns", "http://www.w3.org/2000/svg"],
      "width",
      "height",
      "viewBox",
      "preserveAspectRatio",
    ],
    path: ["d"],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "thinkcollapse",
    "math",
    "semantics",
    "annotation",
    "mrow",
    "mi",
    "mo",
    "mfrac",
    "mn",
    "msup",
    "msub",
    "svg",
    "path",
  ],
};

interface ThinkCollapseProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
}

function ThinkCollapse({ title, children }: ThinkCollapseProps) {
  const defaultActive = title === Locale.NewChat.Thinking ? ["1"] : [];
  const disabled = title === Locale.NewChat.NoThink;
  const [activeKeys, setActiveKeys] = useState(defaultActive);

  useEffect(() => {
    if (
      (typeof title === "string" && title.includes(Locale.NewChat.Think)) ||
      title === Locale.NewChat.NoThink
    ) {
      setActiveKeys([]);
    } else if (title === Locale.NewChat.Thinking) {
      setActiveKeys(["1"]);
    }
  }, [title]);

  const handleCopyContent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const getTextContent = (node: React.ReactNode): string => {
      if (typeof node === "string") return node;
      if (typeof node === "number") return String(node);
      if (React.isValidElement(node)) {
        const element = node as React.ReactElement<{
          children?: React.ReactNode;
        }>;
        if (element.props?.children) {
          return getTextContent(element.props.children);
        }
      }
      if (Array.isArray(node)) {
        return node.map(getTextContent).join("");
      }
      return "";
    };
    copyToClipboard(getTextContent(children));
  };

  return (
    <div
      className={`${styles["think-collapse"]} ${disabled ? styles.disabled : ""}`}
    >
      <Collapse
        className={disabled ? "disabled" : ""}
        size="small"
        activeKey={activeKeys}
        onChange={(keys) => !disabled && setActiveKeys(keys as string[])}
        bordered={false}
        items={[
          {
            key: "1",
            label: (
              <div className={styles["think-collapse-header"]}>
                <span>{title}</span>
                {!disabled && (
                  <span
                    className={styles["copy-think-button"]}
                    onClick={handleCopyContent}
                    title={Locale.Chat.Actions.Copy}
                  >
                    📋
                  </span>
                )}
              </div>
            ),
            children,
          },
        ]}
      />
    </div>
  );
}

function createMarkdownComponents() {
  return {
    p: (pProps: any) => <p {...pProps} dir="auto" />,
    img: (imgProps: any) => {
      const { src, alt, ...otherProps } = imgProps;
      if (src) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            {...otherProps}
            src={src}
            alt={alt || "image"}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => showImageModal(src)}
          />
        );
      }
      return <span>{alt || "[Image]"}</span>;
    },
    thinkcollapse: ({
      title,
      children,
    }: {
      title: string;
      children: React.ReactNode;
    }) => <ThinkCollapse title={title}>{children}</ThinkCollapse>,
    a: (aProps: any) => {
      const href = aProps.href || "";
      if (/\.(aac|mp3|opus|wav)$/.test(href)) {
        return (
          <figure>
            <audio controls src={href} />
          </figure>
        );
      }
      if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
        return (
          <video controls width="99.9%">
            <source src={href} />
          </video>
        );
      }
      const isInternal = /^\/#/i.test(href);
      const target = isInternal ? "_self" : (aProps.target ?? "_blank");
      return <a {...aProps} target={target} />;
    },
    code: (codeProps: any) => {
      const { className, children, ...rest } = codeProps;
      if (className) {
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        );
      }
      return <code {...rest}>{children}</code>;
    },
  } as any;
}

const rehypePlugins = [
  RehypeRaw,
  RehypeKatex as any,
  [rehypeSanitize, sanitizeOptions],
];

export const MarkdownBlock: LLMOutputComponent = ({ blockMatch }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={rehypePlugins}
      components={createMarkdownComponents()}
    >
      {blockMatch.output}
    </ReactMarkdown>
  );
};
