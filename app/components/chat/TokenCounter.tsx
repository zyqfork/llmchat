import React, { useState } from "react";
import clsx from "clsx";
import type { ChatMessage, ChatSession } from "../../store";
import { useChatStore } from "../../store";
import {
  getModelContextTokens,
  formatTokenCount,
} from "../../config/model-config";
import { estimateTokenLength } from "../../utils/token";
import { getMessageTextContentWithoutThinking } from "../../utils";
import Locale from "../../locales";
import { showConfirm } from "../ui-lib";
import styles from "../chat.module.scss";

export function TokenCounter(props: {
  session: ChatSession;
  currentModel: string;
  userInput?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const chatStore = useChatStore();

  const calculateUsedTokens = () => {
    const messages = props.session.messages;
    const clearContextIndex = props.session.clearContextIndex;

    const messagesToCount =
      clearContextIndex !== undefined
        ? messages.slice(clearContextIndex)
        : messages;

    return messagesToCount.reduce((total: number, message: ChatMessage) => {
      if (message.isError) return total;
      return (
        total +
        estimateTokenLength(getMessageTextContentWithoutThinking(message))
      );
    }, 0);
  };

  const multiModelMode = props.session.multiModelMode;
  const isMultiModel =
    multiModelMode?.enabled && multiModelMode.selectedModels.length > 1;

  const modelConfig = props.session.mask.modelConfig;
  const usedTokens = calculateUsedTokens();
  const contextConfig = getModelContextTokens(props.currentModel);
  const maxTokens = contextConfig?.contextTokens;

  const clearContextIndex = props.session.clearContextIndex;
  const effectiveMessages =
    clearContextIndex !== undefined
      ? props.session.messages.slice(clearContextIndex)
      : props.session.messages;
  const currentContextCount = effectiveMessages.length;
  const maxContextCount = modelConfig.historyMessageCount;

  const inputTokens = props.userInput
    ? estimateTokenLength(props.userInput)
    : 0;
  const estimatedTokens = usedTokens + inputTokens;

  const multiModelStats = isMultiModel
    ? multiModelMode.selectedModels.map((modelKey) => {
        const [modelName] = modelKey.split("@");
        const modelMessages = multiModelMode.modelMessages[modelKey] || [];

        const messagesToCount =
          clearContextIndex !== undefined
            ? modelMessages.filter((msg) => {
                const originalIndex = props.session.messages.findIndex(
                  (m) => m.id === msg.id,
                );
                return originalIndex >= clearContextIndex;
              })
            : modelMessages;

        const modelUsedTokens = messagesToCount.reduce(
          (total: number, message: ChatMessage) => {
            if (message.isError) return total;
            return (
              total +
              estimateTokenLength(getMessageTextContentWithoutThinking(message))
            );
          },
          0,
        );
        const modelContextConfig = getModelContextTokens(modelName);
        const modelMaxTokens = modelContextConfig?.contextTokens;
        const modelProgressPercentage = modelMaxTokens
          ? (modelUsedTokens / modelMaxTokens) * 100
          : 0;

        return {
          modelKey,
          modelName,
          usedTokens: modelUsedTokens,
          maxTokens: modelMaxTokens,
          progressPercentage: modelProgressPercentage,
        };
      })
    : [];

  const displayText = isMultiModel
    ? `${multiModelStats.length} ${Locale.Chat.MultiModel.Models || "模型"}`
    : maxTokens
    ? `${formatTokenCount(usedTokens)}/${formatTokenCount(maxTokens)}`
    : `${formatTokenCount(usedTokens)}/?`;

  const tooltipLines = isMultiModel
    ? []
    : [
        `${Locale.Chat.TokenTooltip.Context}: ${currentContextCount} / ${maxContextCount}`,
        maxTokens
          ? `${
              Locale.Chat.TokenTooltip.CurrentToken
            }: ${usedTokens.toLocaleString()} / ${maxTokens.toLocaleString()}`
          : `${
              Locale.Chat.TokenTooltip.CurrentToken
            }: ${usedTokens.toLocaleString()} / ${
              Locale.Chat.TokenTooltip.Unknown
            }`,
        inputTokens > 0
          ? `${
              Locale.Chat.TokenTooltip.EstimatedToken
            }: ${estimatedTokens.toLocaleString()}`
          : null,
      ].filter(Boolean);

  const progressPercentage = maxTokens ? (usedTokens / maxTokens) * 100 : 0;
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 70) return "#f59e0b";
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#3b82f6"
    );
  };

  const handleResetChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (await showConfirm(Locale.Chat.InputActions.ResetConfirm)) {
      chatStore.resetSession(props.session);
    }
  };

  return (
    <div className={styles["chat-action-wrapper"]}>
      <button
        className={styles["token-counter-button"]}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleResetChat}
        type="button"
        title={Locale.Chat.InputActions.Reset}
      >
        <span className={styles["token-counter-text"]}>{displayText}</span>
        {!isMultiModel && maxTokens && (
          <div className={styles["token-counter-progress"]}>
            <div
              className={styles["token-counter-progress-fill"]}
              style={{
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: getProgressColor(progressPercentage),
              }}
            />
          </div>
        )}
      </button>
      {showTooltip && (
        <div
          className={clsx(styles["token-counter-tooltip"], {
            [styles["token-counter-tooltip-multi"]]: isMultiModel,
          })}
        >
          {isMultiModel ? (
            <div className={styles["multi-model-token-stats"]}>
              {multiModelStats.map((stat) => (
                <div key={stat.modelKey} className={styles["model-token-stat"]}>
                  <div className={styles["model-token-header"]}>
                    <span className={styles["model-token-name"]}>
                      {stat.modelName}
                    </span>
                  </div>
                  <div className={styles["model-token-info"]}>
                    {stat.maxTokens ? (
                      <>
                        <span>
                          {formatTokenCount(stat.usedTokens)} /{" "}
                          {formatTokenCount(stat.maxTokens)}
                        </span>
                        <span className={styles["model-token-percentage"]}>
                          {stat.progressPercentage.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <span>{formatTokenCount(stat.usedTokens)} / ?</span>
                    )}
                  </div>
                  {stat.maxTokens && (
                    <div className={styles["token-progress-bar"]}>
                      <div
                        className={styles["token-progress-fill"]}
                        style={{
                          width: `${Math.min(stat.progressPercentage, 100)}%`,
                          backgroundColor: getProgressColor(
                            stat.progressPercentage,
                          ),
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {tooltipLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
              {maxTokens && (
                <div className={styles["token-progress-container"]}>
                  <div className={styles["token-progress-info"]}>
                    <span>
                      {Locale.Chat.TokenUsage}: {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles["token-progress-bar"]}>
                    <div
                      className={styles["token-progress-fill"]}
                      style={{
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: getProgressColor(progressPercentage),
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
