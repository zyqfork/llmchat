import React from "react";
import styles from "./home.module.scss";
import { IconButton } from "./button";
import AddIcon from "../icons/add.svg";
import { useChatStore } from "../store";
import { useMaskStore } from "../store/mask";
import { MaskAvatar } from "./mask";
import Locale from "../locales";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";

interface MaskListProps {
  onClose: () => void;
}

export function MaskList(props: MaskListProps) {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  // 获取所有可用的面具，默认面具排在最前面
  const allMasks = maskStore.getAll().sort((a, b) => {
    if (a.id === "default-mask") return -1;
    if (b.id === "default-mask") return 1;
    return 0;
  });
  const currentMaskId = chatStore.currentMaskId;

  const handleSelectMask = (maskId: string) => {
    // 选择面具
    chatStore.selectMask(maskId);
    props.onClose();
  };

  const handleCreateMask = () => {
    // 跳转到面具创建页面
    navigate(Path.Masks);
    props.onClose();
  };

  return (
    <div className="modal-mask">
      <div className={styles["mask-list-modal"]}>
        <div className={styles["mask-list-header"]}>
          <div className={styles["mask-list-title"]}>{Locale.Mask.Name}</div>
          <IconButton
            icon={<AddIcon />}
            text="新建面具"
            onClick={handleCreateMask}
            bordered
          />
        </div>

        <div className={styles["mask-list-body"]}>
          {allMasks.map((mask) => (
            <div
              key={mask.id}
              className={`${styles["mask-item"]} ${
                currentMaskId === mask.id ? styles["mask-item-selected"] : ""
              }`}
              onClick={() => handleSelectMask(mask.id)}
            >
              <div className={styles["mask-item-avatar"]}>
                <MaskAvatar
                  avatar={mask.avatar}
                  model={mask.modelConfig.model}
                />
              </div>
              <div className={styles["mask-item-info"]}>
                <div className={styles["mask-item-name"]}>{mask.name}</div>
                <div className={styles["mask-item-desc"]}>
                  {mask.context.length > 0
                    ? mask.context[0].content.slice(0, 50) + "..."
                    : "暂无描述"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles["mask-list-footer"]}>
          <IconButton text="取消" onClick={props.onClose} bordered />
        </div>
      </div>
    </div>
  );
}
