import {
  useEffect,
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useParams } from "react-router";
import { IconButton } from "./button";
import { nanoid } from "nanoid";
import ShareIcon from "../icons/share.svg";
import CopyIcon from "../icons/copy.svg";
import DownloadIcon from "../icons/download.svg";
import GithubIcon from "../icons/github.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import ReloadButtonIcon from "../icons/reload.svg";
import Locale from "../locales";
import { Modal, showToast } from "./ui-lib";
import { HTMLPreviewModal } from "./html-preview-modal";
import { copyToClipboard, downloadAs } from "../utils";
import { Path, ApiPath, REPO_URL } from "@/app/constant";
import { Loading } from "./home";
import styles from "./artifacts.module.scss";

type HTMLPreviewProps = {
  code: string;
  autoHeight?: boolean;
  height?: number | string;
  onLoad?: (title?: string) => void;
};

export type HTMLPreviewHander = {
  reload: () => void;
};

export const HTMLPreview = forwardRef<HTMLPreviewHander, HTMLPreviewProps>(
  function HTMLPreview(props, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [frameId, setFrameId] = useState<string>(nanoid());
    const [iframeHeight, setIframeHeight] = useState(600);
    const [title, setTitle] = useState("");
    /*
     * https://stackoverflow.com/questions/19739001/what-is-the-difference-between-srcdoc-and-src-datatext-html-in-an
     * 1. using srcdoc
     * 2. using src with dataurl:
     *    easy to share
     *    length limit (Data URIs cannot be larger than 32,768 characters.)
     */

    useEffect(() => {
      const handleMessage = (e: any) => {
        const { id, height, title } = e.data;
        setTitle(title);
        if (id == frameId) {
          setIframeHeight(height);
        }
      };
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, [frameId, setIframeHeight]);

    useImperativeHandle(ref, () => ({
      reload: () => {
        setFrameId(nanoid());
      },
    }));

    const height = useMemo(() => {
      if (!props.autoHeight) return props.height || 600;
      if (typeof props.height === "string") {
        return props.height;
      }
      const parentHeight = props.height || 600;
      return iframeHeight + 40 > parentHeight
        ? parentHeight
        : iframeHeight + 40;
    }, [props.autoHeight, props.height, iframeHeight]);

    const srcDoc = useMemo(() => {
      const script = `<script>window.addEventListener("DOMContentLoaded", () => new ResizeObserver((entries) => parent.postMessage({id: '${frameId}', height: entries[0].target.clientHeight}, '*')).observe(document.body))</script>`;
      if (props.code.includes("<!DOCTYPE html>")) {
        props.code.replace("<!DOCTYPE html>", "<!DOCTYPE html>" + script);
      }
      return script + props.code;
    }, [props.code, frameId]);

    const handleOnLoad = () => {
      if (props?.onLoad) {
        props.onLoad(title);
      }
    };

    return (
      <iframe
        className={styles["artifacts-iframe"]}
        key={frameId}
        ref={iframeRef}
        sandbox="allow-forms allow-modals allow-scripts"
        style={{ height }}
        srcDoc={srcDoc}
        onLoad={handleOnLoad}
      />
    );
  },
);

export function ArtifactsPrintButton({
  getCode,
  style,
  fileName,
}: {
  getCode: () => string;
  style?: any;
  fileName?: string;
}) {
  const [loading, setLoading] = useState(false);

  const printArtifacts = () => {
    if (loading) return;

    setLoading(true);
    const code = getCode();

    if (!code) {
      showToast("没有可打印的内容");
      setLoading(false);
      return;
    }

    try {
      // 创建一个新的窗口用于打印
      const printWindow = window.open("", "_blank", "width=1000,height=700");
      if (!printWindow) {
        showToast("无法打开打印窗口，请检查浏览器设置");
        setLoading(false);
        return;
      }

      // 构建打印内容
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>LLMChat Artifacts - ${fileName || "打印页面"}</title>
            <meta charset="utf-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: #f8fafc;
                padding: 20px;
                line-height: 1.6;
                color: #334155;
              }
              
              .print-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                overflow: hidden;
                border: 1px solid #e2e8f0;
              }
              
              .print-header {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                padding: 30px;
                text-align: center;
                position: relative;
              }
              
              .print-title {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
              }
              
              .print-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin-bottom: 4px;
              }
              
              .print-time {
                font-size: 14px;
                opacity: 0.8;
              }
              
              .print-content {
                padding: 40px;
                background: white;
              }
              
              .code-container {
                background: #1e293b;
                border-radius: 8px;
                padding: 24px;
                margin: 20px 0;
                overflow-x: auto;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .code-content {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
                line-height: 1.5;
                color: #e2e8f0;
                white-space: pre-wrap;
                word-break: break-word;
              }
              
              .html-content {
                border: 2px dashed #cbd5e1;
                border-radius: 8px;
                padding: 24px;
                margin: 20px 0;
                background: #f1f5f9;
              }
              
              .html-content iframe {
                width: 100%;
                min-height: 400px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: white;
              }
              
              .print-footer {
                background: #f8fafc;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #64748b;
              }
              
              .print-footer a {
                color: #4f46e5;
                text-decoration: none;
                font-weight: 500;
              }
              
              .print-footer a:hover {
                text-decoration: underline;
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin: 20px 0;
                padding: 20px;
                background: #f1f5f9;
                border-radius: 8px;
              }
              
              .info-item {
                text-align: center;
              }
              
              .info-label {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .info-value {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
              }
              
              @media print {
                body {
                  background: white !important;
                  padding: 0 !important;
                }
                
                .print-container {
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                }
                
                .print-header {
                  background: #4f46e5 !important;
                  color: white !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .code-container {
                  background: #1e293b !important;
                  color: #e2e8f0 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .html-content {
                  border: 2px dashed #cbd5e1 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              
              @media (max-width: 768px) {
                body {
                  padding: 10px;
                }
                
                .print-header {
                  padding: 20px;
                }
                
                .print-title {
                  font-size: 24px;
                }
                
                .print-content {
                  padding: 20px;
                }
                
                .code-container {
                  padding: 16px;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="print-header">
                <div class="print-title">
                  🎨 LLMChat Artifacts
                </div>
                <div class="print-subtitle">智能代码生成与预览</div>
                <div class="print-time">打印时间：${new Date().toLocaleString()}</div>
              </div>
              
              <div class="print-content">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">页面标题</div>
                    <div class="info-value">${fileName || "未命名页面"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">代码长度</div>
                    <div class="info-value">${code.length} 字符</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">内容类型</div>
                    <div class="info-value">${
                      code.includes("<!DOCTYPE html>") || code.includes("<html")
                        ? "HTML页面"
                        : "代码片段"
                    }</div>
                  </div>
                </div>
                
                <h3>📄 页面源代码</h3>
                <div class="code-container">
                  <pre class="code-content">${code
                    .replace(/</g, "<")
                    .replace(/>/g, ">")}</pre>
                </div>
                
                <h3>🌐 页面预览</h3>
                <div class="html-content">
                  <p><em>注意：由于打印限制，动态内容可能无法完全展示。建议在实际浏览器中查看完整效果。</em></p>
                  <iframe srcdoc="${code.replace(
                    /"/g,
                    '"',
                  )}" sandbox="allow-forms allow-modals allow-scripts"></iframe>
                </div>
              </div>
              
              <div class="print-footer">
                <p>由 <a href="https://github.com/zyqfork/llmchat" target="_blank">LLMChat</a> 生成</p>
                <p>© ${new Date().getFullYear()} - 保留所有权利</p>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                // 添加淡入动画
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.5s ease';
                
                setTimeout(function() {
                  document.body.style.opacity = '1';
                }, 100);
                
                // 延迟打印以确保样式和iframe加载完成
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 3000);
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      showToast("正在准备打印...");

      setTimeout(() => {
        setLoading(false);
      }, 3000);
    } catch (error) {
      console.error("[Print Artifacts] ", error);
      showToast("打印失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div className="window-action-button" style={style}>
      <IconButton
        icon={loading ? <LoadingButtonIcon /> : <ShareIcon />}
        bordered
        title="打印页面"
        onClick={printArtifacts}
      />
    </div>
  );
}

export function Artifacts() {
  const { id } = useParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const previewRef = useRef<HTMLPreviewHander>(null);

  useEffect(() => {
    if (id) {
      fetch(`${ApiPath.Artifacts}?id=${id}`)
        .then((res) => {
          if (res.status > 300) {
            throw Error("can not get content");
          }
          return res;
        })
        .then((res) => res.text())
        .then(setCode)
        .catch((e) => {
          showToast(Locale.Export.Artifacts.Error);
        });
    }
  }, [id]);

  return (
    <div className={styles["artifacts"]}>
      <div className={styles["artifacts-header"]}>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <IconButton bordered icon={<GithubIcon />} shadow />
        </a>
        <IconButton
          bordered
          style={{ marginLeft: 20 }}
          icon={<ReloadButtonIcon />}
          shadow
          onClick={() => previewRef.current?.reload()}
        />
        <div className={styles["artifacts-title"]}>LLMChat Artifacts</div>
        <ArtifactsPrintButton getCode={() => code} fileName={fileName} />
        {code && (
          <HTMLPreviewModal code={code} title={fileName || "Artifacts 预览"} />
        )}
      </div>
      <div className={styles["artifacts-content"]}>
        {loading && <Loading />}
        {code && (
          <HTMLPreview
            code={code}
            ref={previewRef}
            autoHeight={false}
            height={"100%"}
            onLoad={(title) => {
              setFileName(title as string);
              setLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
