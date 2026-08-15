import { useState, useEffect, useRef, useCallback } from "react";
import { ErrorBoundary } from "./error";
import styles from "./mask.module.scss";
import { useNavigate } from "react-router-dom";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import Locale from "../locales";
import { Path } from "../constant";

import { useChatStore } from "../store";

type Item = {
  id: number;
  name: string;
  content: string;
};
export function SearchChatPage() {
  const navigate = useNavigate();

  const chatStore = useChatStore();

  const sessions = chatStore.sessions;
  const selectSession = chatStore.selectSession;

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Item[]>([]);

  const doSearch = useCallback(
    (text: string) => {
      const lowerCaseText = text.toLowerCase();
      const results: Item[] = [];

      sessions.forEach((session, index) => {
        const fullTextContents: string[] = [];

        session.messages.forEach((message) => {
          const content = message.content as string;
          if (!content.toLowerCase || content === "") return;
          const lowerCaseContent = content.toLowerCase();

          // full text search
          let pos = lowerCaseContent.indexOf(lowerCaseText);
          while (pos !== -1) {
            const start = Math.max(0, pos - 35);
            const end = Math.min(
              content.length,
              pos + lowerCaseText.length + 35,
            );
            fullTextContents.push(content.substring(start, end));
            pos = lowerCaseContent.indexOf(
              lowerCaseText,
              pos + lowerCaseText.length,
            );
          }
        });

        if (fullTextContents.length > 0) {
          results.push({
            id: index,
            name: session.topic,
            content: fullTextContents.join("... "), // concat content with...
          });
        }
      });

      // sort by length of matching content
      results.sort((a, b) => b.content.length - a.content.length);

      return results;
    },
    [sessions],
  );

  // 输入防抖搜索（替代原来的 1s 轮询），输入为空时清空结果
  useEffect(() => {
    if (!searchText) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchResults(doSearch(searchText));
    }, 200);
    return () => clearTimeout(timer);
  }, [searchText, doSearch]);

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        {/* header */}
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              {Locale.SearchChat.Page.Title}
            </div>
            <div className="window-header-submai-title">
              {Locale.SearchChat.Page.SubTitle(searchResults.length)}
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
              />
            </div>
          </div>
        </div>

        <div className={styles["mask-page-body"]}>
          <div className={styles["mask-filter"]}>
            {/**搜索输入框 */}
            <input
              type="text"
              className={styles["search-bar"]}
              placeholder={Locale.SearchChat.Page.Search}
              autoFocus
              value={searchText}
              onChange={(e) => setSearchText(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (searchText.length > 0) {
                    setSearchResults(doSearch(searchText));
                  }
                }
              }}
            />
          </div>

          <div>
            {searchResults.map((item) => (
              <div
                className={styles["mask-item"]}
                key={item.id}
                onClick={() => {
                  navigate(Path.Chat);
                  selectSession(item.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {/** 搜索匹配的文本 */}
                <div className={styles["mask-header"]}>
                  <div className={styles["mask-title"]}>
                    <div className={styles["mask-name"]}>{item.name}</div>
                    {item.content.slice(0, 70)}
                  </div>
                </div>
                {/** 操作按钮 */}
                <div className={styles["mask-actions"]}>
                  <IconButton
                    icon={<EyeIcon />}
                    text={Locale.SearchChat.Item.View}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
