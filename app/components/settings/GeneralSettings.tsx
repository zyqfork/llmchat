/**
 * 通用设置组件 - 拆分自 Settings
 */
import React from "react";
import { List, ListItem } from "../ui-lib";
import Locale from "../../locales";
import { useAppConfig } from "../../store";

export const GeneralSettings = React.memo(function GeneralSettings() {
  const config = useAppConfig();

  return (
    <List>
      <ListItem title={Locale.Settings.Lang.Name}>{/* 语言选择器 */}</ListItem>
      <ListItem title={Locale.Settings.Avatar}>{/* 头像选择器 */}</ListItem>
      <ListItem title={Locale.Settings.Theme}>{/* 主题选择器 */}</ListItem>
      <ListItem title={Locale.Settings.FontSize.Title}>
        {/* 字体大小 */}
      </ListItem>
      {/* 更多通用设置... */}
    </List>
  );
});
