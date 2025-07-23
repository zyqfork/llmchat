import DeleteIcon from "../icons/delete.svg";

import styles from "./home.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import { useChatStore } from "../store";

import Locale from "../locales";
import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { Mask } from "../store/mask";
import { getMaskEffectiveModel } from "../utils/model-resolver";
import { useRef, useEffect, useState } from "react";
import { useMaskStore } from "../store/mask";
import { showConfirm } from "./ui-lib";
import { useMobileScreen } from "../utils";
import clsx from "clsx";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const { pathname: currentPath } = useLocation();
  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={clsx(styles["chat-item"], {
            [styles["chat-item-selected"]]:
              props.selected &&
              (currentPath === Path.Chat || currentPath === Path.Home),
          })}
          onClick={props.onClick}
          ref={(ele) => {
            draggableRef.current = ele;
            provided.innerRef(ele);
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={`${props.title}\n${Locale.ChatItem.ChatItemCount(
            props.count,
          )}`}
        >
          {props.narrow ? (
            <div className={styles["chat-item-narrow"]}>
              <div className={clsx(styles["chat-item-avatar"], "no-dark")}>
                <MaskAvatar
                  avatar={props.mask.avatar}
                  model={getMaskEffectiveModel(props.mask) as any}
                />
              </div>
              <div className={styles["chat-item-narrow-count"]}>
                {props.count}
              </div>
            </div>
          ) : (
            <>
              <div className={styles["chat-item-title"]}>{props.title}</div>
              <div className={styles["chat-item-info"]}>
                <div className={styles["chat-item-count"]}>
                  {Locale.ChatItem.ChatItemCount(props.count)}
                </div>
                <div className={styles["chat-item-date"]}>{props.time}</div>
              </div>
            </>
          )}

          <div
            className={styles["chat-item-delete"]}
            onClickCapture={(e) => {
              props.onDelete?.();
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DeleteIcon />
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function ChatList(props: { narrow?: boolean }) {
  const [sessions, selectedIndex, selectSession, moveSession, currentMaskId] =
    useChatStore((state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.moveSession,
      state.currentMaskId,
    ]);
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();

  // 用于跟踪面具是否刚刚切换
  const [lastMaskId, setLastMaskId] = useState(currentMaskId);

  // 根据当前面具过滤sessions
  const filteredSessions = currentMaskId
    ? sessions.filter((session) => session.mask.id === currentMaskId)
    : sessions;

  // 监听面具切换，自动切换到对应面具的最新话题或创建新话题
  useEffect(() => {
    // 只有当面具真正切换时才执行（不是初始化时）
    if (currentMaskId && currentMaskId !== lastMaskId) {
      setLastMaskId(currentMaskId);

      if (filteredSessions.length === 0) {
        // 如果没有话题，创建一个新话题
        const selectedMask = maskStore
          .getAll()
          .find((m) => m.id === currentMaskId);
        if (selectedMask) {
          // 使用该面具创建新session
          chatStore.newSession(selectedMask);
          // 导航到聊天页面
          navigate(Path.Chat);
        }
      } else {
        // 如果有话题，切换到最新的话题
        const latestSession = filteredSessions.sort(
          (a, b) => b.lastUpdate - a.lastUpdate,
        )[0];
        const sessionIndex = sessions.findIndex(
          (s) => s.id === latestSession.id,
        );
        if (sessionIndex !== -1) {
          chatStore.selectSession(sessionIndex);
        }
      }
    }
  }, [
    currentMaskId,
    lastMaskId,
    filteredSessions,
    maskStore,
    chatStore,
    navigate,
    sessions,
  ]);

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chat-list">
        {(provided) => (
          <div
            className={styles["chat-list"]}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {filteredSessions.map((item, i) => {
              // 找到该session在原始sessions数组中的索引
              const originalIndex = sessions.findIndex((s) => s.id === item.id);
              return (
                <ChatItem
                  title={item.topic}
                  time={new Date(item.lastUpdate).toLocaleString()}
                  count={item.messages.length}
                  key={item.id}
                  id={item.id}
                  index={i}
                  selected={originalIndex === selectedIndex}
                  onClick={() => {
                    navigate(Path.Chat);
                    selectSession(originalIndex);
                  }}
                  onDelete={async () => {
                    if (
                      (!props.narrow && !isMobileScreen) ||
                      (await showConfirm(Locale.Home.DeleteChat))
                    ) {
                      chatStore.deleteSession(originalIndex);
                    }
                  }}
                  narrow={props.narrow}
                  mask={item.mask}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
