/**
 * Debug 请求/响应查看弹窗
 */
import React from "react";
import { Modal } from "../ui-lib";
import { IconButton } from "../button";
import CopyIcon from "../../icons/copy.svg";
import Locale from "../../locales";
import { copyToClipboard } from "../../utils";
import type { ChatMessage } from "../../store";

export interface ChatDebugModalProps {
  show: boolean;
  message: ChatMessage | null;
  onClose: () => void;
}

export function ChatDebugModal({
  show,
  message: debugMessage,
  onClose,
}: ChatDebugModalProps) {
  if (!show) return null;

  const handleCopyCurl = () => {
    const req = (debugMessage as any)?.debug?.request;
    if (!req) return;
    const method = (req.method || "POST").toUpperCase();
    const url = req.url || "";
    const headers = req.headers || {};

    const lines: string[] = [];
    lines.push(`curl '${url}'`);
    if (method && method !== "GET") {
      lines.push(`-X ${method}`);
    }
    try {
      Object.keys(headers || {}).forEach((k) => {
        const v = (headers as any)[k];
        const sv = typeof v === "string" ? v : JSON.stringify(v);
        lines.push(`-H '${k}: ${sv}'`);
      });
    } catch {}
    const body = req.body;
    if (typeof body !== "undefined") {
      let bodyStr: string;
      try {
        if (typeof body === "string") {
          const parsed = JSON.parse(body);
          bodyStr = JSON.stringify(parsed, null, 2);
        } else {
          bodyStr = JSON.stringify(body, null, 2);
        }
      } catch {
        bodyStr = typeof body === "string" ? body : JSON.stringify(body);
      }
      const escaped = bodyStr.replace(/'/g, `'"'"'`);
      lines.push(`-d '${escaped}'`);
    }
    const formatted = lines.map((line, idx) =>
      idx < lines.length - 1 ? `${line} \\` : line,
    );
    const cmd = formatted.join("\n");
    copyToClipboard(cmd);
  };

  const requestBody = (() => {
    const req = (debugMessage as any)?.debug?.request;
    if (!req) return "<empty>";
    let displayReq = req;
    if (
      typeof req.body === "string" &&
      (req.body.trimStart().startsWith("{") ||
        req.body.trimStart().startsWith("["))
    ) {
      try {
        displayReq = { ...req, body: JSON.parse(req.body) };
      } catch {
        /* 解析失败则原样显示 */
      }
    }
    return JSON.stringify(displayReq, null, 2);
  })();

  const responseBody = (() => {
    const res = (debugMessage as any)?.debug?.response;
    return res ? JSON.stringify(res, null, 2) : "<empty>";
  })();

  const preStyle = {
    whiteSpace: "pre-wrap" as const,
    userSelect: "text" as const,
    cursor: "text" as const,
    backgroundColor: "var(--hover-color)",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    lineHeight: "1.5",
  };

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.Actions.Debug}
        onClose={onClose}
        actions={[
          <IconButton
            text={Locale.Chat.Actions.CopyAsCurl}
            icon={<CopyIcon />}
            key="copycurl"
            onClick={handleCopyCurl}
          />,
        ]}
      >
        <div
          style={{
            height: "100%",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Request</div>
            <pre style={preStyle}>{requestBody}</pre>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Response</div>
            <pre style={preStyle}>{responseBody}</pre>
          </div>
        </div>
      </Modal>
    </div>
  );
}
