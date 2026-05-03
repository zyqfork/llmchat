const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, shell } = require("electron");

const isDev = !app.isPackaged;

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
