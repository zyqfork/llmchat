const fs = require("fs");
const path = require("path");
const {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  nativeTheme,
  Tray,
  Menu,
} = require("electron");

const isDev = !app.isPackaged;
const PROTOCOL = "llmchat";
let requestCounter = 0;
let wsCounter = 1;
const wsConnections = new Map();
let mainWindow = null;
let tray = null;

function normalizeHeaders(headers) {
  const output = {};
  if (!headers || typeof headers !== "object") return output;
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      output[key] = value;
    } else if (value != null) {
      output[key] = String(value);
    }
  }
  return output;
}

function focusMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function emitDeepLink(url) {
  if (!mainWindow?.webContents) return;
  mainWindow.webContents.send("electron-deep-link", url);
}

function handleDeepLinkArg(arg) {
  if (typeof arg === "string" && arg.startsWith(`${PROTOCOL}:`)) {
    emitDeepLink(arg);
  }
}

function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    focusMainWindow();
    argv.forEach(handleDeepLinkArg);
  });
}

if (process.platform === "darwin") {
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleDeepLinkArg(url);
    focusMainWindow();
  });
}

ipcMain.handle("electron-fetch", async (event, payload) => {
  const requestId = requestCounter++;
  const webContents = event.sender;

  try {
    const response = await fetch(payload.url, {
      method: payload.method || "GET",
      headers: normalizeHeaders(payload.headers),
      body:
        payload.body && payload.body.length > 0
          ? Buffer.from(payload.body)
          : undefined,
      signal: AbortSignal.timeout((payload.timeout_secs || 300) * 1000),
    });

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    (async () => {
      try {
        if (response.body) {
          for await (const chunk of response.body) {
            webContents.send("electron-stream-response", {
              request_id: requestId,
              chunk: Array.from(chunk),
            });
          }
        }
        webContents.send("electron-stream-response", {
          request_id: requestId,
          status: 0,
          error: null,
        });
      } catch (streamError) {
        webContents.send("electron-stream-response", {
          request_id: requestId,
          status: 0,
          error: String(streamError),
        });
      }
    })();

    return {
      request_id: requestId,
      status: response.status,
      status_text: response.statusText || "OK",
      headers,
    };
  } catch (error) {
    throw new Error(`Request failed: ${String(error)}`);
  }
});

ipcMain.handle("electron-ws-connect", async (event, payload) => {
  const connectionId = wsCounter++;
  const webContents = event.sender;
  const Ws = require("ws");
  const hdrs = normalizeHeaders(payload.headers);
  const hasAuth = Object.keys(hdrs).some(
    (k) => k.toLowerCase() === "authorization",
  );
  const protocols =
    hasAuth ? [] : Array.isArray(payload.protocols) ? payload.protocols : [];
  const socket = new Ws(payload.url, protocols, {
    headers: hdrs,
  });

  socket.on("open", () => {
    webContents.send("electron-ws-open", { connection_id: connectionId });
  });
  socket.on("message", (data) => {
    const text = typeof data === "string" ? data : data.toString("utf-8");
    webContents.send("electron-ws-message", {
      connection_id: connectionId,
      data: text,
    });
  });
  socket.on("close", (code, reason) => {
    webContents.send("electron-ws-close", {
      connection_id: connectionId,
      code,
      reason: reason ? reason.toString() : "",
    });
    wsConnections.delete(connectionId);
  });
  socket.on("error", (err) => {
    webContents.send("electron-ws-error", {
      connection_id: connectionId,
      error: String(err || "WebSocket connection error"),
    });
  });

  wsConnections.set(connectionId, socket);
  return connectionId;
});

ipcMain.handle("electron-ws-send", async (_event, payload) => {
  const socket = wsConnections.get(payload.connection_id);
  if (!socket) {
    throw new Error(`WebSocket not found: ${payload.connection_id}`);
  }
  socket.send(payload.data);
  return true;
});

ipcMain.handle("electron-set-native-theme", async (_event, theme) => {
  if (theme === "system" || theme == null) {
    nativeTheme.themeSource = "system";
  } else if (theme === "dark") {
    nativeTheme.themeSource = "dark";
  } else {
    nativeTheme.themeSource = "light";
  }
});

ipcMain.handle("electron-ws-close", async (_event, payload) => {
  const socket = wsConnections.get(payload.connection_id);
  if (!socket) return true;
  socket.close();
  wsConnections.delete(payload.connection_id);
  return true;
});

ipcMain.handle("electron-open-external", async (_event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle("electron-toggle-devtools", (event) => {
  if (event.sender.isDevToolsOpened()) {
    event.sender.closeDevTools();
  } else {
    event.sender.openDevTools();
  }
});

function getAppIconPath() {
  const iconsDir = isDev
    ? path.join(__dirname, "..", "src-tauri", "icons")
    : path.join(process.resourcesPath, "icons");
  if (process.platform === "win32") {
    return path.join(iconsDir, "icon.ico");
  }
  if (process.platform === "darwin") {
    return path.join(iconsDir, "icon.icns");
  }
  return path.join(iconsDir, "icon.png");
}

function setupTray(iconPath) {
  if (!iconPath || !fs.existsSync(iconPath)) return;
  tray = new Tray(iconPath);
  tray.setToolTip("LLMChat");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示 LLMChat",
      click: () => focusMainWindow(),
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => focusMainWindow());
}

function blockDevToolsShortcuts(win) {
  if (isDev) return;
  win.webContents.on("before-input-event", (event, input) => {
    const key = input.key?.toLowerCase();
    if (key === "f12") {
      event.preventDefault();
      return;
    }
    if (input.control && input.shift && (key === "i" || key === "j" || key === "c")) {
      event.preventDefault();
    }
  });
}

function createMainWindow() {
  const iconPath = getAppIconPath();
  const icon = fs.existsSync(iconPath) ? iconPath : undefined;

  mainWindow = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 640,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    title: "LLMChat",
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  blockDevToolsShortcuts(mainWindow);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (process.platform === "darwin") {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }

  mainWindow.webContents.once("did-finish-load", () => {
    process.argv.forEach(handleDeepLinkArg);
  });
}

app.whenReady().then(() => {
  registerProtocol();
  const iconPath = getAppIconPath();
  setupTray(iconPath);
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      focusMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (mainWindow) {
    mainWindow.removeAllListeners("close");
    mainWindow.destroy();
    mainWindow = null;
  }
});
