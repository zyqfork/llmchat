import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "LLMChat",
  description: "Your personal ChatGPT Chat Bot.",
  appleWebApp: {
    title: "LLMChat",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cfg = getClientConfig();
  const desktopApp = cfg?.buildMode === "export" && cfg?.isApp;
  // 与 next.config `assetPrefix` 一致：App 静态包在 file:// 下需相对 public 资源路径
  const publicBase = desktopApp ? "./" : "/";
  return (
    <html lang="en">
      <head>
        <meta name="config" content={JSON.stringify(cfg)} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        {!desktopApp && (
          <>
            <meta name="mobile-web-app-capable" content="yes" />
            <link
              rel="manifest"
              href={`${publicBase}site.webmanifest`}
              crossOrigin="use-credentials"
            />
          </>
        )}
        <script src={`${publicBase}serviceWorkerRegister.js`} defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
