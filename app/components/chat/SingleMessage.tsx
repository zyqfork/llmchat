import React, { Fragment, useEffect, useState } from "react";
import Image from "next/image";

import EditIcon from "../../icons/rename.svg";
import CopyIcon from "../../icons/copy.svg";
import SpeakIcon from "../../icons/speak.svg";
import SpeakStopIcon from "../../icons/speak-stop.svg";
import ResetIcon from "../../icons/reload.svg";
import LeftIcon from "../../icons/left.svg";
import RightIcon from "../../icons/right.svg";
import DeleteIcon from "../../icons/clear.svg";
import PinIcon from "../../icons/pin.svg";
import DebugIcon from "../../icons/debug.svg";
import StopIcon from "../../icons/pause.svg";
import Locale from "../../locales";
import { ChatMessage, ChatSession } from "../../store";
import {
  copyToClipboard,
  getMessageImages,
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  isThinkingModel,
  wrapThinkingPart,
} from "../../utils";
import { ChatControllerPool } from "../../client/controller";

import styles from "../chat.module.scss";
import { IconButton } from "../button";
import { Avatar } from "../emoji";
import { MaskAvatar } from "../mask";
import { ProviderTooltip, getProviderDisplayName } from "./ProviderTooltip";
import { ChatAction } from "./ChatAction";
import { LLMMessageContent } from "./LLMMessageContent";
import { ClearContextDivider } from "./ClearContextDivider";
import { CompressedContextDivider } from "./CompressedContextDivider";

type ChatMessageWithPreview = ChatMessage & { preview?: boolean };

type SingleMessageProps = {
  message: ChatMessageWithPreview;
  index: number;
  isContext: boolean;
  showActions: boolean;
  showTyping: boolean;
  shouldShowClearContextDivider: boolean;
  shouldShowCompressedContextDivider: boolean;
  shouldShowCompressingContextDivider: boolean;
  session: ChatSession;
  accessStore: any;
  config: any;
  fontSize: number;
  fontFamily: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  totalMessages: number;
  speechStatus: any;
  onEditMessage: (message: ChatMessageWithPreview) => Promise<void>;
  onUserStop: (id: string) => void;
  onResend: (message: ChatMessage) => void;
  onPreviousVersion: (message: ChatMessage) => void;
  onNextVersion: (message: ChatMessage) => void;
  onDelete: (id: string) => void;
  onPinMessage: (message: ChatMessage) => void;
  onDebugMessage: (message: ChatMessage) => void;
  onSpeech: (text: string) => void;
  onShowImageModal: (src: string) => void;
};

export function SingleMessage(props: SingleMessageProps) {
  const {
    message,
    index,
    isContext,
    showActions,
    showTyping,
    shouldShowClearContextDivider,
    shouldShowCompressedContextDivider,
    shouldShowCompressingContextDivider,
    session,
    accessStore,
    config,
    fontSize,
    fontFamily,
    scrollRef,
    totalMessages,
    speechStatus,
    onEditMessage,
    onUserStop,
    onResend,
    onPreviousVersion,
    onNextVersion,
    onDelete,
    onPinMessage,
    onDebugMessage,
    onSpeech,
    onShowImageModal,
  } = props;

  const isUser = message.role === "user";
  const isCompressedContextMessage = !!message.isCompressedContextPrompt;
  const showAvatarTyping =
    !message?.tools?.length &&
    !(message as any)?.mcpCalls?.length &&
    showTyping;
  const [isCompressedExpanded, setIsCompressedExpanded] = useState(false);

  useEffect(() => {
    if (isCompressedContextMessage) {
      setIsCompressedExpanded(false);
    }
  }, [isCompressedContextMessage, message.id]);

  return (
    <Fragment key={message.id}>
      <div
        className={
          isUser ? styles["chat-message-user"] : styles["chat-message"]
        }
      >
        <div className={styles["chat-message-container"]}>
          <div className={styles["chat-message-header"]}>
            <div
              className={[
                styles["chat-message-avatar"],
                showAvatarTyping ? styles["chat-message-avatar-typing"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={showAvatarTyping ? Locale.Chat.Typing : undefined}
            >
              <div className={styles["chat-message-edit"]}>
                <IconButton
                  icon={<EditIcon />}
                  aria={Locale.Chat.Actions.Edit}
                  onClick={async () => onEditMessage(message)}
                ></IconButton>
              </div>
              {isContext ? (
                <Avatar
                  avatar={
                    message.role === "system"
                      ? config.systemAvatar
                      : message.role === "assistant"
                      ? config.assistantAvatar
                      : config.avatar
                  }
                />
              ) : isUser ? (
                <Avatar avatar={config.avatar} />
              ) : (
                <>
                  {["system"].includes(message.role) ? (
                    <Avatar avatar={config.systemAvatar} />
                  ) : (
                    <MaskAvatar
                      avatar={session.mask.avatar}
                      model={message.model || session.mask.modelConfig.model}
                      provider={
                        session.mask.modelConfig.providerName || "OpenAI"
                      }
                    />
                  )}
                </>
              )}
            </div>
            {(!isUser || (isContext && message.role !== "user")) && (
              <div className={styles["chat-model-name"]}>
                {isContext ? (
                  <span className={styles["chat-context-role-name"]}>
                    {message.role}
                  </span>
                ) : message.isMultiModel && message.modelKey ? (
                  <>
                    {message.model || session.mask.modelConfig.model}
                    <ProviderTooltip
                      providerName={message.modelKey.split("@")[1]}
                    >
                      <span className={styles["chat-model-provider"]}>
                        @
                        {getProviderDisplayName(
                          message.modelKey.split("@")[1],
                          accessStore,
                        )}
                      </span>
                    </ProviderTooltip>
                  </>
                ) : (
                  <>
                    {message.model || session.mask.modelConfig.model}
                    <ProviderTooltip
                      providerName={
                        session.mask.modelConfig.providerName || "OpenAI"
                      }
                    >
                      <span className={styles["chat-model-provider"]}>
                        @
                        {getProviderDisplayName(
                          session.mask.modelConfig.providerName || "OpenAI",
                          accessStore,
                        )}
                      </span>
                    </ProviderTooltip>
                  </>
                )}
              </div>
            )}
            {showActions && (
              <div className={styles["chat-message-actions"]}>
                <div className={styles["chat-input-actions"]}>
                  {(() => {
                    const shouldShowStop =
                      message.streaming &&
                      (message.role === "assistant" ||
                        message.role === "user") &&
                      ChatControllerPool.hasPendingInSession(session.id);

                    if (shouldShowStop) {
                      return (
                        <ChatAction
                          text={Locale.Chat.Actions.Stop}
                          icon={<StopIcon />}
                          onClick={() =>
                            onUserStop(message.id ?? String(index))
                          }
                        />
                      );
                    }

                    return (
                      <>
                        <ChatAction
                          text={Locale.Chat.Actions.Retry}
                          icon={<ResetIcon />}
                          onClick={() => onResend(message)}
                        />
                        {message.role === "assistant" &&
                          message.versions &&
                          message.versions.length >= 1 && (
                            <>
                              {(message.currentVersionIndex ?? 0) > 0 && (
                                <ChatAction
                                  text={Locale.Chat.Actions.PreviousVersion}
                                  icon={<LeftIcon />}
                                  onClick={() => onPreviousVersion(message)}
                                />
                              )}
                              {(message.currentVersionIndex ?? 0) <
                                (message.versions?.length ?? 0) && (
                                <ChatAction
                                  text={Locale.Chat.Actions.NextVersion}
                                  icon={<RightIcon />}
                                  onClick={() => onNextVersion(message)}
                                />
                              )}
                            </>
                          )}
                        <ChatAction
                          text={Locale.Chat.Actions.Delete}
                          icon={<DeleteIcon />}
                          onClick={() => onDelete(message.id ?? String(index))}
                        />
                        <ChatAction
                          text={Locale.Chat.Actions.Pin}
                          icon={<PinIcon />}
                          onClick={() => onPinMessage(message)}
                        />
                        <ChatAction
                          text={Locale.Chat.Actions.Copy}
                          icon={<CopyIcon />}
                          onClick={() =>
                            copyToClipboard(
                              getMessageTextContentWithoutThinking(message),
                            )
                          }
                        />
                        {message.role === "assistant" && (
                          <ChatAction
                            text={Locale.Chat.Actions.Debug}
                            icon={<DebugIcon />}
                            onClick={() => onDebugMessage(message)}
                          />
                        )}
                        {config.ttsConfig.enable && (
                          <ChatAction
                            text={
                              speechStatus
                                ? Locale.Chat.Actions.StopSpeech
                                : Locale.Chat.Actions.Speech
                            }
                            icon={
                              speechStatus ? <SpeakStopIcon /> : <SpeakIcon />
                            }
                            onClick={() =>
                              onSpeech(getMessageTextContent(message))
                            }
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {(() => {
            const mcpCalls: any[] = (message as any).mcpCalls || [];
            const functionTools: any[] = message?.tools || [];
            const unified = [
              ...functionTools.map((tool, idx) => {
                const fullName = tool?.function?.name || "";
                let toolName = fullName;
                let clientName = "";
                if (fullName.includes("__")) {
                  const parts = fullName.split("__");
                  if (parts.length >= 2) {
                    clientName = parts[0];
                    toolName = parts.slice(1).join("__");
                  }
                } else if (fullName.includes("_")) {
                  const firstUnderscoreIndex = fullName.indexOf("_");
                  clientName = fullName.substring(0, firstUnderscoreIndex);
                  toolName = fullName.substring(firstUnderscoreIndex + 1);
                } else if (fullName.includes("-")) {
                  const firstDashIndex = fullName.indexOf("-");
                  clientName = fullName.substring(0, firstDashIndex);
                  toolName = fullName.substring(firstDashIndex + 1);
                }
                return {
                  id: tool.id || `func:${idx}`,
                  source: "function",
                  toolName,
                  clientName,
                  raw: tool,
                };
              }),
              ...mcpCalls.map((call, idx) => ({
                id: `mcp:${idx}`,
                source: "mcp",
                toolName: call.toolName,
                clientName: call.clientId,
                raw: call,
              })),
            ];
            if (unified.length === 0) return null;

            return (
              <div className={styles["mcp-tool-calls"]}>
                {unified.map((item) => {
                  if (item.source === "function") {
                    const t = item.raw;
                    let parsedArgs: any = t?.function?.arguments;
                    try {
                      parsedArgs = parsedArgs ? JSON.parse(parsedArgs) : {};
                    } catch {}
                    return (
                      <details
                        key={item.id}
                        className={styles["mcp-tool-call"]}
                      >
                        <summary>
                          <span className={styles["mcp-tool-call-title"]}>
                            {item.clientName}
                            {item.toolName ? ` / ${item.toolName}` : ""}
                          </span>
                          <span className={styles["mcp-tool-call-desc"]}>
                            {item.source === "function" ? "Function" : "MCP"}
                          </span>
                        </summary>
                        <div className={styles["mcp-tool-call-body"]}>
                          <div className={styles["mcp-tool-call-line"]}>
                            <span className={styles["mcp-tool-call-key"]}>
                              args
                            </span>
                            <pre className={styles["mcp-tool-call-value"]}>
                              {JSON.stringify(parsedArgs, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    );
                  }

                  const c = item.raw;
                  return (
                    <details key={item.id} className={styles["mcp-tool-call"]}>
                      <summary>
                        <span className={styles["mcp-tool-call-title"]}>
                          {item.clientName}
                          {item.toolName ? ` / ${item.toolName}` : ""}
                        </span>
                        <span className={styles["mcp-tool-call-desc"]}>
                          MCP
                        </span>
                      </summary>
                      <div className={styles["mcp-tool-call-body"]}>
                        <div className={styles["mcp-tool-call-line"]}>
                          <span className={styles["mcp-tool-call-key"]}>
                            args
                          </span>
                          <pre className={styles["mcp-tool-call-value"]}>
                            {JSON.stringify(c.args, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            );
          })()}

          <div
            className={[
              styles["chat-message-item"],
              isCompressedContextMessage
                ? styles["chat-message-item-compressed"]
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isCompressedContextMessage && !message.streaming ? (
              <div className={styles["compressed-context-message-wrap"]}>
                <button
                  className={[
                    styles["compressed-context-toggle"],
                    isCompressedExpanded
                      ? styles["compressed-context-toggle-expanded"]
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  aria-expanded={isCompressedExpanded}
                  aria-label={
                    isCompressedExpanded
                      ? Locale.Context.Collapse
                      : Locale.Context.Expand
                  }
                  onClick={() => setIsCompressedExpanded((v) => !v)}
                >
                  <span className={styles["compressed-context-marker"]}>
                    {Locale.Context.CompressedTag}
                  </span>
                  <span className={styles["compressed-context-title"]}>
                    {Locale.Context.Compressed}
                  </span>
                  <span className={styles["compressed-context-action"]}>
                    {isCompressedExpanded
                      ? Locale.Context.Collapse
                      : Locale.Context.Expand}
                  </span>
                  <span
                    className={[
                      styles["compressed-context-toggle-arrow"],
                      isCompressedExpanded
                        ? styles["compressed-context-toggle-arrow-expanded"]
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
                {isCompressedExpanded && (
                  <LLMMessageContent
                    key={message.streaming ? "loading" : "done"}
                    content={(() => {
                      const messageContent =
                        typeof message.content === "string"
                          ? message.content
                          : getMessageTextContent(message);
                      const isThinking = isThinkingModel(message.model);
                      const shouldWrap = !message.streaming && isThinking;
                      if (shouldWrap) {
                        return wrapThinkingPart(messageContent);
                      }
                      return messageContent;
                    })()}
                    isStreamFinished={!message.streaming && !message.preview}
                    loading={
                      (message.preview || message.streaming) &&
                      (!message.content ||
                        (typeof message.content === "string" &&
                          message.content.length === 0))
                    }
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    parentRef={scrollRef}
                    defaultShow={index >= totalMessages - 6}
                  />
                )}
              </div>
            ) : (
              <LLMMessageContent
                key={message.streaming ? "loading" : "done"}
                content={(() => {
                  const messageContent =
                    typeof message.content === "string"
                      ? message.content
                      : getMessageTextContent(message);
                  const isThinking = isThinkingModel(message.model);
                  const shouldWrap = !message.streaming && isThinking;
                  if (shouldWrap) {
                    return wrapThinkingPart(messageContent);
                  }
                  return messageContent;
                })()}
                isStreamFinished={!message.streaming && !message.preview}
                loading={
                  (message.preview || message.streaming) &&
                  (!message.content ||
                    (typeof message.content === "string" &&
                      message.content.length === 0))
                }
                fontSize={fontSize}
                fontFamily={fontFamily}
                parentRef={scrollRef}
                defaultShow={index >= totalMessages - 6}
              />
            )}
            {getMessageImages(message).length === 1 && (
              <div
                className={styles["chat-message-item-image-container"]}
                style={{ cursor: "pointer" }}
                onClick={() => onShowImageModal(getMessageImages(message)[0])}
              >
                <Image
                  className={styles["chat-message-item-image"]}
                  src={getMessageImages(message)[0]}
                  alt=""
                  fill={false}
                  width={256}
                  height={256}
                />
              </div>
            )}
            {getMessageImages(message).length > 1 && (
              <div
                className={styles["chat-message-item-images"]}
                style={{
                  gridTemplateColumns: `repeat(${Math.min(
                    getMessageImages(message).length,
                    3,
                  )}, 1fr)`,
                }}
              >
                {getMessageImages(message).map((image, i) => (
                  <div
                    key={i}
                    className={
                      styles["chat-message-item-image-multi-container"]
                    }
                    style={{ cursor: "pointer" }}
                    onClick={() => onShowImageModal(image)}
                  >
                    <Image
                      className={styles["chat-message-item-image-multi"]}
                      src={image}
                      alt=""
                      fill={false}
                      width={128}
                      height={128}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {message?.audio_url && (
            <div className={styles["chat-message-audio"]}>
              <audio src={message.audio_url} controls />
            </div>
          )}

          <div className={styles["chat-message-action-date"]}>
            {message.role === "assistant" &&
              message.versions &&
              message.versions.length >= 1 && (
                <span className={styles["chat-message-version"]}>
                  {(message.currentVersionIndex ?? 0) + 1}/
                  {(message.versions?.length ?? 0) + 1}
                </span>
              )}
            {message.role === "assistant" &&
              message.statistic?.completionTokens &&
              message.statistic?.totalReplyLatency && (
                <span className={styles["chat-message-tps"]}>
                  {(
                    (message.statistic.completionTokens /
                      message.statistic.totalReplyLatency) *
                    1000
                  ).toFixed(1)}{" "}
                  t/s
                </span>
              )}
            {message.date.toLocaleString()}
          </div>
        </div>
      </div>
      {shouldShowClearContextDivider && <ClearContextDivider />}
      {(shouldShowCompressedContextDivider ||
        shouldShowCompressingContextDivider) && (
        <CompressedContextDivider
          loading={shouldShowCompressingContextDivider}
        />
      )}
    </Fragment>
  );
}
