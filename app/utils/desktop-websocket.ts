import { DesktopRuntime, getDesktopRuntime } from "./fetch";
import { logger } from "./logger";

type WsOpenPayload = { connection_id: number };
type WsMessagePayload = { connection_id: number; data: string };
type WsClosePayload = { connection_id: number; code?: number; reason?: string };
type WsErrorPayload = { connection_id: number; error: string };

type ListenerMap = {
  open: Set<(event: Event) => void>;
  message: Set<(event: MessageEvent) => void>;
  close: Set<(event: CloseEvent) => void>;
  error: Set<(event: Event) => void>;
};

let overrideInstalled = false;
let originalWebSocket: typeof WebSocket | null = null;

function toProtocols(protocols?: string | string[]): string[] {
  if (!protocols) return [];
  return Array.isArray(protocols) ? protocols : [protocols];
}

function createCloseEvent(code?: number, reason?: string): CloseEvent {
  return new CloseEvent("close", { code: code || 1000, reason: reason || "" });
}

function extractDesktopAuth(protocols: string[]): {
  protocols: string[];
  headers: Record<string, string>;
} {
  const headers: Record<string, string> = {};
  const nextProtocols: string[] = [];

  for (const p of protocols) {
    if (p.startsWith("api-key.")) {
      const key = p.slice("api-key.".length).trim();
      if (key) {
        headers.Authorization = `Bearer ${key}`;
        headers["OpenAI-Beta"] = "realtime=v1";
      }
      continue;
    }
    nextProtocols.push(p);
  }

  return { protocols: nextProtocols, headers };
}

export class DesktopWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = DesktopWebSocket.CONNECTING;
  readonly OPEN = DesktopWebSocket.OPEN;
  readonly CLOSING = DesktopWebSocket.CLOSING;
  readonly CLOSED = DesktopWebSocket.CLOSED;

  readyState = DesktopWebSocket.CONNECTING;
  protocol = "";
  binaryType: BinaryType = "arraybuffer";
  bufferedAmount = 0;
  extensions = "";
  url: string;

  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;

  private connectionId = -1;
  private listeners: ListenerMap = {
    open: new Set(),
    message: new Set(),
    close: new Set(),
    error: new Set(),
  };
  private unsubscribers: Array<() => void> = [];

  constructor(url: string | URL, protocols?: string | string[]) {
    this.url = url.toString();
    this.connect(this.url, toProtocols(protocols)).catch((error) => {
      this.handleError(String(error));
    });
  }

  private async connect(url: string, protocols: string[]) {
    const runtime = getDesktopRuntime();
    const extracted = extractDesktopAuth(protocols);
    const headers = extracted.headers;
    const useProtocols =
      headers.Authorization || headers.authorization ? [] : extracted.protocols;
    if (runtime === DesktopRuntime.Electron) {
      await this.connectElectron(url, useProtocols, headers);
      return;
    }
    if (runtime === DesktopRuntime.Tauri) {
      await this.connectTauri(url, useProtocols, headers);
      return;
    }
    throw new Error("desktop websocket bridge is unavailable");
  }

  private async connectElectron(
    url: string,
    protocols: string[],
    headers: Record<string, string>,
  ) {
    const app = window.electronApp;
    if (
      !app?.wsConnect ||
      !app.onWsOpen ||
      !app.onWsMessage ||
      !app.onWsClose ||
      !app.onWsError
    ) {
      throw new Error("electron websocket bridge is unavailable");
    }

    const openUnsub = app.onWsOpen((payload: WsOpenPayload) => {
      if (payload.connection_id !== this.connectionId) return;
      this.readyState = DesktopWebSocket.OPEN;
      this.emitOpen();
    });
    const msgUnsub = app.onWsMessage((payload: WsMessagePayload) => {
      if (payload.connection_id !== this.connectionId) return;
      this.emitMessage(payload.data);
    });
    const closeUnsub = app.onWsClose((payload: WsClosePayload) => {
      if (payload.connection_id !== this.connectionId) return;
      this.readyState = DesktopWebSocket.CLOSED;
      this.emitClose(payload.code, payload.reason);
      this.cleanup();
    });
    const errUnsub = app.onWsError((payload: WsErrorPayload) => {
      if (payload.connection_id !== this.connectionId) return;
      this.handleError(payload.error);
    });
    this.unsubscribers.push(openUnsub, msgUnsub, closeUnsub, errUnsub);
    this.connectionId = await app.wsConnect({ url, protocols, headers });
  }

  private async connectTauri(
    url: string,
    protocols: string[],
    headers: Record<string, string>,
  ) {
    const { invoke } = await import("@tauri-apps/api/core");
    const { listen } = await import("@tauri-apps/api/event");

    // Register all event listeners BEFORE invoke to avoid losing messages
    // that the server sends immediately after the WebSocket handshake.
    // Buffer messages until we are fully ready (connectionId known + open emitted).
    let pendingMessages: string[] = [];
    let ready = false;

    const msgUnsub = await listen<WsMessagePayload>(
      "tauri-ws-message",
      (event) => {
        if (
          this.connectionId >= 0 &&
          event.payload.connection_id !== this.connectionId
        )
          return;
        if (!ready) {
          pendingMessages.push(event.payload.data);
          return;
        }
        this.emitMessage(event.payload.data);
      },
    );
    const closeUnsub = await listen<WsClosePayload>(
      "tauri-ws-close",
      (event) => {
        if (
          this.connectionId >= 0 &&
          event.payload.connection_id !== this.connectionId
        )
          return;
        this.readyState = DesktopWebSocket.CLOSED;
        this.emitClose(event.payload.code, event.payload.reason);
        this.cleanup();
      },
    );
    const errUnsub = await listen<WsErrorPayload>("tauri-ws-error", (event) => {
      if (
        this.connectionId >= 0 &&
        event.payload.connection_id !== this.connectionId
      )
        return;
      this.handleError(event.payload.error);
    });

    this.unsubscribers.push(msgUnsub, closeUnsub, errUnsub);

    // Now establish the connection — Rust may start emitting events immediately
    this.connectionId = await invoke<number>("tauri_ws_connect", {
      url,
      protocols,
      headers,
    });

    this.readyState = DesktopWebSocket.OPEN;
    // Trigger open so the caller can set up onmessage etc.
    this.emitOpen();

    // Flush any messages that arrived between invoke return and now
    ready = true;
    for (const data of pendingMessages) {
      this.emitMessage(data);
    }
    pendingMessages = [];
  }

  send(data: string) {
    if (this.readyState !== DesktopWebSocket.OPEN) {
      throw new Error("websocket is not open");
    }
    const runtime = getDesktopRuntime();
    if (runtime === DesktopRuntime.Electron) {
      void window.electronApp?.wsSend?.({
        connection_id: this.connectionId,
        data,
      });
      return;
    }
    if (runtime === DesktopRuntime.Tauri) {
      void import("@tauri-apps/api/core").then(({ invoke }) =>
        invoke("tauri_ws_send_text", {
          connectionId: this.connectionId,
          data,
        }).catch((err) =>
          logger.error("[DesktopWS] tauri_ws_send_text failed:", err),
        ),
      );
    }
  }

  close() {
    if (this.readyState === DesktopWebSocket.CLOSED) return;
    this.readyState = DesktopWebSocket.CLOSING;
    const runtime = getDesktopRuntime();
    if (runtime === DesktopRuntime.Electron) {
      void window.electronApp?.wsClose?.({ connection_id: this.connectionId });
    } else if (runtime === DesktopRuntime.Tauri) {
      import("@tauri-apps/api/core").then(({ invoke }) =>
        invoke("tauri_ws_close", { connectionId: this.connectionId }),
      );
    }
  }

  addEventListener(
    type: "open" | "message" | "close" | "error",
    listener: EventListener,
  ) {
    this.listeners[type].add(listener as any);
  }

  removeEventListener(
    type: "open" | "message" | "close" | "error",
    listener: EventListener,
  ) {
    this.listeners[type].delete(listener as any);
  }

  private emitOpen() {
    const event = new Event("open");
    this.onopen?.call(this as any, event);
    this.listeners.open.forEach((listener) => listener(event));
  }

  private emitMessage(data: string) {
    const event = new MessageEvent("message", { data });
    this.onmessage?.call(this as any, event);
    this.listeners.message.forEach((listener) => listener(event));
  }

  private emitClose(code?: number, reason?: string) {
    const event = createCloseEvent(code, reason);
    this.onclose?.call(this as any, event);
    this.listeners.close.forEach((listener) => listener(event));
  }

  private handleError(errorText: string) {
    this.readyState = DesktopWebSocket.CLOSED;
    const event = new Event("error");
    this.onerror?.call(this as any, event);
    this.listeners.error.forEach((listener) => listener(event));
    this.emitClose(1011, errorText);
    this.cleanup();
  }

  private cleanup() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }
}

export function installDesktopWebSocketOverride() {
  const runtime = getDesktopRuntime();
  if (runtime === DesktopRuntime.Browser || overrideInstalled) return;
  if (typeof window === "undefined") return;
  originalWebSocket = window.WebSocket;
  window.WebSocket = DesktopWebSocket as any;
  overrideInstalled = true;
}

export function restoreDesktopWebSocketOverride() {
  if (!overrideInstalled || !originalWebSocket) return;
  window.WebSocket = originalWebSocket;
  overrideInstalled = false;
}
