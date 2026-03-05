import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store";
import Locale from "../../locales";
import CloseIcon from "../../icons/close.svg";
import LoadingIcon from "../../icons/three-dots.svg";
import { getAllTools } from "../../mcp/actions.client";
import styles from "../chat.module.scss";

interface MCPClient {
  clientId: string;
  tools: any;
}

export function MCPPanel(props: { showPanel: boolean; onClose: () => void }) {
  const { showPanel, onClose } = props;
  const chatStore = useChatStore();
  const [mcpClients, setMcpClients] = useState<MCPClient[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMcpClients = async () => {
      try {
        setLoading(true);
        const tools = await getAllTools();
        setMcpClients(
          tools.filter(
            (client) => client.tools && client.tools.tools?.length > 0,
          ),
        );
      } catch {
        // Locale.Chat.MCP.ClientFailed
      } finally {
        setLoading(false);
      }
    };

    if (showPanel) {
      loadMcpClients();
    }
  }, [showPanel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const mcpButton = document.querySelector("[data-mcp-button]");
      if (mcpButton && mcpButton.contains(target)) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };

    if (showPanel) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPanel, onClose]);

  const handleToggleClient = (clientId: string, enabled: boolean) => {
    chatStore.updateSessionMcpClient(clientId, enabled);
  };

  if (!showPanel) return null;

  const mcpEnabled = chatStore.getSessionMcpEnabled();

  return (
    <div ref={panelRef} className={styles["mcp-panel"]}>
      <div className={styles["mcp-panel-header"]}>
        <span className={styles["mcp-panel-title"]}>
          {Locale.Chat.MCP.Title}
        </span>
        <button className={styles["mcp-panel-close"]} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className={styles["mcp-panel-content"]}>
        <div className={styles["mcp-global-toggle"]}>
          <div className={styles["mcp-global-toggle-info"]}>
            <div className={styles["mcp-global-toggle-title"]}>
              {Locale.Chat.MCP.Enable}
            </div>
            <div className={styles["mcp-global-toggle-desc"]}>
              {Locale.Chat.MCP.EnableDesc}
            </div>
          </div>
          <label className={styles["mcp-client-toggle"]}>
            <input
              type="checkbox"
              checked={mcpEnabled}
              onChange={(e) =>
                chatStore.updateSessionMcpEnabled(e.target.checked)
              }
            />
            <span className={styles["toggle-slider"]}></span>
          </label>
        </div>

        {mcpEnabled && (
          <>
            {loading ? (
              <div className={styles["mcp-panel-loading"]}>
                <LoadingIcon />
                <span>{Locale.Chat.MCP.Loading}</span>
              </div>
            ) : mcpClients.length === 0 ? (
              <div className={styles["mcp-panel-empty"]}>
                <span>{Locale.Chat.MCP.NoTools}</span>
              </div>
            ) : (
              <div className={styles["mcp-client-list"]}>
                {mcpClients.map((client) => {
                  const isEnabled = chatStore.getSessionMcpClientStatus(
                    client.clientId,
                  );
                  const toolCount = client.tools?.tools?.length || 0;

                  return (
                    <div
                      key={client.clientId}
                      className={styles["mcp-client-item"]}
                    >
                      <div className={styles["mcp-client-info"]}>
                        <div className={styles["mcp-client-name"]}>
                          {client.clientId}
                        </div>
                        <div className={styles["mcp-client-tools"]}>
                          {Locale.Chat.MCP.ToolsCount(toolCount)}
                        </div>
                      </div>
                      <label className={styles["mcp-client-toggle"]}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) =>
                            handleToggleClient(
                              client.clientId,
                              e.target.checked,
                            )
                          }
                        />
                        <span className={styles["toggle-slider"]}></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
