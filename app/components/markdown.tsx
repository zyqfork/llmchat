import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import RehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import { copyToClipboard, useWindowSize } from "../utils";
import Locale from "../locales";
import LoadingIcon from "../icons/three-dots.svg";
import ReloadButtonIcon from "../icons/reload.svg";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
import { showImageModal, FullScreen } from "./ui-lib";
import { HTMLPreviewModal } from "./html-preview-modal";
import {
  ArtifactsPrintButton,
  HTMLPreview,
  HTMLPreviewHander,
} from "./artifacts";
import { useChatStore } from "../store";
import { IconButton } from "./button";
import { Collapse } from "antd";

import { useAppConfig } from "../store/config";
import clsx from "clsx";
import styles from "./markdown.module.scss";

// 配置安全策略，允许 thinkcollapse 标签，防止html注入造成页面崩溃
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
  className?: string;
  fontSize?: number;
}

const ThinkCollapse = ({
  title,
  children,
  className,
  fontSize,
}: ThinkCollapseProps) => {
  // 如果是 Thinking 状态，默认展开，否则折叠
  const defaultActive = title === Locale.NewChat.Thinking ? ["1"] : [];
  // 如果是 NoThink 状态，禁用
  const disabled = title === Locale.NewChat.NoThink;
  const [activeKeys, setActiveKeys] = useState(defaultActive);

  // 当标题从 Thinking 变为 Think 或 NoThink 时自动折叠
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

  const toggleCollapse = () => {
    if (!disabled) {
      setActiveKeys(activeKeys.length ? [] : ["1"]);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCollapse();
  };

  const handleCopyContent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 获取children的文本内容
    const getTextContent = (node: React.ReactNode): string => {
      if (typeof node === "string") return node;
      if (typeof node === "number") return String(node);
      if (React.isValidElement(node)) {
        if (node.props.children) {
          return getTextContent(node.props.children);
        }
      }
      if (Array.isArray(node)) {
        return node.map(getTextContent).join("");
      }
      return "";
    };

    const textContent = getTextContent(children);
    copyToClipboard(textContent);
  };

  return (
    <div
      onContextMenu={handleRightClick}
      onDoubleClick={handleDoubleClick}
      className={`${styles["think-collapse"]} ${
        disabled ? styles.disabled : ""
      } ${className || ""}`}
    >
      <Collapse
        className={`${disabled ? "disabled" : ""}`}
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
            children: children,
          },
        ]}
      ></Collapse>
    </div>
  );
};

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [mermaidApi, setMermaidApi] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    if (!props.code) return;
    import("mermaid")
      .then((mod) => {
        if (cancelled) return;
        setMermaidApi(mod.default ?? mod);
      })
      .catch(() => {
        setHasError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [props.code]);

  useEffect(() => {
    if (props.code && ref.current && mermaidApi) {
      mermaidApi
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch(() => {
          setHasError(true);
        });
    }
  }, [props.code, mermaidApi]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      className={clsx("no-dark", "mermaid")}
      style={{
        cursor: "pointer",
        overflow: "auto",
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {props.code}
    </div>
  );
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const previewRef = useRef<HTMLPreviewHander>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const { height } = useWindowSize();
  const chatStore = useChatStore();
  const session = chatStore.currentSession();

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
    const htmlDom = ref.current.querySelector("code.language-html");
    const refText = ref.current.querySelector("code")?.innerText;
    if (htmlDom) {
      setHtmlCode((htmlDom as HTMLElement).innerText);
    } else if (
      refText?.startsWith("<!DOCTYPE") ||
      refText?.startsWith("<svg") ||
      refText?.startsWith("<?xml")
    ) {
      setHtmlCode(refText);
    }
  }, 600);

  const config = useAppConfig();
  const enableArtifacts =
    session.mask?.enableArtifacts !== false && config.enableArtifacts;

  //Wrap the paragraph for plain-text
  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll(
        "code",
      ) as NodeListOf<HTMLElement>;
      const wrapLanguages = [
        "",
        "md",
        "markdown",
        "text",
        "txt",
        "plaintext",
        "tex",
        "latex",
      ];
      codeElements.forEach((codeElement) => {
        let languageClass = codeElement.className.match(/language-(\w+)/);
        let name = languageClass ? languageClass[1] : "";
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = "pre-wrap";
        }
      });
      setTimeout(renderArtifacts, 1);
    }
  }, [renderArtifacts]);

  return (
    <>
      <pre ref={ref}>
        <span
          className="copy-code-button"
          onClick={() => {
            if (ref.current) {
              copyToClipboard(
                ref.current.querySelector("code")?.innerText ?? "",
              );
            }
          }}
        ></span>
        {props.children}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {htmlCode.length > 0 && enableArtifacts && (
        <div className="no-dark html" style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              position: "absolute",
              right: 20,
              top: 10,
              zIndex: 1000,
            }}
          >
            <ArtifactsPrintButton
              style={{ position: "static" }}
              getCode={() => htmlCode}
            />
            <IconButton
              bordered
              icon={<ReloadButtonIcon />}
              title="刷新页面"
              shadow
              onClick={() => previewRef.current?.reload()}
            />
            <HTMLPreviewModal code={htmlCode} title="HTML 预览" />
          </div>
          <HTMLPreview
            ref={previewRef}
            code={htmlCode}
            autoHeight={true}
            height={600}
          />
        </div>
      )}
    </>
  );
}

function CustomCode(props: { children: any; className?: string }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableCodeFold =
    session.mask?.enableCodeFold !== false && config.enableCodeFold;

  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };
  const renderShowMoreButton = () => {
    if (showToggle && enableCodeFold && collapsed) {
      return (
        <div
          className={clsx("show-hide-button", {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <button onClick={toggleCollapsed}>{Locale.NewChat.More}</button>
        </div>
      );
    }
    return null;
  };
  return (
    <>
      <code
        className={clsx(props?.className)}
        ref={ref}
        style={{
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflowY: "hidden",
        }}
      >
        {props.children}
      </code>

      {renderShowMoreButton()}
    </>
  );
}

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
  // try add wrap html code (fixed: html codeblock include 2 newline)
  // ignore embed codeblock
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
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
  // 检查是否以 <think> 开头但没有结束标签
  if (text.startsWith("<think>") && !text.includes("</think>")) {
    // 获取 <think> 后的所有内容
    const thinkContent = text.slice("<think>".length);
    // 渲染为"思考中"状态
    const thinkText = `<thinkcollapse title="${Locale.NewChat.Thinking}">\n${thinkContent}\n\n</thinkcollapse>\n`;
    const remainText = ""; // 剩余文本为空
    return { thinkText, remainText };
  }

  // 处理完整的 think 标签
  const pattern = /^<think>([\s\S]*?)<\/think>/;
  const match = text.match(pattern);
  if (match) {
    const thinkContent = match[1];
    let thinkText = "";
    if (thinkContent.trim() === "") {
      thinkText = `<thinkcollapse title="${Locale.NewChat.NoThink}">\n\n</thinkcollapse>\n`;
    } else {
      thinkText = `<thinkcollapse title="${
        Locale.NewChat.Think
      }${Locale.NewChat.ThinkFormat(
        thinkingTime,
      )}">\n${thinkContent}\n\n</thinkcollapse>\n`;
    }
    const remainText = text.substring(match[0].length); // 提取剩余文本
    return { thinkText, remainText };
  }

  // 没有找到 think 标签
  return { thinkText: "", remainText: text };
}

function _MarkDownContent(props: {
  content: string;
  thinkingTime?: number;
  fontSize?: number;
  status?: boolean;
  isUserMessage?: boolean;
}) {
  // 预处理base64图片，将长base64 URL替换为占位符
  const { processedContent, imageMap } = useMemo(() => {
    const originalContent = tryWrapHtmlCode(escapeBrackets(props.content));
    const { thinkText, remainText } = formatThinkText(
      originalContent,
      props.thinkingTime,
    );
    let content = thinkText + remainText;

    const imageMap = new Map<string, string>();
    let imageCounter = 0;

    // 匹配 ![alt](data:image/...;base64,...) 格式的长base64图片
    content = content.replace(
      /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)\)/g,
      (match, alt, format, base64Data) => {
        // 只处理长度超过1000字符的base64数据
        if (base64Data.length > 1000) {
          imageCounter++;
          const placeholder = `BASE64_IMAGE_${imageCounter}`;
          const fullDataUrl = `data:image/${format};base64,${base64Data}`;
          imageMap.set(placeholder, fullDataUrl);
          return `![${alt || "image"}](${placeholder})`;
        }
        return match; // 短的base64保持原样
      },
    );

    return { processedContent: content, imageMap };
  }, [props.content, props.thinkingTime]);

  // 对于用户消息，直接原样渲染内容，不做任何Markdown处理
  if (props.isUserMessage) {
    return (
      <div
        className="user-message-content"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word", // +1
          tabSize: 4,
        }}
      >
        {props.content}
      </div>
    );
  }

  // 对于AI消息，使用原有的Markdown处理逻辑
  const rehypePlugins = [
    RehypeRaw,
    RehypeKatex as any,
    [rehypeSanitize, sanitizeOptions],
    [
      RehypeHighlight,
      {
        detect: false,
        ignoreMissing: true,
      },
    ],
  ];

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={rehypePlugins}
      components={
        {
          pre: PreCode,
          code: CustomCode,
          p: (pProps: any) => <p {...pProps} dir="auto" />,
          img: (imgProps: any) => {
            const { src, alt, ...otherProps } = imgProps;

            // 检查是否是我们的占位符
            let actualSrc = src;
            if (src && imageMap.has(src)) {
              actualSrc = imageMap.get(src);
            }

            // 处理base64图片或普通图片URL
            if (actualSrc) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  {...otherProps}
                  src={actualSrc}
                  alt={alt || "image"}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => showImageModal(actualSrc)}
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
          }) => (
            <ThinkCollapse title={title} fontSize={props.fontSize}>
              {children}
            </ThinkCollapse>
          ),
          a: (aProps: any) => {
            const href = aProps.href || "";
            if (/\.(aac|mp3|opus|wav)$/.test(href)) {
              return (
                <figure>
                  <audio controls src={href}></audio>
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
            const target = isInternal ? "_self" : aProps.target ?? "_blank";
            return <a {...aProps} target={target} />;
          },
        } as any
      }
    >
      {processedContent}
    </ReactMarkdown>
  );
}

// 优化MarkdownContent组件，增加内容缓存和增量更新
const MarkdownContent = React.memo(function MarkdownContent({
  content,
  thinkingTime,
  status,
  isUserMessage,
  fontSize,
}: {
  content: string;
  thinkingTime?: number;
  status?: boolean;
  isUserMessage?: boolean;
  fontSize?: number;
}) {
  // 使用更智能的缓存机制，只处理新增的内容
  const processedContent = useMemo(() => {
    // 避免重复处理整个字符串，直接返回内容
    const originalContent = tryWrapHtmlCode(escapeBrackets(content));
    const { thinkText, remainText } = formatThinkText(
      originalContent,
      thinkingTime,
    );
    return thinkText + remainText;
  }, [content, thinkingTime]);

  // 对于用户消息，直接原样渲染内容，不做任何Markdown处理
  if (isUserMessage) {
    return (
      <div
        className="user-message-content"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          tabSize: 4,
        }}
      >
        {content}
      </div>
    );
  }

  // 对于AI消息，使用原有的Markdown处理逻辑
  const rehypePlugins = [
    RehypeRaw,
    RehypeKatex as any,
    [rehypeSanitize, sanitizeOptions],
    [
      RehypeHighlight,
      {
        detect: false,
        ignoreMissing: true,
      },
    ],
  ];

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={rehypePlugins}
      components={
        {
          pre: PreCode,
          code: CustomCode,
          p: (pProps: any) => <p {...pProps} dir="auto" />,
          img: (imgProps: any) => {
            const { src, alt, ...otherProps } = imgProps;

            // 处理base64图片或普通图片URL
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
          }) => (
            <ThinkCollapse title={title} fontSize={fontSize}>
              {children}
            </ThinkCollapse>
          ),
          a: (aProps: any) => {
            const href = aProps.href || "";
            if (/\.(aac|mp3|opus|wav)$/.test(href)) {
              return (
                <figure>
                  <audio controls src={href}></audio>
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
            const target = isInternal ? "_self" : aProps.target ?? "_blank";
            return <a {...aProps} target={target} />;
          },
        } as any
      }
    >
      {processedContent}
    </ReactMarkdown>
  );
});

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
    thinkingTime?: number;
    status?: boolean;
    isUserMessage?: boolean;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

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
      ) : (
        <MarkdownContent
          content={props.content}
          thinkingTime={props.thinkingTime}
          fontSize={props.fontSize}
          status={props.status}
          isUserMessage={props.isUserMessage}
        />
      )}
    </div>
  );
}
