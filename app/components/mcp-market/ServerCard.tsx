/**
 * MCP 服务器卡片组件 - 优化版
 */
import React from "react";
import { IconButton } from "../button";
import AddIcon from "../../icons/add.svg";
import EditIcon from "../../icons/edit.svg";
import DeleteIcon from "../../icons/delete.svg";
import PlayIcon from "../../icons/play.svg";
import StopIcon from "../../icons/pause.svg";
import EyeIcon from "../../icons/eye.svg";
import GithubIcon from "../../icons/github.svg";
import styles from "../mcp-market.module.scss";
import clsx from "clsx";

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    repo?: string;
  };
  isAdded: boolean;
  status?: "active" | "paused" | "error" | "initializing";
  loadingMessage?: string;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onViewTools?: () => void;
}

export const ServerCard = React.memo(
  function ServerCard(props: ServerCardProps) {
    const {
      server,
      isAdded,
      status,
      loadingMessage,
      onAdd,
      onEdit,
      onDelete,
      onStart,
      onStop,
      onViewTools,
    } = props;

    return (
      <div
        className={clsx(styles["mcp-market-item"], {
          [styles["loading"]]: !!loadingMessage,
        })}
      >
        <div className={styles["mcp-market-header"]}>
          <div className={styles["mcp-market-title"]}>
            <div className={styles["mcp-market-name"]}>
              {server.name}
              {loadingMessage && (
                <span className={styles["operation-status"]}>
                  {loadingMessage}
                </span>
              )}
              {server.repo && (
                <a
                  href={server.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles["repo-link"]}
                  title="Open repository"
                >
                  <GithubIcon />
                </a>
              )}
            </div>
            <div className={styles["tags-container"]}>
              {server.tags.map((tag, index) => (
                <span key={index} className={styles["tag"]}>
                  {tag}
                </span>
              ))}
            </div>
            <div
              className={clsx(styles["mcp-market-info"], "one-line")}
              title={server.description}
            >
              {server.description}
            </div>
          </div>
          <div className={styles["mcp-market-actions"]}>
            {isAdded ? (
              <>
                {onEdit && (
                  <IconButton
                    icon={<EditIcon />}
                    text="编辑"
                    onClick={onEdit}
                  />
                )}
                {status === "paused" ? (
                  <>
                    {onStart && (
                      <IconButton
                        icon={<PlayIcon />}
                        text="启动"
                        onClick={onStart}
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        icon={<DeleteIcon />}
                        text="移除"
                        onClick={onDelete}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {onViewTools && (
                      <IconButton
                        icon={<EyeIcon />}
                        text="工具"
                        onClick={onViewTools}
                        disabled={status === "error"}
                      />
                    )}
                    {onStop && (
                      <IconButton
                        icon={<StopIcon />}
                        text="停止"
                        onClick={onStop}
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        icon={<DeleteIcon />}
                        text="移除"
                        onClick={onDelete}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              onAdd && (
                <IconButton icon={<AddIcon />} text="添加" onClick={onAdd} />
              )
            )}
          </div>
        </div>
      </div>
    );
  },
  // 自定义比较函数 - 只在关键属性变化时重新渲染
  (prevProps, nextProps) => {
    return (
      prevProps.server.id === nextProps.server.id &&
      prevProps.isAdded === nextProps.isAdded &&
      prevProps.status === nextProps.status &&
      prevProps.loadingMessage === nextProps.loadingMessage
    );
  },
);
