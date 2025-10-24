/**
 * 模型设置组件 - 拆分自 Settings
 */
import React from "react";
import { List, ListItem } from "../ui-lib";
import Locale from "../../locales";
import { useAccessStore } from "../../store";

export const ModelSettings = React.memo(function ModelSettings() {
  const accessStore = useAccessStore();

  return (
    <List>
      <ListItem title={Locale.Settings.Model}>{/* 模型选择器 */}</ListItem>
      <ListItem title={Locale.Settings.Temperature.Title}>
        {/* 温度设置 */}
      </ListItem>
      <ListItem title={Locale.Settings.MaxTokens.Title}>
        {/* Max Tokens */}
      </ListItem>
      {/* 更多模型设置... */}
    </List>
  );
});
