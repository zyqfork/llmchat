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
import ChatGptIcon from "../icons/chatgpt.svg";
import ShareIcon from "../icons/share.svg";

import DownloadIcon from "../icons/download.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSelector, useMessageSelector } from "./message-selector";
import { Avatar } from "./emoji";
import dynamic from "next/dynamic";

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
            isUserMessage={m.role === "user"}
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

  const print = async () => {
    if (!props.messages?.length) return;

    setLoading(true);

    const session = useChatStore.getState().currentSession();
    const msgs = props.messages;

    // 使用隐藏 iframe 打印，Web 和 Tauri 统一，不弹新窗口
    const isTauri = typeof window !== "undefined" && (window as any).__TAURI__;
    let cleanup: (() => void) | undefined;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "200vw";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);
    cleanup = () => iframe.remove();
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      cleanup?.();
      showToast("无法打开打印窗口，请检查浏览器设置");
      setLoading(false);
      return;
    }

    // 构建更丰富的打印内容
    const appConfig = useAppConfig.getState();
    const decodeAvatar = (code: string, fallback: string) => {
      if (!code) return fallback;
      if (/^[0-9a-fA-F]+$/.test(code)) {
        const val = parseInt(code, 16);
        if (!Number.isNaN(val)) return String.fromCodePoint(val);
      }
      return code;
    };
    const userAvatar = decodeAvatar(appConfig.avatar as string, "🙂");
    const assistantAvatar = decodeAvatar(session.mask.avatar as string, "🤖");
    const safeDate = (d?: string) => {
      const dt = d ? new Date(d) : new Date();
      return isNaN(dt.getTime())
        ? new Date().toLocaleString()
        : dt.toLocaleString();
    };
    const headerTime = safeDate(msgs.at(-1)?.date);

    // 多模型消息分组逻辑
    const groupMessages = () => {
      const groups: Array<{
        type: "single" | "multi-assistant";
        messages: typeof msgs;
      }> = [];

      let i = 0;
      while (i < msgs.length) {
        const message = msgs[i];

        // 检查是否是用户消息，且后面跟着多个多模型assistant消息
        if (message.role === "user") {
          // 查找该用户消息后的所有连续的多模型assistant消息
          const assistantMessages: typeof msgs = [];
          let j = i + 1;
          while (
            j < msgs.length &&
            msgs[j].role === "assistant" &&
            msgs[j].isMultiModel
          ) {
            assistantMessages.push(msgs[j]);
            j++;
          }

          // 先添加用户消息
          groups.push({
            type: "single",
            messages: [message],
          });

          // 如果有多个assistant消息，横向分组
          if (assistantMessages.length > 1) {
            groups.push({
              type: "multi-assistant",
              messages: assistantMessages,
            });
            i = j;
          } else if (assistantMessages.length === 1) {
            // 只有一个assistant消息，正常显示
            groups.push({
              type: "single",
              messages: assistantMessages,
            });
            i = j;
          } else {
            i++;
          }
        } else {
          // 非用户消息，正常显示
          groups.push({
            type: "single",
            messages: [message],
          });
          i++;
        }
      }

      return groups;
    };

    const messageGroups = groupMessages();

    // 收集所有使用的模型
    const usedModels = new Set<string>();
    msgs.forEach((msg) => {
      if (msg.role === "assistant" && msg.isMultiModel && msg.modelKey) {
        const [modelName] = msg.modelKey.split("@");
        if (modelName) usedModels.add(modelName);
      }
    });
    const usedModelsArray = Array.from(usedModels);
    const isMultiModelChat = usedModelsArray.length > 1;

    // 计算实际的消息数（多模型的assistant消息算作一组）
    let actualMessageCount = 0;
    messageGroups.forEach((group) => {
      if (group.type === "multi-assistant") {
        actualMessageCount += 1; // 多个模型回复算作一条
      } else {
        actualMessageCount += group.messages.length;
      }
    });

    // 获取消息文本内容的辅助函数
    const getMsgContent = (msg: ChatMessage) => {
      const content = getMessageTextContentWithoutThinking(msg);
      return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LLMChat 聊天记录</title>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 16px;
              font-family: "Noto Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #fff;
              color: #111827;
              line-height: 1.6;
            }
            .container { max-width: 820px; margin: 0 auto; }
            .header {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .title { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; }
            .meta {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 8px;
              color: #4b5563;
              font-size: 13px;
            }
            .chip {
              padding: 4px 10px;
              border: 1px solid #e5e7eb;
              border-radius: 999px;
              background: #f9fafb;
            }
            .messages { margin-top: 18px; }
            .message {
              display: flex;
              gap: 12px;
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .message.user { 
              flex-direction: row-reverse;
            }
            .avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              color: #374151;
              flex-shrink: 0;
            }
            .bubble {
              flex: 1;
              padding: 12px 14px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              background: #fff;
              font-size: 14px;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            .user .bubble { 
              background: #f3f4f6; 
              text-align: right;
              flex: none;
              max-width: 70%;
            }
            .assistant .bubble { background: #fff; }
            .msg-head {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 8px;
              margin-bottom: 6px;
              color: #4b5563;
              font-size: 12px;
            }
            .user .msg-head {
              flex-direction: row-reverse;
            }
            .role { font-weight: 700; color: #111827; font-size: 13px; }
            .images {
              display: grid;
              gap: 10px;
              margin-top: 10px;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            }
            .image {
              width: 100%;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              object-fit: contain;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              margin-top: 14px;
              color: #6b7280;
              font-size: 12px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              align-items: center;
            }
            /* 多模型横向布局样式 */
            .multi-model-container {
              display: flex;
              gap: 12px;
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .multi-model-column {
              flex: 1;
              min-width: 0;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 10px;
              background: #fff;
            }
            .multi-model-header {
              display: flex;
              align-items: center;
              gap: 8px;
              padding-bottom: 8px;
              margin-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .multi-model-name {
              font-weight: 600;
              font-size: 13px;
              color: #111827;
            }
            .multi-model-provider {
              font-size: 11px;
              color: #3b82f6;
              opacity: 0.8;
            }
            .multi-model-content {
              font-size: 14px;
              line-height: 1.6;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            @media print {
              body { padding: 0; }
              .container { padding: 12px 16px; }
              .message { page-break-inside: avoid; }
              .multi-model-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">LLMChat 聊天记录</div>
              <div class="meta">
                <span class="chip">模型：${
                  isMultiModelChat
                    ? `${usedModelsArray.length}个模型`
                    : getMaskEffectiveModel(session.mask)
                }</span>
                ${
                  isMultiModelChat
                    ? `<span class="chip">模型列表：${usedModelsArray.join(
                        ", ",
                      )}</span>`
                    : ""
                }
                <span class="chip">消息数：${actualMessageCount}</span>
                <span class="chip">主题：${session.topic}</span>
                <span class="chip">时间：${headerTime}</span>
              </div>
            </div>
            
            <div class="messages">
              ${messageGroups
                .map((group) => {
                  if (group.type === "multi-assistant") {
                    // 多模型横向布局
                    return `
                      <div class="multi-model-container">
                        ${group.messages
                          .map((msg) => {
                            const content = getMsgContent(msg);
                            const [modelName, providerId] = (
                              msg.modelKey || ""
                            ).split("@");
                            const images = getMessageImages(msg);
                            const imagesHtml =
                              images.length > 0
                                ? `<div class="images">${images
                                    .map(
                                      (src, idx) =>
                                        `<div style="break-inside: avoid;">
                                          <img class="image" src="${src}" alt="image-${
                                            idx + 1
                                          }" />
                                        </div>`,
                                    )
                                    .join("")}</div>`
                                : "";

                            return `
                              <div class="multi-model-column">
                                <div class="multi-model-header">
                                  <div class="avatar">${assistantAvatar}</div>
                                  <div>
                                    <div class="multi-model-name">${
                                      modelName || msg.model || "助手"
                                    }</div>
                                    ${
                                      providerId
                                        ? `<div class="multi-model-provider">@${providerId}</div>`
                                        : ""
                                    }
                                  </div>
                                </div>
                                <div class="multi-model-content">
                                  ${content}
                                </div>
                                ${imagesHtml}
                              </div>
                            `;
                          })
                          .join("")}
                      </div>
                    `;
                  } else {
                    // 单条消息正常显示
                    const msg = group.messages[0];
                    const content = getMsgContent(msg);
                    const isUser = msg.role === "user";
                    const avatar = isUser ? userAvatar : assistantAvatar;
                    const time = safeDate(msg.date);
                    const modelLabel =
                      msg.model ||
                      (!isUser ? getMaskEffectiveModel(session.mask) : "");
                    const images = getMessageImages(msg);
                    const imagesHtml =
                      images.length > 0
                        ? `<div class="images">${images
                            .map(
                              (src, idx) =>
                                `<div style="break-inside: avoid;">
                                  <img class="image" src="${src}" alt="image-${
                                    idx + 1
                                  }" />
                                </div>`,
                            )
                            .join("")}</div>`
                        : "";

                    return `
                      <div class="message ${isUser ? "user" : "assistant"}">
                        <div class="avatar">${avatar}</div>
                        <div class="bubble">
                          <div class="msg-head">
                            <span class="role">${
                              isUser ? "用户" : "助手"
                            }</span>
                            <span>${time}</span>
                            ${
                              modelLabel
                                ? `<span style="color:#6b7280;">${modelLabel}</span>`
                                : ""
                            }
                          </div>
                          <div>${content}</div>
                          ${imagesHtml}
                        </div>
                      </div>
                    `;
                  }
                })
                .join("")}
            </div>
            
            <div class="footer">
              <span>📊 总:${actualMessageCount}</span>
              <span>用户:${msgs.filter((m) => m.role === "user").length}</span>
              <span>助手:${
                msgs.filter((m) => m.role === "assistant").length
              }</span>
              <span>｜ 由 LLMChat 生成</span>
              <span>© ${new Date().getFullYear()}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    // 写入内容并触发打印
    // 安全断言：经过上面逻辑，此时 printWindow 一定存在
    const pw = printWindow as Window;
    pw.document.write(printContent);
    pw.document.close();

    // Tauri 场景下等 iframe 渲染完成再打印
    const doPrint = () => {
      try {
        pw.focus();
        pw.print();
      } catch (err) {
        console.error("Print failed", err);
        showToast("打印失败，请检查系统打印设置");
      } finally {
        cleanup?.();
        setLoading(false);
      }
    };

    if (isTauri) {
      // 延迟以等待 iframe DOM 渲染
      setTimeout(doPrint, 300);
    } else {
      setTimeout(() => {
        doPrint();
        setTimeout(() => {
          printWindow?.close();
        }, 2000);
      }, 500);
    }
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

  // 多模型消息分组逻辑
  const groupMessages = () => {
    const groups: Array<{
      type: "single" | "multi-assistant";
      messages: typeof props.messages;
    }> = [];

    let i = 0;
    while (i < props.messages.length) {
      const message = props.messages[i];

      // 检查是否是用户消息，且后面跟着多个多模型assistant消息
      if (message.role === "user") {
        // 查找该用户消息后的所有连续的多模型assistant消息
        const assistantMessages: typeof props.messages = [];
        let j = i + 1;
        while (
          j < props.messages.length &&
          props.messages[j].role === "assistant" &&
          props.messages[j].isMultiModel
        ) {
          assistantMessages.push(props.messages[j]);
          j++;
        }

        // 先添加用户消息
        groups.push({
          type: "single",
          messages: [message],
        });

        // 如果有多个assistant消息，横向分组
        if (assistantMessages.length > 1) {
          groups.push({
            type: "multi-assistant",
            messages: assistantMessages,
          });
          i = j;
        } else if (assistantMessages.length === 1) {
          // 只有一个assistant消息，正常显示
          groups.push({
            type: "single",
            messages: assistantMessages,
          });
          i = j;
        } else {
          i++;
        }
      } else {
        // 非用户消息，正常显示
        groups.push({
          type: "single",
          messages: [message],
        });
        i++;
      }
    }

    return groups;
  };

  const messageGroups = groupMessages();

  // 收集所有使用的模型
  const usedModels = useMemo(() => {
    const models = new Set<string>();
    props.messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.isMultiModel && msg.modelKey) {
        const [modelName] = msg.modelKey.split("@");
        if (modelName) models.add(modelName);
      }
    });
    return Array.from(models);
  }, [props.messages]);

  // 判断是否是多模型场景
  const isMultiModelChat = usedModels.length > 1;

  // 计算实际的消息数（多模型的assistant消息算作一组）
  const actualMessageCount = useMemo(() => {
    let count = 0;
    messageGroups.forEach((group) => {
      if (group.type === "multi-assistant") {
        count += 1; // 多个模型回复算作一条
      } else {
        count += group.messages.length;
      }
    });
    return count;
  }, [messageGroups]);

  const copy = () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;
    toBlob(dom, {
      skipFonts: true,
      style: {},
      filter: (node) => {
        if (node instanceof HTMLLinkElement) return false;
        return true;
      },
    }).then((blob) => {
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
      const blob = await toPng(dom, {
        // 避免跨域样式（如谷歌字体）读取 cssRules 报 SecurityError
        skipFonts: true,
        // 不内联外部样式，防止 CSP/跨域限制
        style: {},
        filter: (node) => {
          // 过滤掉 link/style 的跨域规则
          if (node instanceof HTMLLinkElement) return false;
          return true;
        },
      });
      if (!blob) return;

      if (isMobile || (isApp && window.__TAURI__)) {
        if (isApp && window.__TAURI__) {
          const { save } = await import("@tauri-apps/plugin-dialog");
          const fs = await import("@tauri-apps/plugin-fs");

          const result = await save({
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
            await fs.writeFile(result, uint8Array);
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
          <div className={styles["chat-info-header"]}>
            <div className={styles["chat-info-brand"]}>
              <ChatGptIcon width={24} height={24} />
              <span className={styles["chat-info-title"]}>LLMChat</span>
            </div>
          </div>
          <div className={styles["chat-info-compact"]}>
            <div className={styles["chat-info-badge"]}>
              <span className={styles["chat-info-icon"]}>🤖</span>
              <span className={styles["chat-info-value"]}>
                {isMultiModelChat
                  ? `${usedModels.length}个模型`
                  : getMaskEffectiveModel(mask)}
              </span>
            </div>
            {isMultiModelChat && (
              <div
                className={styles["chat-info-badge"]}
                title={usedModels.join(", ")}
              >
                <span className={styles["chat-info-icon"]}>📋</span>
                <span className={styles["chat-info-value"]}>
                  {usedModels.length > 2
                    ? `${usedModels.slice(0, 2).join(", ")}...`
                    : usedModels.join(", ")}
                </span>
              </div>
            )}
            <div className={styles["chat-info-badge"]}>
              <span className={styles["chat-info-icon"]}>💬</span>
              <span className={styles["chat-info-value"]}>
                {actualMessageCount}
              </span>
            </div>
            <div className={styles["chat-info-badge"]} title={session.topic}>
              <span className={styles["chat-info-icon"]}>📝</span>
              <span className={styles["chat-info-value"]}>
                {session.topic.length > 15
                  ? session.topic.substring(0, 15) + "..."
                  : session.topic}
              </span>
            </div>
            <div
              className={styles["chat-info-badge"]}
              style={{ whiteSpace: "nowrap" }}
            >
              <span className={styles["chat-info-icon"]}>🕐</span>
              <span className={styles["chat-info-value"]}>
                {new Date(
                  props.messages.at(-1)?.date ?? Date.now(),
                ).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        {messageGroups.map((group, groupIndex) => {
          if (group.type === "multi-assistant") {
            // 多模型横向布局
            return (
              <div
                className={styles["multi-model-messages-preview"]}
                key={`group-${groupIndex}`}
              >
                {group.messages.map((m, i) => {
                  const [modelName, providerId] = (m.modelKey || "").split("@");
                  return (
                    <div
                      className={styles["multi-model-column-preview"]}
                      key={i}
                    >
                      <div className={styles["multi-model-header-preview"]}>
                        <div className={styles["avatar"]}>
                          <MaskAvatar
                            avatar={session.mask.avatar}
                            model={
                              m.model ||
                              modelName ||
                              (getMaskEffectiveModel(session.mask) as any)
                            }
                          />
                        </div>
                        <div className={styles["multi-model-info"]}>
                          <div className={styles["multi-model-name-preview"]}>
                            {modelName || m.model || "助手"}
                          </div>
                          {providerId && (
                            <div
                              className={styles["multi-model-provider-preview"]}
                            >
                              @{providerId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles["body"]}>
                        <Markdown
                          content={getMessageTextContentWithoutThinking(m)}
                          fontSize={config.fontSize}
                          fontFamily={config.fontFamily}
                          defaultShow
                          isUserMessage={false}
                        />
                        {getMessageImages(m).length == 1 && (
                          <div className={styles["message-image-container"]}>
                            <Image
                              src={getMessageImages(m)[0]}
                              alt="message"
                              className={styles["message-image"]}
                              width={1024}
                              height={768}
                              sizes="100vw"
                              style={{ width: "100%", height: "auto" }}
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
                            {getMessageImages(m).map((src, imgIndex) => (
                              <div
                                key={imgIndex}
                                className={
                                  styles["message-image-multi-container"]
                                }
                              >
                                <Image
                                  src={src}
                                  alt="message"
                                  className={styles["message-image-multi"]}
                                  width={640}
                                  height={640}
                                  sizes="33vw"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
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
            );
          } else {
            // 单个消息正常显示
            const m = group.messages[0];
            const i = groupIndex;
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
                    isUserMessage={m.role === "user"}
                  />
                  {getMessageImages(m).length == 1 && (
                    <div className={styles["message-image-container"]}>
                      <Image
                        key={i}
                        src={getMessageImages(m)[0]}
                        alt="message"
                        className={styles["message-image"]}
                        width={1024}
                        height={768}
                        sizes="100vw"
                        style={{ width: "100%", height: "auto" }}
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
                      {getMessageImages(m).map((src, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={styles["message-image-multi-container"]}
                        >
                          <Image
                            src={src}
                            alt="message"
                            className={styles["message-image-multi"]}
                            width={640}
                            height={640}
                            sizes="33vw"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
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
