import React, { useEffect, useState } from "react";
import { logger } from "../../utils/logger";
import styles from "../chat.module.scss";

export function ImagePreviewModal(props: {
  show: boolean;
  src: string;
  onClose: () => void;
}) {
  const { show, src, onClose } = props;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setImageLoaded(false);
      setImageError(false);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [show, onClose]);

  if (!show || !src) return null;

  return (
    <div className={styles["image-preview-modal"]} onClick={onClose}>
      <div className={styles["image-preview-backdrop"]} />
      <div className={styles["image-preview-content"]}>
        {!imageLoaded && !imageError && (
          <div
            style={{
              color: "white",
              fontSize: "16px",
              zIndex: 10001,
              position: "relative",
            }}
          >
            加载中...
          </div>
        )}
        {imageError && (
          <div
            style={{
              color: "white",
              fontSize: "16px",
              zIndex: 10001,
              position: "relative",
            }}
          >
            图片加载失败
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Preview"
          className={styles["image-preview-img"]}
          onClick={(e) => e.stopPropagation()}
          onError={() => {
            logger.error("Image failed to load:", src);
            setImageError(true);
          }}
          onLoad={() => {
            logger.debug("Image loaded successfully:", src);
            setImageLoaded(true);
          }}
        />
      </div>
    </div>
  );
}
