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
import { copyToClipboard } from "../utils";
import Locale from "../locales";
import { showImageModal } from "./ui-lib";
import { useAppConfig } from "../store/config";
import { useChatStore } from "../store";
import { getPreviewLanguage } from "./code-preview/preview-utils";
import { PreviewCodeBlockRoute } from "./code-preview/preview-code-route";
import styles from "./markdown.module.scss";

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

  const handleCopyContent = (e: React.SyntheticEvent) => {
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
                  <button
                    type="button"
                    className={styles["copy-think-button"]}
                    onPointerDown={(e) => {
                      if (e.pointerType === "mouse" && e.button === 0) {
                        handleCopyContent(e);
                      }
                    }}
                    onClick={(e) => {
                      if (
                        e.detail === 0 ||
                        (typeof TouchEvent !== "undefined" &&
                          e.nativeEvent instanceof TouchEvent)
                      ) {
                        handleCopyContent(e);
                      }
                    }}
                    title={Locale.Chat.Actions.Copy}
                    aria-label={Locale.Chat.Actions.Copy}
                  >
                    📋
                  </button>
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

function extractCodeFromPreChild(codeChild: React.ReactElement) {
  const extractCodeText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) {
      return node.map(extractCodeText).join("");
    }
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      if (element.props?.children) {
        return extractCodeText(element.props.children);
      }
    }
    return "";
  };

  const className = String(
    (codeChild.props as { className?: string }).className || "",
  );
  const langMatch = className.match(/language-([\w-]+)/i);
  return {
    code: extractCodeText(codeChild).replace(/\n$/, ""),
    language: langMatch?.[1],
  };
}

function createMarkdownComponents(options: {
  enableArtifacts: boolean;
  isStreaming: boolean;
}) {
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
      // 内联代码：没有 className 或不是语言类名
      if (!className || !className.startsWith("language-")) {
        return (
          <code
            {...rest}
            style={{
              backgroundColor: "var(--gray-100)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.9em",
              fontFamily:
                'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            }}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className={className}
          {...rest}
          style={{
            display: "block",
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {children}
        </code>
      );
    },
    pre: (preProps: any) => {
      const { children, ...rest } = preProps;
      // 检查是否是代码块 —— ReactMarkdown 使用自定义 code 组件时，
      // child.type 不是字符串 'code' 而是自定义组件函数，
      // 所以需要同时检查字符串和函数类型
      const codeChild = React.Children.toArray(children).find(
        (child: any) =>
          React.isValidElement(child) &&
          (child.type === "code" ||
            typeof child.type === "function" ||
            (child.props as any)?.className?.toString().includes("language-")),
      );

      if (codeChild && React.isValidElement(codeChild)) {
        const { code: codeText, language } = extractCodeFromPreChild(
          codeChild as React.ReactElement,
        );
        const previewKind = getPreviewLanguage(codeText, language);
        const canPreview =
          previewKind && !(previewKind === "html" && !options.enableArtifacts);
        if (canPreview) {
          return (
            <PreviewCodeBlockRoute
              previewKind={previewKind}
              code={codeText}
              language={language}
              isStreaming={options.isStreaming}
              enableArtifacts={options.enableArtifacts}
            />
          );
        }

        return (
          <div
            style={{
              position: "relative",
              border: "var(--border-in-light)",
              borderRadius: "8px",
              backgroundColor: "var(--white)",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 10px",
                borderBottom: "var(--border-in-light)",
                background: "var(--gray-50)",
              }}
            >
              <div style={{ marginLeft: "auto" }}>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    if (e.pointerType === "mouse" && e.button === 0) {
                      copyToClipboard(codeText);
                    }
                  }}
                  onClick={(e) => {
                    if (
                      e.detail === 0 ||
                      (typeof TouchEvent !== "undefined" &&
                        e.nativeEvent instanceof TouchEvent)
                    ) {
                      copyToClipboard(codeText);
                    }
                  }}
                  style={{
                    border: "var(--border-in-light)",
                    background: "var(--white)",
                    color: "var(--black)",
                    borderRadius: "6px",
                    minWidth: "28px",
                    height: "28px",
                    padding: "0 8px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                  title="复制当前源码"
                >
                  复制
                </button>
              </div>
            </div>
            <pre
              {...rest}
              style={{
                margin: 0,
                padding: "12px",
                overflow: "auto",
                backgroundColor: "var(--white)",
                fontSize: "14px",
                lineHeight: "1.5",
                fontFamily:
                  'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {children}
            </pre>
          </div>
        );
      }

      return (
        <pre
          {...rest}
          style={{
            margin: "10px 0",
            padding: "12px",
            overflow: "auto",
            backgroundColor: "var(--white)",
            border: "var(--border-in-light)",
            borderRadius: "8px",
            fontSize: "14px",
            lineHeight: "1.5",
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {children}
        </pre>
      );
    },
  } as any;
}

const rehypePlugins = [
  RehypeRaw,
  RehypeKatex as any,
  [rehypeSanitize, sanitizeOptions],
];

export function MarkdownContent(props: {
  content: string;
  isStreaming: boolean;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableArtifacts =
    session.mask?.enableArtifacts !== false && config.enableArtifacts;

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={rehypePlugins}
      components={createMarkdownComponents({
        enableArtifacts,
        isStreaming: props.isStreaming,
      })}
    >
      {props.content}
    </ReactMarkdown>
  );
}
