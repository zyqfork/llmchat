/**
 * 聊天页头部：标题、副标题、窗口操作按钮、PromptToast
 */
import React from "react";
import clsx from "clsx";
import { IconButton } from "../button";
import ReturnIcon from "../../icons/return.svg";
import MenuIcon from "../../icons/menu.svg";
import RenameIcon from "../../icons/rename.svg";
import ReloadIcon from "../../icons/reload.svg";
import ExportIcon from "../../icons/share.svg";
import HistoryIcon from "../../icons/history.svg";
import MinIcon from "../../icons/min.svg";
import MaxIcon from "../../icons/max.svg";
import Locale from "../../locales";
import type { ChatSession } from "../../store";
import { useAccessStore } from "../../store/access";
import { DEFAULT_TOPIC } from "../../store";
import { copyToClipboard } from "../../utils";
import {
  isResponseApiEnabled,
  isResponseStatefulEnabled,
} from "../../utils/response-api";
import { showToast } from "../ui-lib";
import { PromptToast } from "./PromptToast";
import styles from "../chat.module.scss";

export interface ChatHeaderProps {
  session: ChatSession;
  messageCount: number;
  hitBottom: boolean;
  showPromptModal: boolean;
  setShowPromptModal: (v: boolean) => void;
  isMobileScreen: boolean;
  showMaxIcon: boolean;
  tightBorder?: boolean;
  onBack: () => void;
  onToggleSidebar: () => void;
  onEditTitle: () => void;
  onExport: () => void;
  onRefreshTitle: () => void;
  onCompressContext: () => void;
  onFullScreenToggle: () => void;
}

export function ChatHeader({
  session,
  messageCount,
  hitBottom,
  showPromptModal,
  setShowPromptModal,
  isMobileScreen,
  showMaxIcon,
  tightBorder,
  onBack,
  onToggleSidebar,
  onEditTitle,
  onExport,
  onRefreshTitle,
  onCompressContext,
  onFullScreenToggle,
}: ChatHeaderProps) {
  const showResponseApiConversationId = useAccessStore((access) => {
    const providerName = session.mask.modelConfig.providerName;
    return Boolean(
      session.responseApiConversationId &&
      isResponseApiEnabled(providerName, access) &&
      isResponseStatefulEnabled(providerName, access),
    );
  });
  const responseApiConversationId = showResponseApiConversationId
    ? session.responseApiConversationId
    : undefined;

  return (
    <div className="window-header" data-tauri-drag-region>
      {isMobileScreen && (
        <div className="window-actions">
          <div className={"window-action-button"}>
            <IconButton
              icon={<ReturnIcon />}
              bordered
              title={Locale.Chat.Actions.ChatList}
              onClick={onBack}
            />
          </div>
        </div>
      )}

      <div
        className={clsx("window-header-title", styles["chat-body-title"])}
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {!isMobileScreen && (
          <div className="window-action-button">
            <IconButton
              icon={<MenuIcon />}
              bordered
              title={Locale.Chat.UI.SidebarToggle}
              onClick={onToggleSidebar}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div
            className={clsx(
              "window-header-main-title",
              styles["chat-body-main-title"],
            )}
            onClickCapture={onEditTitle}
          >
            {!session.topic ? DEFAULT_TOPIC : session.topic}
          </div>
          <div className="window-header-sub-title">
            <span>{Locale.Chat.SubTitle(messageCount)}</span>
            <span className={styles["chat-assistant-name"]}>
              {session.mask.name}
            </span>
            {responseApiConversationId && (
              <span
                className={styles["response-api-conversation-id"]}
                title={`Response API 会话 ID: ${responseApiConversationId}`}
                onClick={() => {
                  copyToClipboard(responseApiConversationId);
                  showToast("会话 ID 已复制到剪贴板");
                }}
                style={{
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--primary)",
                  textDecoration: "underline",
                  marginLeft: "8px",
                }}
              >
                ID: {responseApiConversationId.slice(-8)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="window-actions">
        <div className="window-action-button">
          <IconButton
            icon={<HistoryIcon />}
            bordered
            title={Locale.Chat.Actions.CompressNow}
            onClick={onCompressContext}
          />
        </div>
        <div className="window-action-button">
          <IconButton
            icon={<ReloadIcon />}
            bordered
            title={Locale.Chat.Actions.RefreshTitle}
            onClick={onRefreshTitle}
          />
        </div>
        {!isMobileScreen && (
          <div className="window-action-button">
            <IconButton
              icon={<RenameIcon />}
              bordered
              title={Locale.Chat.EditMessage.Title}
              aria={Locale.Chat.EditMessage.Title}
              onClick={onEditTitle}
            />
          </div>
        )}
        <div className="window-action-button">
          <IconButton
            icon={<ExportIcon />}
            bordered
            title={Locale.Chat.Actions.Export}
            onClick={onExport}
          />
        </div>
        {showMaxIcon && (
          <div className="window-action-button">
            <IconButton
              icon={tightBorder ? <MinIcon /> : <MaxIcon />}
              bordered
              title={Locale.Chat.Actions.FullScreen}
              aria={Locale.Chat.Actions.FullScreen}
              onClick={onFullScreenToggle}
            />
          </div>
        )}
      </div>

      <PromptToast
        showToast={!hitBottom}
        showModal={showPromptModal}
        setShowModal={setShowPromptModal}
      />
    </div>
  );
}
