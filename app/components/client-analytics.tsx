"use client";

import { Analytics } from "@vercel/analytics/react";
import { isDesktopApp } from "../utils/desktop";

/** 桌面客户端不加载 Web Analytics */
export function ClientAnalytics() {
  if (isDesktopApp()) return null;
  return <Analytics />;
}
