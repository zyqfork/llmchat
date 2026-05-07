const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApp", {
  isElectron: true,
  invokeFetch: (payload) => ipcRenderer.invoke("electron-fetch", payload),
  onStreamResponse: (listener) => {
    const wrapped = (_event, data) => listener(data);
    ipcRenderer.on("electron-stream-response", wrapped);
    return () => ipcRenderer.removeListener("electron-stream-response", wrapped);
  },
  wsConnect: (payload) => ipcRenderer.invoke("electron-ws-connect", payload),
  wsSend: (payload) => ipcRenderer.invoke("electron-ws-send", payload),
  wsClose: (payload) => ipcRenderer.invoke("electron-ws-close", payload),
  onWsOpen: (listener) => {
    const wrapped = (_event, data) => listener(data);
    ipcRenderer.on("electron-ws-open", wrapped);
    return () => ipcRenderer.removeListener("electron-ws-open", wrapped);
  },
  onWsMessage: (listener) => {
    const wrapped = (_event, data) => listener(data);
    ipcRenderer.on("electron-ws-message", wrapped);
    return () => ipcRenderer.removeListener("electron-ws-message", wrapped);
  },
  onWsClose: (listener) => {
    const wrapped = (_event, data) => listener(data);
    ipcRenderer.on("electron-ws-close", wrapped);
    return () => ipcRenderer.removeListener("electron-ws-close", wrapped);
  },
  onWsError: (listener) => {
    const wrapped = (_event, data) => listener(data);
    ipcRenderer.on("electron-ws-error", wrapped);
    return () => ipcRenderer.removeListener("electron-ws-error", wrapped);
  },
});
