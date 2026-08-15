import React, { useMemo, useState } from "react";
import clsx from "clsx";
import type { ChatMessage, ChatSession } from "../../store";
import { useChatStore } from "../../store";
import {
  getModelContextTokens,
  formatTokenCount,
} from "../../config/model-config";
import { estimateTokenLength } from "../../utils/token";
import { getMessageTextContentWithoutThinking } from "../../utils";
import { getActiveContextStartIndex } from "../../core/compaction";
import Locale from "../../locales";
import { showConfirm } from "../ui-lib";
import styles from "../chat.module.scss";

// getComputedStyle 读取成本较高，缓存 CSS 变量（主题切换后最长 60s 内更新）
let cachedPrimaryColor: string | null = null;
let cachedPrimaryAt = 0;
function getPrimaryColor() {
  const now = Date.now();
  if (cachedPrimaryColor === null || now - cachedPrimaryAt > 60_000) {
    cachedPrimaryAt = now;
    cachedPrimaryColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#3b82f6";
  }
  return cachedPrimaryColor;
}

export function TokenCounter(props: {
  session: ChatSession;
  currentModel: string;
  userInput?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const resetSession = useChatStore((s) => s.resetSession);

  const multiModelMode = props.session.multiModelMode;
  const isMultiModel =
    multiModelMode?.enabled && (multiModelMode.selectedModels.length ?? 0) > 1;

  // 流式期间冻结统计：token 数只在会话结构变化（新增/压缩消息）或流结束时重算，
  // 避免每个 token flush 都全量扫描历史消息。
  const isStreaming = props.session.messages.some((m) => m.streaming);
  const multiModelEnabled = multiModelMode?.enabled ?? false;
  const multiModelCount = multiModelMode?.selectedModels.length ?? 0;
  const stats = useMemo(
    () => {
      const session = props.session;
      const effectiveStartIndex = getActiveContextStartIndex(session);

      const messages = session.messages;

      // 统计压缩消息之后的新消息（排除压缩消息本身和错误消息）
      const uncompressedTokens = messages
        .slice(effectiveStartIndex)
        .reduce((total: number, message: ChatMessage) => {
          if (message.isError || message.isCompressedContextPrompt)
            return total;
          return (
            total +
            estimateTokenLength(
              getMessageTextContentWithoutThinking(message),
            )
          );
        }, 0);

      // 加上摘要（memoryPrompt）的 token，代表被压缩历史的摘要成本
      const memoryTokens = session.memoryPrompt
        ? estimateTokenLength(session.memoryPrompt)
        : 0;
      const usedTokens = uncompressedTokens + memoryTokens;

      const contextConfig = getModelContextTokens(props.currentModel);
      const maxTokens = contextConfig?.contextTokens;

      // 有效消息：压缩消息之后的非错误、非压缩消息（与摘要逻辑保持一致）
      const currentContextCount = messages
        .slice(effectiveStartIndex)
        .filter((m) => !m.isError && !m.isCompressedContextPrompt).length;
      const maxContextCount = session.mask.modelConfig.historyMessageCount;

      const multiModelStats = isMultiModel
        ? multiModelMode.selectedModels.map((modelKey) => {
            const [modelName] = modelKey.split("@");
            const modelMessages = multiModelMode.modelMessages[modelKey] || [];

            const messagesToCount =
              effectiveStartIndex > 0
                ? modelMessages.filter((msg) => {
                    const originalIndex = messages.findIndex(
                      (m) => m.id === msg.id,
                    );
                    return originalIndex >= effectiveStartIndex;
                  })
                : modelMessages;

            const modelUsedTokens = messagesToCount.reduce(
              (total: number, message: ChatMessage) => {
                if (message.isError) return total;
                return (
                  total +
                  estimateTokenLength(
                    getMessageTextContentWithoutThinking(message),
                  )
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

      return {
        effectiveStartIndex,
        usedTokens,
        maxTokens,
        currentContextCount,
        maxContextCount,
        multiModelStats,
      };
    },
    // 流式期间 session.messages 数组每 flush 都新建，不能依赖对象身份；
    // 以"结构变化 + 是否仍在流式"作为重算条件：流式期间冻结，结束后重算一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.session.id,
      props.session.messages.length,
      props.session.memoryPrompt,
      props.session.mask.modelConfig.historyMessageCount,
      props.currentModel,
      isStreaming,
      multiModelEnabled,
      multiModelCount,
    ],
  );

  const {
    usedTokens,
    maxTokens,
    currentContextCount,
    maxContextCount,
    multiModelStats,
  } = stats;

  const inputTokens = props.userInput
    ? estimateTokenLength(props.userInput)
    : 0;
  const estimatedTokens = usedTokens + inputTokens;

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
    return getPrimaryColor();
  };

  const handleResetChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (await showConfirm(Locale.Chat.InputActions.ResetConfirm)) {
      resetSession(props.session);
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
