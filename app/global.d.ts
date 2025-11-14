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
}
