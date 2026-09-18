import {
  getModelCompressThreshold,
  isStaleSilentCompressThreshold,
} from "../config/model-config";
import { useAppConfig } from "../store/config";
import { useChatStore } from "../store";

function shouldReplaceFixed(fixed: number | undefined, autoThreshold: number) {
  return !fixed || isStaleSilentCompressThreshold(fixed, autoThreshold);
}

/**
 * 配置/变更模型上下文后，把仍停留在陈旧默认阈值的全局与会话配置同步为自动阈值。
 * @returns 计算出的自动阈值；上下文未知或动态关闭时为 null
 */
export function applyCompressThresholdSyncForModel(
  modelName: string,
): number | null {
  const configStore = useAppConfig.getState();
  const ratio = configStore.modelConfig.compressThresholdRatio ?? 0.9;
  const autoThreshold = getModelCompressThreshold(modelName, ratio);
  if (autoThreshold == null) return null;

  if (configStore.modelConfig.model === modelName) {
    const globalFixed = configStore.modelConfig.compressMessageLengthThreshold;
    if (shouldReplaceFixed(globalFixed, autoThreshold)) {
      configStore.update((c) => {
        c.modelConfig.compressMessageLengthThreshold = autoThreshold;
      });
    }
  }

  const chatStore = useChatStore.getState();
  chatStore.sessions.forEach((session) => {
    if (session.mask?.modelConfig?.model !== modelName) return;
    const fixed = session.mask.modelConfig.compressMessageLengthThreshold;
    if (!shouldReplaceFixed(fixed, autoThreshold)) return;
    chatStore.updateTargetSession(session, (s) => {
      s.mask.modelConfig.compressMessageLengthThreshold = autoThreshold;
    });
  });

  return autoThreshold;
}
