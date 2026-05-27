declare module "*.jpg";
declare module "*.png";
declare module "*.woff2";
declare module "*.woff";
declare module "*.ttf";
declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.svg";

declare interface Window {
  // Tauri 2.x uses a simple boolean flag for detection
  // All APIs are now imported from @tauri-apps/api/* packages
  __TAURI__?: boolean;
  electronApp?: {
    isElectron?: boolean;
    isDesktopClient?: boolean;
    invokeFetch?: (payload: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: number[];
      timeout_secs: number;
    }) => Promise<{
      request_id: number;
      status: number;
      status_text: string;
      headers: Record<string, string>;
    }>;
    onStreamResponse?: (
      listener: (payload: {
        request_id: number;
        chunk?: number[];
        status?: number;
        error?: string | null;
      }) => void,
    ) => () => void;
    wsConnect?: (payload: {
      url: string;
      protocols?: string[];
      headers?: Record<string, string>;
    }) => Promise<number>;
    wsSend?: (payload: {
      connection_id: number;
      data: string;
    }) => Promise<boolean>;
    wsClose?: (payload: { connection_id: number }) => Promise<boolean>;
    onWsOpen?: (
      listener: (payload: { connection_id: number }) => void,
    ) => () => void;
    onWsMessage?: (
      listener: (payload: { connection_id: number; data: string }) => void,
    ) => () => void;
    onWsClose?: (
      listener: (payload: {
        connection_id: number;
        code?: number;
        reason?: string;
      }) => void,
    ) => () => void;
    onWsError?: (
      listener: (payload: { connection_id: number; error: string }) => void,
    ) => () => void;
    setNativeTheme?: (theme: "system" | "light" | "dark") => Promise<void>;
    onNativeThemeChanged?: (
      listener: (shouldUseDarkColors: boolean) => void,
    ) => () => void;
    openExternal?: (url: string) => Promise<void>;
    onDeepLink?: (listener: (url: string) => void) => () => void;
  };
}
