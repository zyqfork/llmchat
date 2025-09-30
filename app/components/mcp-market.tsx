"use client";

import { IconButton } from "./button";
import { ErrorBoundary } from "./error";
import styles from "./mcp-market.module.scss";
import EditIcon from "../icons/edit.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import RestartIcon from "../icons/reload.svg";
import EyeIcon from "../icons/eye.svg";
import GithubIcon from "../icons/github.svg";
import { List, ListItem, Modal, showToast } from "./ui-lib";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  addMcpServer,
  getClientsStatus,
  getClientTools,
  getMcpConfigFromFile,
  pauseMcpServer,
  restartAllClients,
  resumeMcpServer,
} from "../mcp/actions";
import {
  ListToolsResponse,
  McpConfigData,
  PresetServer,
  ServerConfig,
  ServerStatusResponse,
} from "../mcp/types";
import { getAllBuiltinServers, searchServers } from "../mcp/builtin-servers";
import clsx from "clsx";
import PlayIcon from "../icons/play.svg";
import StopIcon from "../icons/pause.svg";

interface ConfigProperty {
  type: string;
  description?: string;
  required?: boolean;
  minItems?: number;
}

export function McpMarketPage() {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [userConfig, setUserConfig] = useState<Record<string, any>>({});
  const [editingServerId, setEditingServerId] = useState<string | undefined>();
  const [tools, setTools] = useState<ListToolsResponse["tools"] | null>(null);
  const [viewingServerId, setViewingServerId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<McpConfigData>();
  const [clientStatuses, setClientStatuses] = useState<
    Record<string, ServerStatusResponse>
  >({});
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [presetServers, setPresetServers] = useState<PresetServer[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>(
    {},
  );
  // Manual add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualBaseUrl, setManualBaseUrl] = useState("");
  const [manualHeadersText, setManualHeadersText] = useState("");
  const [manualTimeout, setManualTimeout] = useState<string>("");

  // 添加状态轮询
  useEffect(() => {
    if (!config) return;

    const updateStatuses = async () => {
      const statuses = await getClientsStatus();
      setClientStatuses(statuses);
    };

    // 立即执行一次
    updateStatuses();
    // 每 1000ms 轮询一次
    const timer = setInterval(updateStatuses, 1000);

    return () => clearInterval(timer);
  }, [config]);

  // 加载内置预设服务器
  useEffect(() => {
    const loadPresetServers = async () => {
      try {
        setLoadingPresets(true);
        // 使用内置服务器配置，不再从远程获取
        const builtinServers = getAllBuiltinServers();
        setPresetServers(builtinServers);
      } catch (error) {
        showToast("Failed to load builtin servers");
      } finally {
        setLoadingPresets(false);
      }
    };
    loadPresetServers();
  }, []);

  // 加载初始状态
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        const config = await getMcpConfigFromFile();
        setConfig(config);

        // 获取所有客户端的状态
        const statuses = await getClientsStatus();
        setClientStatuses(statuses);
      } catch (error) {
        showToast("Failed to load initial state");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialState();
  }, []);

  // 加载当前编辑服务器的配置 (简化版 - 当前内置服务器都不需要配置)
  useEffect(() => {
    if (!editingServerId || !config) return;
    const currentConfig = config.mcpServers[editingServerId];
    if (currentConfig) {
      // 对于HTTP服务器，配置相对简单
      const preset = presetServers.find((s) => s.id === editingServerId);
      if (preset?.configSchema) {
        // 从服务器配置中提取用户配置
        const userConfig: Record<string, any> = {};
        // 注意：authProvider 已被移除，这里可以从其他配置源获取
        // 目前内置服务器都不需要额外配置，所以保持空配置
        Object.keys(preset.configSchema.properties).forEach((key) => {
          userConfig[key] = "";
        });
        setUserConfig(userConfig);
      }
    } else {
      setUserConfig({});
    }
  }, [editingServerId, config, presetServers]);

  // 检查服务器是否已添加
  const isServerAdded = (id: string) => {
    return id in (config?.mcpServers ?? {});
  };

  // 保存服务器配置 (SSE专用 - 简化版)
  const saveServerConfig = async () => {
    const preset = presetServers.find((s) => s.id === editingServerId);
    if (!preset || !preset.configSchema || !editingServerId) return;

    const savingServerId = editingServerId;
    setEditingServerId(undefined);

    try {
      updateLoadingState(savingServerId, "Updating configuration...");

      // 构建SSE服务器配置
      // 注意：authProvider 已被移除，现在直接构建服务器配置
      const serverConfig: ServerConfig = {
        type: "sse",
        baseUrl: preset.baseUrl,
        headers: preset.headers,
        timeout: preset.timeout,
        name: preset.name,
        description: preset.description,
        provider: preset.repo,
        tags: preset.tags,
      };

      const newConfig = await addMcpServer(savingServerId, serverConfig);
      setConfig(newConfig);
      showToast("Server configuration updated successfully");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save configuration",
      );
    } finally {
      updateLoadingState(savingServerId, null);
    }
  };

  // 获取服务器支持的 Tools
  const loadTools = async (id: string) => {
    try {
      const result = await getClientTools(id);
      if (result) {
        setTools(result);
      } else {
        throw new Error("Failed to load tools");
      }
    } catch (error) {
      showToast("Failed to load tools");
      setTools(null);
    }
  };

  // 更新加载状态的辅助函数
  const updateLoadingState = (id: string, message: string | null) => {
    setLoadingStates((prev) => {
      if (message === null) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: message };
    });
  };

  // 修改添加服务器函数
  const addServer = async (preset: PresetServer) => {
    if (!preset.configurable) {
      try {
        const serverId = preset.id;
        updateLoadingState(serverId, "Creating MCP client...");

        // 构建HTTP服务器配置 (网页端专用)
        const serverConfig: ServerConfig = {
          type: preset.transportType,
          baseUrl: preset.baseUrl,
          headers: preset.headers,
          timeout: preset.timeout,
          name: preset.name,
          description: preset.description,
          provider: preset.repo,
          tags: preset.tags,
        };

        const newConfig = await addMcpServer(preset.id, serverConfig);
        setConfig(newConfig);

        // 更新状态
        const statuses = await getClientsStatus();
        setClientStatuses(statuses);
      } finally {
        updateLoadingState(preset.id, null);
      }
    } else {
      // 如果需要配置，打开配置对话框
      setEditingServerId(preset.id);
      setUserConfig({});
    }
  };

  // 修改暂停服务器函数
  const pauseServer = async (id: string) => {
    try {
      updateLoadingState(id, "Stopping server...");
      const newConfig = await pauseMcpServer(id);
      setConfig(newConfig);
      showToast("Server stopped successfully");
    } catch (error) {
      showToast("Failed to stop server");
    } finally {
      updateLoadingState(id, null);
    }
  };

  // Restart server
  const restartServer = async (id: string) => {
    try {
      updateLoadingState(id, "Starting server...");
      await resumeMcpServer(id);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to start server, please check logs",
      );
    } finally {
      updateLoadingState(id, null);
    }
  };

  // Restart all clients
  const handleRestartAll = async () => {
    try {
      updateLoadingState("all", "Restarting all servers...");
      const newConfig = await restartAllClients();
      setConfig(newConfig);
      showToast("Restarting all clients");
    } catch (error) {
      showToast("Failed to restart clients");
    } finally {
      updateLoadingState("all", null);
    }
  };

  // ---- Manual Add (SSE) helpers ----
  const parseHeaders = (text: string): Record<string, string> | undefined => {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    try {
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const obj = JSON.parse(trimmed);
        if (Array.isArray(obj)) {
          const res: Record<string, string> = {};
          obj.forEach((pair) => {
            if (pair && pair.key) res[pair.key] = String(pair.value ?? "");
          });
          return res;
        }
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, String(v as any)]),
        );
      }
    } catch (e) {
      // fallback to line parsing
    }
    const headers: Record<string, string> = {};
    trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.indexOf(":");
        if (idx > 0) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k) headers[k] = v;
        }
      });
    return Object.keys(headers).length ? headers : undefined;
  };

  const openAddModal = () => {
    setManualId("");
    setManualName("");
    setManualDesc("");
    setManualBaseUrl("");
    setManualHeadersText("");
    setManualTimeout("");
    setIsAddOpen(true);
  };

  const submitManualAdd = async () => {
    // basic validation
    const id = manualId.trim();
    if (!id) {
      showToast("请输入唯一的 Server ID");
      return;
    }
    if (config?.mcpServers && id in config.mcpServers) {
      showToast("该 Server ID 已存在");
      return;
    }
    const url = manualBaseUrl.trim();
    try {
      // will throw if invalid
      new URL(url);
    } catch {
      showToast("请输入有效的 Base URL");
      return;
    }
    const timeoutNum = manualTimeout.trim()
      ? Math.max(0, Number(manualTimeout.trim()))
      : undefined;
    if (timeoutNum !== undefined && Number.isNaN(timeoutNum)) {
      showToast("超时时间必须是数字");
      return;
    }
    const headers = parseHeaders(manualHeadersText);

    const serverConfig: ServerConfig = {
      type: "sse",
      baseUrl: url,
      headers,
      timeout: timeoutNum,
      name: manualName.trim() || undefined,
      description: manualDesc.trim() || undefined,
      status: "active",
    };

    try {
      updateLoadingState(id, "Creating MCP client...");
      const newCfg = await addMcpServer(id, serverConfig);
      setConfig(newCfg);
      const statuses = await getClientsStatus();
      setClientStatuses(statuses);
      setIsAddOpen(false);
      showToast("Server added");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to add server, please check",
      );
    } finally {
      updateLoadingState(id, null);
    }
  };

  // Render configuration form
  const renderConfigForm = () => {
    const preset = presetServers.find((s) => s.id === editingServerId);
    if (!preset?.configSchema) return null;

    return Object.entries(preset.configSchema.properties).map(
      ([key, prop]: [string, ConfigProperty]) => {
        if (prop.type === "array") {
          const currentValue = userConfig[key as keyof typeof userConfig] || [];
          const itemLabel = (prop as any).itemLabel || key;
          const addButtonText =
            (prop as any).addButtonText || `Add ${itemLabel}`;

          return (
            <ListItem
              key={key}
              title={key}
              subTitle={prop.description}
              vertical
            >
              <div className={styles["path-list"]}>
                {(currentValue as string[]).map(
                  (value: string, index: number) => (
                    <div key={index} className={styles["path-item"]}>
                      <input
                        type="text"
                        value={value}
                        placeholder={`${itemLabel} ${index + 1}`}
                        onChange={(e) => {
                          const newValue = [...currentValue] as string[];
                          newValue[index] = e.target.value;
                          setUserConfig({ ...userConfig, [key]: newValue });
                        }}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        className={styles["delete-button"]}
                        onClick={() => {
                          const newValue = [...currentValue] as string[];
                          newValue.splice(index, 1);
                          setUserConfig({ ...userConfig, [key]: newValue });
                        }}
                      />
                    </div>
                  ),
                )}
                <IconButton
                  icon={<AddIcon />}
                  text={addButtonText}
                  className={styles["add-button"]}
                  bordered
                  onClick={() => {
                    const newValue = [...currentValue, ""] as string[];
                    setUserConfig({ ...userConfig, [key]: newValue });
                  }}
                />
              </div>
            </ListItem>
          );
        } else if (prop.type === "string") {
          const currentValue = userConfig[key as keyof typeof userConfig] || "";
          return (
            <ListItem key={key} title={key} subTitle={prop.description}>
              <input
                aria-label={key}
                type="text"
                value={currentValue}
                placeholder={`Enter ${key}`}
                onChange={(e) => {
                  setUserConfig({ ...userConfig, [key]: e.target.value });
                }}
              />
            </ListItem>
          );
        }
        return null;
      },
    );
  };

  const checkServerStatus = (clientId: string) => {
    return clientStatuses[clientId] || { status: "undefined", errorMsg: null };
  };

  const getServerStatusDisplay = (clientId: string) => {
    const status = checkServerStatus(clientId);

    const statusMap = {
      undefined: null, // 未配置/未找到不显示
      // 添加初始化状态
      initializing: (
        <span className={clsx(styles["server-status"], styles["initializing"])}>
          Initializing
        </span>
      ),
      paused: (
        <span className={clsx(styles["server-status"], styles["stopped"])}>
          Stopped
        </span>
      ),
      active: <span className={styles["server-status"]}>Running</span>,
      error: (
        <span className={clsx(styles["server-status"], styles["error"])}>
          Error
          <span className={styles["error-message"]}>: {status.errorMsg}</span>
        </span>
      ),
    };

    return statusMap[status.status];
  };

  // Get the type of operation status
  const getOperationStatusType = (message: string) => {
    if (message.toLowerCase().includes("stopping")) return "stopping";
    if (message.toLowerCase().includes("starting")) return "starting";
    if (message.toLowerCase().includes("error")) return "error";
    return "default";
  };

  // 渲染服务器列表
  const renderServerList = () => {
    if (loadingPresets) {
      return (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-text"]}>
            Loading preset server list...
          </div>
        </div>
      );
    }

    if (!Array.isArray(presetServers) || presetServers.length === 0) {
      return (
        <div className={styles["empty-container"]}>
          <div className={styles["empty-text"]}>No servers available</div>
        </div>
      );
    }

    // 使用优化的搜索功能
    const filteredServers =
      searchText.length === 0 ? presetServers : searchServers(searchText);

    return filteredServers
      .sort((a, b) => {
        const aStatus = checkServerStatus(a.id).status;
        const bStatus = checkServerStatus(b.id).status;
        const aLoading = loadingStates[a.id];
        const bLoading = loadingStates[b.id];

        // 定义状态优先级
        const statusPriority: Record<string, number> = {
          error: 0, // Highest priority for error status
          active: 1, // Second for active
          initializing: 2, // Initializing
          starting: 3, // Starting
          stopping: 4, // Stopping
          paused: 5, // Paused
          undefined: 6, // Lowest priority for undefined
        };

        // Get actual status (including loading status)
        const getEffectiveStatus = (status: string, loading?: string) => {
          if (loading) {
            const operationType = getOperationStatusType(loading);
            return operationType === "default" ? status : operationType;
          }

          if (status === "initializing" && !loading) {
            return "active";
          }

          return status;
        };

        const aEffectiveStatus = getEffectiveStatus(aStatus, aLoading);
        const bEffectiveStatus = getEffectiveStatus(bStatus, bLoading);

        // 首先按状态排序
        if (aEffectiveStatus !== bEffectiveStatus) {
          return (
            (statusPriority[aEffectiveStatus] ?? 6) -
            (statusPriority[bEffectiveStatus] ?? 6)
          );
        }

        // Sort by name when statuses are the same
        return a.name.localeCompare(b.name);
      })
      .map((server) => (
        <div
          className={clsx(styles["mcp-market-item"], {
            [styles["loading"]]: loadingStates[server.id],
          })}
          key={server.id}
        >
          <div className={styles["mcp-market-header"]}>
            <div className={styles["mcp-market-title"]}>
              <div className={styles["mcp-market-name"]}>
                {server.name}
                {loadingStates[server.id] && (
                  <span
                    className={styles["operation-status"]}
                    data-status={getOperationStatusType(
                      loadingStates[server.id],
                    )}
                  >
                    {loadingStates[server.id]}
                  </span>
                )}
                {!loadingStates[server.id] && getServerStatusDisplay(server.id)}
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
              {isServerAdded(server.id) ? (
                <>
                  {server.configurable && (
                    <IconButton
                      icon={<EditIcon />}
                      text="Configure"
                      onClick={() => setEditingServerId(server.id)}
                      disabled={isLoading}
                    />
                  )}
                  {checkServerStatus(server.id).status === "paused" ? (
                    <>
                      <IconButton
                        icon={<PlayIcon />}
                        text="Start"
                        onClick={() => restartServer(server.id)}
                        disabled={isLoading}
                      />
                      {/* <IconButton
                        icon={<DeleteIcon />}
                        text="Remove"
                        onClick={() => removeServer(server.id)}
                        disabled={isLoading}
                      /> */}
                    </>
                  ) : (
                    <>
                      <IconButton
                        icon={<EyeIcon />}
                        text="Tools"
                        onClick={async () => {
                          setViewingServerId(server.id);
                          await loadTools(server.id);
                        }}
                        disabled={
                          isLoading ||
                          checkServerStatus(server.id).status === "error"
                        }
                      />
                      <IconButton
                        icon={<StopIcon />}
                        text="Stop"
                        onClick={() => pauseServer(server.id)}
                        disabled={isLoading}
                      />
                    </>
                  )}
                </>
              ) : (
                <IconButton
                  icon={<AddIcon />}
                  text="Add"
                  onClick={() => addServer(server)}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      ));
  };

  return (
    <ErrorBoundary>
      <div className={styles["mcp-market-page"]}>
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              MCP Market
              {loadingStates["all"] && (
                <span className={styles["loading-indicator"]}>
                  {loadingStates["all"]}
                </span>
              )}
            </div>
            <div className="window-header-sub-title">
              {Object.keys(config?.mcpServers ?? {}).length} servers configured
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<AddIcon />}
                bordered
                onClick={openAddModal}
                text="Add Server"
                disabled={isLoading}
              />
            </div>
            <div className="window-action-button">
              <IconButton
                icon={<RestartIcon />}
                bordered
                onClick={handleRestartAll}
                text="Restart All"
                disabled={isLoading}
              />
            </div>
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className={styles["mcp-market-page-body"]}>
          <div className={styles["mcp-market-filter"]}>
            <input
              type="text"
              className={styles["search-bar"]}
              placeholder={"Search MCP Server"}
              autoFocus
              onInput={(e) => setSearchText(e.currentTarget.value)}
            />
          </div>

          <div className={styles["server-list"]}>{renderServerList()}</div>
        </div>

        {/*手动添加服务器*/}
        {isAddOpen && (
          <div className="modal-mask">
            <Modal
              title="Add MCP Server (SSE)"
              onClose={() => setIsAddOpen(false)}
              actions={[
                <IconButton
                  key="cancel"
                  text="Cancel"
                  onClick={() => setIsAddOpen(false)}
                  bordered
                  disabled={isLoading}
                />,
                <IconButton
                  key="confirm"
                  text="Add"
                  type="primary"
                  onClick={submitManualAdd}
                  bordered
                  disabled={isLoading}
                />,
              ]}
            >
              <List>
                <ListItem
                  title="Server ID"
                  subTitle="唯一标识，建议使用英文数字小写"
                >
                  <input
                    aria-label="server-id"
                    type="text"
                    placeholder="e.g. my-sse-server"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                  />
                </ListItem>
                <ListItem title="Name" subTitle="可选，用于显示">
                  <input
                    aria-label="server-name"
                    type="text"
                    placeholder="Optional name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </ListItem>
                <ListItem title="Description" subTitle="可选，简要说明">
                  <input
                    aria-label="server-desc"
                    type="text"
                    placeholder="Optional description"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                  />
                </ListItem>
                <ListItem title="Base URL" subTitle="SSE 服务的事件流地址">
                  <input
                    aria-label="server-url"
                    type="text"
                    placeholder="https://example.com/mcp/sse"
                    value={manualBaseUrl}
                    onChange={(e) => setManualBaseUrl(e.target.value)}
                  />
                </ListItem>
                <ListItem
                  title="Headers"
                  subTitle="可选，支持 JSON 或 每行 key:value"
                >
                  <textarea
                    aria-label="server-headers"
                    placeholder='{"Authorization":"Bearer ..."}'
                    value={manualHeadersText}
                    onChange={(e) => setManualHeadersText(e.target.value)}
                    rows={4}
                  />
                </ListItem>
                <ListItem title="Timeout" subTitle="可选，单位秒">
                  <input
                    aria-label="server-timeout"
                    type="number"
                    placeholder="30"
                    value={manualTimeout}
                    onChange={(e) => setManualTimeout(e.target.value)}
                  />
                </ListItem>
              </List>
            </Modal>
          </div>
        )}

        {/*编辑服务器配置*/}
        {editingServerId && (
          <div className="modal-mask">
            <Modal
              title={`Configure Server - ${editingServerId}`}
              onClose={() => !isLoading && setEditingServerId(undefined)}
              actions={[
                <IconButton
                  key="cancel"
                  text="Cancel"
                  onClick={() => setEditingServerId(undefined)}
                  bordered
                  disabled={isLoading}
                />,
                <IconButton
                  key="confirm"
                  text="Save"
                  type="primary"
                  onClick={saveServerConfig}
                  bordered
                  disabled={isLoading}
                />,
              ]}
            >
              <List>{renderConfigForm()}</List>
            </Modal>
          </div>
        )}

        {viewingServerId && (
          <div className="modal-mask">
            <Modal
              title={`Server Details - ${viewingServerId}`}
              onClose={() => setViewingServerId(undefined)}
              actions={[
                <IconButton
                  key="close"
                  text="Close"
                  onClick={() => setViewingServerId(undefined)}
                  bordered
                />,
              ]}
            >
              <div className={styles["tools-list"]}>
                {isLoading ? (
                  <div>Loading...</div>
                ) : tools?.tools ? (
                  tools.tools.map(
                    (tool: ListToolsResponse["tools"], index: number) => (
                      <div key={index} className={styles["tool-item"]}>
                        <div className={styles["tool-name"]}>{tool.name}</div>
                        <div className={styles["tool-description"]}>
                          {tool.description}
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div>No tools available</div>
                )}
              </div>
            </Modal>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
