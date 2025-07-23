import React from "react";
import styles from "./home.module.scss";
import { IconButton } from "./button";
import { Modal } from "./ui-lib";
import AddIcon from "../icons/add.svg";
import SettingsIcon from "../icons/settings.svg";
import { useChatStore } from "../store";
import { useMaskStore } from "../store/mask";
import { useAppConfig } from "../store/config";
import { MaskAvatar } from "./mask";
import Locale, { ALL_LANG_OPTIONS } from "../locales";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import {
  getMaskEffectiveModel,
  getMaskDisplayModel,
} from "../utils/model-resolver";

interface MaskListProps {
  onClose: () => void;
}

export function MaskList(props: MaskListProps) {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const appConfig = useAppConfig();
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

    // 检查该面具下是否有话题
    const maskSessions = chatStore.getSessionsByMask(maskId);
    if (maskSessions.length === 0) {
      // 如果没有话题，创建一个新话题
      const selectedMask = allMasks.find((m) => m.id === maskId);
      if (selectedMask) {
        // 使用该面具创建新session
        chatStore.newSession(selectedMask);
        // 导航到聊天页面
        navigate("/chat");
      }
    } else {
      // 如果有话题，切换到最新的话题（按创建时间排序的第一个）
      const latestSession = maskSessions.sort(
        (a, b) => b.lastUpdate - a.lastUpdate,
      )[0];
      const sessionIndex = chatStore.sessions.findIndex(
        (s) => s.id === latestSession.id,
      );
      if (sessionIndex !== -1) {
        chatStore.selectSession(sessionIndex);
        // 导航到聊天页面
        navigate("/chat");
      }
    }

    props.onClose();
  };

  const handleCreateMask = () => {
    // 跳转到面具创建页面
    navigate(Path.Masks);
    props.onClose();
  };

  const handleMaskManagement = () => {
    // 跳转到面具管理页面
    navigate(Path.Masks);
    props.onClose();
  };

  return (
    <div
      className="modal-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className={styles["mask-list-modal-container"]}>
        <Modal
          title={Locale.Mask.Name}
          onClose={props.onClose}
          actions={[
            <IconButton
              key="manage"
              icon={<SettingsIcon />}
              text="面具管理"
              onClick={handleMaskManagement}
              bordered
            />,
            <IconButton
              key="add"
              icon={<AddIcon />}
              text="新建面具"
              onClick={handleCreateMask}
              bordered
            />,
          ]}
        >
          <div className={styles["mask-list-content"]}>
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
                    model={getMaskEffectiveModel(mask)}
                  />
                </div>
                <div className={styles["mask-item-info"]}>
                  <div className={styles["mask-item-name"]}>{mask.name}</div>
                  <div className={styles["mask-item-desc"]}>
                    {`${Locale.Mask.Item.Info(mask.context.length)} / ${
                      ALL_LANG_OPTIONS[mask.lang]
                    } / ${getMaskEffectiveModel(mask)} / ${
                      chatStore.getSessionsByMask(mask.id).length
                    } 个对话`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </div>
  );
}
