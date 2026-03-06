import React from "react";

import CopyIcon from "../../icons/copy.svg";
import ResetIcon from "../../icons/reload.svg";
import StopIcon from "../../icons/pause.svg";

import { ChatMessage, ChatSession } from "../../store";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  isThinkingModel,
  wrapThinkingPart,
  copyToClipboard,
} from "../../utils";
import { ChatControllerPool } from "../../client/controller";
import Locale from "../../locales";

import styles from "../chat.module.scss";
import { ProviderTooltip, getProviderDisplayName } from "./ProviderTooltip";
import { ChatAction } from "./ChatAction";
import { LLMMessageContent } from "./LLMMessageContent";
import { MaskAvatar } from "../mask";

type ChatMessageWithPreview = ChatMessage & { preview?: boolean };

type GroupedMessages = {
  type: "single" | "multi-assistant";
  index: number;
  messages: ChatMessageWithPreview[];
};

type MultiModelMessagesProps = {
  groupedMessages: GroupedMessages[];
  session: ChatSession;
  accessStore: any;
  fontSize: number;
  fontFamily: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  onUserStop: (messageId: string) => void;
  onResend: (message: ChatMessage) => void;
  renderSingleMessage: (
    message: ChatMessageWithPreview,
    i: number,
    dividerFlags?: {
      showCompressedDividerAfter: boolean;
      showCompressingDividerAfter: boolean;
    },
  ) => React.ReactNode;
  renderMessages: ChatMessageWithPreview[];
};

export function MultiModelMessages(props: MultiModelMessagesProps) {
  const {
    groupedMessages,
    session,
    accessStore,
    fontSize,
    fontFamily,
    scrollRef,
    onUserStop,
    onResend,
    renderSingleMessage,
    renderMessages,
  } = props;

  return (
    <>
      {groupedMessages.map((group, groupIndex) => {
        if (group.type === "multi-assistant") {
          return (
            <div
              key={`group-${groupIndex}`}
              className={styles["multi-model-messages"]}
            >
              {group.messages.map((message) => {
                const [modelName, providerId] = (message.modelKey || "").split(
                  "@",
                );
                const displayModelName =
                  modelName || message.model || session.mask.modelConfig.model;
                const displayProviderId =
                  providerId ||
                  session.mask.modelConfig.providerName ||
                  "OpenAI";

                const providerDisplayName = getProviderDisplayName(
                  displayProviderId,
                  accessStore,
                );

                const showActions = !(
                  message.preview || message.content.length === 0
                );
                const showTyping = message.preview || message.streaming;

                return (
                  <div
                    key={message.id}
                    className={styles["multi-model-message-column"]}
                  >
                    <div className={styles["chat-message-container"]}>
                      <div className={styles["chat-message-header"]}>
                        <div className={styles["chat-message-avatar"]}>
                          <MaskAvatar
                            avatar={session.mask.avatar}
                            model={message.model || displayModelName}
                            provider={displayProviderId}
                            modelKey={message.modelKey}
                          />
                        </div>

                        <div className={styles["chat-model-name"]}>
                          {displayModelName}
                          <ProviderTooltip providerName={displayProviderId}>
                            <span className={styles["chat-model-provider"]}>
                              @{providerDisplayName}
                            </span>
                          </ProviderTooltip>
                        </div>

                        {showActions && (
                          <div className={styles["chat-message-actions"]}>
                            <div className={styles["chat-input-actions"]}>
                              {(() => {
                                const shouldShowStop =
                                  message.streaming &&
                                  ChatControllerPool.hasPendingInSession(
                                    session.id,
                                  );

                                if (shouldShowStop) {
                                  return (
                                    <ChatAction
                                      text={Locale.Chat.Actions.Stop}
                                      icon={<StopIcon />}
                                      onClick={() => onUserStop(message.id)}
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
                                    <ChatAction
                                      text={Locale.Chat.Actions.Copy}
                                      icon={<CopyIcon />}
                                      onClick={() =>
                                        copyToClipboard(
                                          getMessageTextContentWithoutThinking(
                                            message,
                                          ),
                                        )
                                      }
                                    />
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {!message?.tools?.length &&
                        !(message as any)?.mcpCalls?.length &&
                        showTyping && (
                          <div className={styles["chat-message-status"]}>
                            {Locale.Chat.Typing}
                          </div>
                        )}

                      <div className={styles["chat-message-item"]}>
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
                          isStreamFinished={
                            !message.streaming && !message.preview
                          }
                          loading={
                            (message.preview || message.streaming) &&
                            (!message.content ||
                              (typeof message.content === "string" &&
                                message.content.length === 0))
                          }
                          fontSize={fontSize}
                          fontFamily={fontFamily}
                          parentRef={scrollRef}
                          defaultShow={true}
                        />
                      </div>

                      <div className={styles["chat-message-action-date"]}>
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
                );
              })}
            </div>
          );
        }

        const message = group.messages[0];
        const i = group.index;
        const nextMsg = renderMessages[i + 1];
        const showCompressedDividerAfter =
          !!nextMsg?.isCompressedContextPrompt && !nextMsg?.streaming;
        const showCompressingDividerAfter =
          !!nextMsg?.isCompressedContextPrompt &&
          !!nextMsg?.streaming &&
          !!session.isSummarizing;
        return renderSingleMessage(message, i, {
          showCompressedDividerAfter,
          showCompressingDividerAfter,
        });
      })}
    </>
  );
}
