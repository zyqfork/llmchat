/* eslint-disable @next/next/no-img-element */
import { ChatMessage, useAppConfig, useChatStore } from "../store";
import Locale from "../locales";
import styles from "./exporter.module.scss";
import Image from "next/image";
import {
  List,
  ListItem,
  Modal,
  Select,
  showImageModal,
  showModal,
  showToast,
} from "./ui-lib";
import { IconButton } from "./button";
import {
  copyToClipboard,
  downloadAs,
  getMessageImages,
  useMobileScreen,
} from "../utils";

import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import ChatGptIcon from "../icons/chatgpt.png";
import ShareIcon from "../icons/share.svg";

import DownloadIcon from "../icons/download.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSelector, useMessageSelector } from "./message-selector";
import { Avatar } from "./emoji";
import dynamic from "next/dynamic";
import NextImage from "next/image";

import { toBlob, toPng } from "html-to-image";

import { prettyObject } from "../utils/format";
import { EXPORT_MESSAGE_CLASS_NAME } from "../constant";
import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
} from "../utils";
import { MaskAvatar } from "./mask";
import { getMaskEffectiveModel } from "../utils/model-resolver";
import clsx from "clsx";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function ExportMessageModal(props: { onClose: () => void }) {
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Export.Title}
        onClose={props.onClose}
        footer={
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: 14,
              opacity: 0.5,
            }}
          >
            {Locale.Exporter.Description.Title}
          </div>
        }
      >
        <div style={{ minHeight: "40vh" }}>
          <MessageExporter />
        </div>
      </Modal>
    </div>
  );
}

function useSteps(
  steps: Array<{
    name: string;
    value: string;
  }>,
) {
  const stepCount = steps.length;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const nextStep = () =>
    setCurrentStepIndex((currentStepIndex + 1) % stepCount);
  const prevStep = () =>
    setCurrentStepIndex((currentStepIndex - 1 + stepCount) % stepCount);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    currentStep: steps[currentStepIndex],
  };
}

function Steps<
  T extends {
    name: string;
    value: string;
  }[],
>(props: { steps: T; onStepChange?: (index: number) => void; index: number }) {
  const steps = props.steps;
  const stepCount = steps.length;

  return (
    <div className={styles["steps"]}>
      <div className={styles["steps-progress"]}>
        <div
          className={styles["steps-progress-inner"]}
          style={{
            width: `${((props.index + 1) / stepCount) * 100}%`,
          }}
        ></div>
      </div>
      <div className={styles["steps-inner"]}>
        {steps.map((step, i) => {
          return (
            <div
              key={i}
              className={clsx("clickable", styles["step"], {
                [styles["step-finished"]]: i <= props.index,
                [styles["step-current"]]: i === props.index,
              })}
              onClick={() => {
                props.onStepChange?.(i);
              }}
              role="button"
            >
              <span className={styles["step-index"]}>{i + 1}</span>
              <span className={styles["step-name"]}>{step.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MessageExporter() {
  const steps = [
    {
      name: Locale.Export.Steps.Select,
      value: "select",
    },
    {
      name: Locale.Export.Steps.Preview,
      value: "preview",
    },
  ];
  const { currentStep, setCurrentStepIndex, currentStepIndex } =
    useSteps(steps);
  const formats = ["text", "image", "json"] as const;
  type ExportFormat = (typeof formats)[number];

  const [exportConfig, setExportConfig] = useState({
    format: "image" as ExportFormat,
    includeContext: true,
  });

  function updateExportConfig(updater: (config: typeof exportConfig) => void) {
    const config = { ...exportConfig };
    updater(config);
    setExportConfig(config);
  }

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const { selection, updateSelection } = useMessageSelector();
  const selectedMessages = useMemo(() => {
    const ret: ChatMessage[] = [];
    if (exportConfig.includeContext) {
      ret.push(...session.mask.context);
    }
    ret.push(...session.messages.filter((m) => selection.has(m.id)));
    return ret;
  }, [
    exportConfig.includeContext,
    session.messages,
    session.mask.context,
    selection,
  ]);
  function preview() {
    if (exportConfig.format === "text") {
      return (
        <MarkdownPreviewer messages={selectedMessages} topic={session.topic} />
      );
    } else if (exportConfig.format === "json") {
      return (
        <JsonPreviewer messages={selectedMessages} topic={session.topic} />
      );
    } else {
      return (
        <ImagePreviewer messages={selectedMessages} topic={session.topic} />
      );
    }
  }
  return (
    <>
      <Steps
        steps={steps}
        index={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      />
      <div
        className={styles["message-exporter-body"]}
        style={currentStep.value !== "select" ? { display: "none" } : {}}
      >
        <List>
          <ListItem
            title={Locale.Export.Format.Title}
            subTitle={Locale.Export.Format.SubTitle}
          >
            <Select
              value={exportConfig.format}
              onChange={(e) =>
                updateExportConfig(
                  (config) =>
                    (config.format = e.currentTarget.value as ExportFormat),
                )
              }
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </ListItem>
          <ListItem
            title={Locale.Export.IncludeContext.Title}
            subTitle={Locale.Export.IncludeContext.SubTitle}
          >
            <input
              type="checkbox"
              checked={exportConfig.includeContext}
              onChange={(e) => {
                updateExportConfig(
                  (config) => (config.includeContext = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
        </List>
        <MessageSelector
          selection={selection}
          updateSelection={updateSelection}
          defaultSelectAll
        />
      </div>
      {currentStep.value === "preview" && (
        <div className={styles["message-exporter-body"]}>{preview()}</div>
      )}
    </>
  );
}

export function RenderExport(props: {
  messages: ChatMessage[];
  onRender: (messages: ChatMessage[]) => void;
}) {
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domRef.current) return;
    const dom = domRef.current;
    const messages = Array.from(
      dom.getElementsByClassName(EXPORT_MESSAGE_CLASS_NAME),
    );

    if (messages.length !== props.messages.length) {
      return;
    }

    const renderMsgs = messages.map((v, i) => {
      const [role, _] = v.id.split(":");
      return {
        id: i.toString(),
        role: role as any,
        content: role === "user" ? v.textContent ?? "" : v.innerHTML,
        date: "",
      };
    });

    props.onRender(renderMsgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={domRef}>
      {props.messages.map((m, i) => (
        <div
          key={i}
          id={`${m.role}:${i}`}
          className={EXPORT_MESSAGE_CLASS_NAME}
        >
          <Markdown
            content={
              m.role === "user"
                ? getMessageTextContent(m)
                : getMessageTextContentWithoutThinking(m)
            }
            defaultShow
          />
        </div>
      ))}
    </div>
  );
}

export function PreviewActions(props: {
  download: () => void;
  copy: () => void;
  showCopy?: boolean;
  messages?: ChatMessage[];
}) {
  const [loading, setLoading] = useState(false);
  const [shouldExport, setShouldExport] = useState(false);

  const print = async () => {
    if (props.messages?.length) {
      setLoading(true);
      setShouldExport(true);
    }
  };

  const onRenderMsgs = (msgs: ChatMessage[]) => {
    setShouldExport(false);

    // 创建打印窗口
    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) {
      showToast("无法打开打印窗口，请检查浏览器设置");
      setLoading(false);
      return;
    }

    // 构建更丰富的打印内容
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LLMChat 聊天记录</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
              line-height: 1.6;
            }
            
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .logo {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 10px;
              position: relative;
              z-index: 1;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .subtitle {
              font-size: 16px;
              opacity: 0.9;
              margin-bottom: 5px;
              position: relative;
              z-index: 1;
            }
            
            .print-info {
              font-size: 14px;
              opacity: 0.8;
              position: relative;
              z-index: 1;
            }
            
            .content {
              padding: 40px;
              background: #fafbfc;
            }
            
            .message-wrapper {
              margin-bottom: 25px;
              display: flex;
              align-items: flex-start;
            }
            
            .message-user {
              justify-content: flex-end;
            }
            
            .message-assistant {
              justify-content: flex-start;
            }
            
            .avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              margin: 0 15px;
              flex-shrink: 0;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .avatar-user {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
            }
            
            .avatar-assistant {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              color: white;
            }
            
            .message-bubble {
              max-width: 70%;
              padding: 16px 20px;
              border-radius: 18px;
              position: relative;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              transition: transform 0.2s ease;
            }
            
            .message-bubble:hover {
              transform: translateY(-2px);
            }
            
            .message-user .message-bubble {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border-bottom-right-radius: 4px;
            }
            
            .message-assistant .message-bubble {
              background: white;
              color: #374151;
              border: 1px solid #e5e7eb;
              border-bottom-left-radius: 4px;
            }
            
            .message-content {
              font-size: 15px;
              line-height: 1.5;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            
            .message-time {
              font-size: 12px;
              opacity: 0.7;
              margin-top: 8px;
            }
            
            .stats {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            
            .stats-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 15px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 20px;
            }
            
            .stat-item {
              background: white;
              padding: 20px;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: #4f46e5;
              margin-bottom: 5px;
            }
            
            .stat-label {
              font-size: 14px;
              color: #6b7280;
            }
            
            .footer {
              background: #1f2937;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 14px;
            }
            
            .footer a {
              color: #60a5fa;
              text-decoration: none;
            }
            
            .footer a:hover {
              text-decoration: underline;
            }
            
            @media print {
              body {
                background: white !important;
                padding: 0 !important;
              }
              
              .container {
                box-shadow: none !important;
                border-radius: 0 !important;
              }
              
              .header {
                background: #4f46e5 !important;
                color: white !important;
              }
              
              .message-user .message-bubble {
                background: #3b82f6 !important;
                color: white !important;
              }
              
              .message-assistant .message-bubble {
                background: white !important;
                color: #374151 !important;
                border: 1px solid #e5e7eb !important;
              }
              
              .stats {
                background: #f3f4f6 !important;
              }
              
              .stat-value {
                color: #4f46e5 !important;
              }
            }
            
            @media (max-width: 768px) {
              .message-wrapper {
                margin-bottom: 20px;
              }
              
              .message-bubble {
                max-width: 85%;
              }
              
              .avatar {
                width: 35px;
                height: 35px;
                font-size: 16px;
              }
              
              .header {
                padding: 30px 20px;
              }
              
              .content {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🤖 LLMChat</div>
              <div class="subtitle">智能对话记录</div>
              <div class="print-info">打印时间：${new Date().toLocaleString()}</div>
            </div>
            
            <div class="content">
              ${msgs
                .map((msg, index) => {
                  const content =
                    typeof msg.content === "string"
                      ? msg.content
                      : JSON.stringify(msg.content);
                  const isUser = msg.role === "user";
                  const avatar = isUser ? "👤" : "🤖";
                  const time = new Date().toLocaleString();

                  return `
                  <div class="message-wrapper message-${msg.role}">
                    ${
                      isUser
                        ? ""
                        : `<div class="avatar avatar-assistant">${avatar}</div>`
                    }
                    <div class="message-bubble">
                      <div class="message-content">
                        ${content.replace(/</g, "<").replace(/>/g, ">")}
                      </div>
                      <div class="message-time">${time}</div>
                    </div>
                    ${
                      isUser
                        ? `<div class="avatar avatar-user">${avatar}</div>`
                        : ""
                    }
                  </div>
                `;
                })
                .join("")}
            </div>
            
            <div class="stats">
              <div class="stats-title">📊 对话统计</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">${msgs.length}</div>
                  <div class="stat-label">总消息数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${
                    msgs.filter((m) => m.role === "user").length
                  }</div>
                  <div class="stat-label">用户消息</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${
                    msgs.filter((m) => m.role === "assistant").length
                  }</div>
                  <div class="stat-label">助手回复</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>由 <a href="https://github.com/zyqfork/llmchat" target="_blank">LLMChat</a> 生成</p>
              <p>© ${new Date().getFullYear()} - 保留所有权利</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              // 添加淡入动画
              document.body.style.opacity = '0';
              document.body.style.transition = 'opacity 0.5s ease';
              
              setTimeout(function() {
                document.body.style.opacity = '1';
              }, 100);
              
              // 延迟打印以确保样式加载完成
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 2000);
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <>
      <div className={styles["preview-actions"]}>
        {props.showCopy && (
          <IconButton
            text={Locale.Export.Copy}
            bordered
            shadow
            icon={<CopyIcon />}
            onClick={props.copy}
          ></IconButton>
        )}
        <IconButton
          text={Locale.Export.Download}
          bordered
          shadow
          icon={<DownloadIcon />}
          onClick={props.download}
        ></IconButton>
        <IconButton
          text="打印"
          bordered
          shadow
          icon={loading ? <LoadingIcon /> : <ShareIcon />}
          onClick={print}
        ></IconButton>
      </div>
      <div
        style={{
          position: "fixed",
          right: "200vw",
          pointerEvents: "none",
        }}
      >
        {shouldExport && (
          <RenderExport
            messages={props.messages ?? []}
            onRender={onRenderMsgs}
          />
        )}
      </div>
    </>
  );
}

export function ImagePreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const mask = session.mask;
  const config = useAppConfig();

  const previewRef = useRef<HTMLDivElement>(null);

  const copy = () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;
    toBlob(dom).then((blob) => {
      if (!blob) return;
      try {
        navigator.clipboard
          .write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ])
          .then(() => {
            showToast(Locale.Copy.Success);
            refreshPreview();
          });
      } catch (e) {
        console.error("[Copy Image] ", e);
        showToast(Locale.Copy.Failed);
      }
    });
  };

  const isMobile = useMobileScreen();

  const download = async () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;

    const isApp = getClientConfig()?.isApp;

    try {
      const blob = await toPng(dom);
      if (!blob) return;

      if (isMobile || (isApp && window.__TAURI__)) {
        if (isApp && window.__TAURI__) {
          const result = await window.__TAURI__.dialog.save({
            defaultPath: `${props.topic}.png`,
            filters: [
              {
                name: "PNG Files",
                extensions: ["png"],
              },
              {
                name: "All Files",
                extensions: ["*"],
              },
            ],
          });

          if (result !== null) {
            const response = await fetch(blob);
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            await window.__TAURI__.fs.writeBinaryFile(result, uint8Array);
            showToast(Locale.Download.Success);
          } else {
            showToast(Locale.Download.Failed);
          }
        } else {
          showImageModal(blob);
        }
      } else {
        const link = document.createElement("a");
        link.download = `${props.topic}.png`;
        link.href = blob;
        link.click();
        refreshPreview();
      }
    } catch (error) {
      showToast(Locale.Download.Failed);
    }
  };

  const refreshPreview = () => {
    const dom = previewRef.current;
    if (dom) {
      dom.innerHTML = dom.innerHTML; // Refresh the content of the preview by resetting its HTML for fix a bug glitching
    }
  };

  return (
    <div className={styles["image-previewer"]}>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={!isMobile}
        messages={props.messages}
      />
      <div
        className={clsx(styles["preview-body"], styles["default-theme"])}
        ref={previewRef}
      >
        <div className={styles["chat-info"]}>
          <div className={clsx(styles["logo"], "no-dark")}>
            <NextImage
              src={ChatGptIcon.src}
              alt="logo"
              width={50}
              height={50}
            />
          </div>

          <div>
            <div className={styles["main-title"]}>LLMChat</div>
            <div className={styles["sub-title"]}>
              github.com/zyqfork/llmchat
            </div>
            <div className={styles["icons"]}>
              <MaskAvatar avatar={config.avatar} />
              <span className={styles["icon-space"]}>&</span>
              <MaskAvatar
                avatar={mask.avatar}
                model={getMaskEffectiveModel(session.mask) as any}
              />
            </div>
          </div>
          <div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Model}: {getMaskEffectiveModel(mask)}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Messages}: {props.messages.length}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Topic}: {session.topic}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Time}:{" "}
              {new Date(
                props.messages.at(-1)?.date ?? Date.now(),
              ).toLocaleString()}
            </div>
          </div>
        </div>
        {props.messages.map((m, i) => {
          return (
            <div
              className={clsx(styles["message"], styles["message-" + m.role])}
              key={i}
            >
              <div className={styles["avatar"]}>
                {m.role === "user" ? (
                  <Avatar avatar={config.avatar}></Avatar>
                ) : (
                  <MaskAvatar
                    avatar={session.mask.avatar}
                    model={
                      m.model || (getMaskEffectiveModel(session.mask) as any)
                    }
                  />
                )}
              </div>

              <div className={styles["body"]}>
                <Markdown
                  content={
                    m.role === "user"
                      ? getMessageTextContent(m)
                      : getMessageTextContentWithoutThinking(m)
                  }
                  fontSize={config.fontSize}
                  fontFamily={config.fontFamily}
                  defaultShow
                />
                {getMessageImages(m).length == 1 && (
                  <div className={styles["message-image-container"]}>
                    <Image
                      key={i}
                      src={getMessageImages(m)[0]}
                      alt="message"
                      className={styles["message-image"]}
                      fill
                      unoptimized
                    />
                  </div>
                )}
                {getMessageImages(m).length > 1 && (
                  <div
                    className={styles["message-images"]}
                    style={
                      {
                        "--image-count": getMessageImages(m).length,
                      } as React.CSSProperties
                    }
                  >
                    {getMessageImages(m).map((src, i) => (
                      <div
                        key={i}
                        className={styles["message-image-multi-container"]}
                      >
                        <Image
                          src={src}
                          alt="message"
                          className={styles["message-image-multi"]}
                          fill
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarkdownPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const mdText =
    `# ${props.topic}\n\n` +
    props.messages
      .map((m) => {
        return m.role === "user"
          ? `## ${Locale.Export.MessageFromYou}:\n${getMessageTextContent(m)}`
          : `## ${
              Locale.Export.MessageFromChatGPT
            }:\n${getMessageTextContentWithoutThinking(m).trim()}`;
      })
      .join("\n\n");

  const copy = () => {
    copyToClipboard(mdText);
  };
  const download = () => {
    downloadAs(mdText, `${props.topic}.md`);
  };
  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={true}
        messages={props.messages}
      />
      <div className="markdown-body">
        <pre className={styles["export-content"]}>{mdText}</pre>
      </div>
    </>
  );
}

export function JsonPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const msgs = {
    messages: [
      {
        role: "system",
        content: `${Locale.FineTuned.Sysmessage} ${props.topic}`,
      },
      ...props.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  };
  const mdText = "```json\n" + JSON.stringify(msgs, null, 2) + "\n```";
  const minifiedJson = JSON.stringify(msgs);

  const copy = () => {
    copyToClipboard(minifiedJson);
  };
  const download = () => {
    downloadAs(JSON.stringify(msgs), `${props.topic}.json`);
  };

  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={false}
        messages={props.messages}
      />
      <div className="markdown-body" onClick={copy}>
        <Markdown content={mdText} />
      </div>
    </>
  );
}
