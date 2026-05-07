const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, shell, ipcMain } = require("electron");

const isDev = !app.isPackaged;
let requestCounter = 0;
let wsCounter = 1;
const wsConnections = new Map();

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
  // Use ws library to support custom headers (Authorization, etc.)
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

ipcMain.handle("electron-ws-close", async (_event, payload) => {
  const socket = wsConnections.get(payload.connection_id);
  if (!socket) return true;
  socket.close();
  wsConnections.delete(payload.connection_id);
  return true;
});

/** 与 Tauri 共用 src-tauri/icons；打包后通过 extraResources 放在 resources/icons */
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

function createMainWindow() {
  const iconPath = getAppIconPath();
  const icon = fs.existsSync(iconPath) ? iconPath : undefined;

  const win = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 800,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    title: "LLMChat",
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
