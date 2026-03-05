import { Mask } from "../store/mask";
import { CN_MASKS } from "./cn";
import { EN_MASKS } from "./en";
import { BuiltinMask } from "./typing";
import { nanoid } from "nanoid";
import { getLang } from "../locales";
import { useAppConfig } from "../store/config";
import { getModelCompressThreshold } from "../config/model-config";

export { type BuiltinMask } from "./typing";

// 将 BuiltinMask 转换为完整的 Mask
function createMaskFromBuiltin(builtin: BuiltinMask, lang: "cn" | "en"): Mask {
  const globalConfig = useAppConfig.getState().modelConfig;

  return {
    id: `builtin-${nanoid()}`,
    createdAt: Date.now(),
    avatar: builtin.avatar,
    name: builtin.name,
    hideContext: builtin.hideContext,
    context: builtin.context.map((c) => ({
      ...c,
      id: nanoid(),
      date: c.date || "",
    })),
    syncGlobalConfig: true,
    modelConfig: {
      ...globalConfig,
      ...builtin.modelConfig,
      compressMessageLengthThreshold: getModelCompressThreshold(
        builtin.modelConfig?.model || globalConfig.model,
        builtin.modelConfig?.compressThresholdRatio ??
          globalConfig.compressThresholdRatio,
      ),
    },
    lang: lang === "cn" ? "cn" : "en",
    builtin: true,
    enableArtifacts: builtin.enableArtifacts,
    enableCodeFold: builtin.enableCodeFold,
  };
}

// 获取所有内置助手
export function getBuiltinMasks(): Mask[] {
  const lang = getLang();
  const isChinese = lang === "cn" || lang === "tw";

  const masks: Mask[] = [];

  // 根据语言优先显示对应的助手
  if (isChinese) {
    masks.push(
      ...CN_MASKS.map((m: BuiltinMask) => createMaskFromBuiltin(m, "cn")),
    );
    masks.push(
      ...EN_MASKS.map((m: BuiltinMask) => createMaskFromBuiltin(m, "en")),
    );
  } else {
    masks.push(
      ...EN_MASKS.map((m: BuiltinMask) => createMaskFromBuiltin(m, "en")),
    );
    masks.push(
      ...CN_MASKS.map((m: BuiltinMask) => createMaskFromBuiltin(m, "cn")),
    );
  }

  return masks;
}

// 导出所有内置助手定义
export const BUILTIN_MASKS = {
  cn: CN_MASKS,
  en: EN_MASKS,
};
