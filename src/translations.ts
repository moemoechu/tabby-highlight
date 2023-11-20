type HighlightPluginTranslations = Record<string, string>;

export const translations: [string, HighlightPluginTranslations][] = [
  [
    "zh-CN",
    {
      "Highlight": "高亮",
      "Enable highlight": "启用高亮",
      "Highlight master switch": "高亮总开关",
      "Change any setting of highlight only apply in new sessions.":
        "任何对高亮设置的修改只会应用到新会话。",
      "Highlight applied!": "高亮已应用！",
      "ON": "开",
      "Keyword": "关键字",
      "#FG": "前景色",
      "#BG": "背景色",
      "DEL": "删除",
      "RegExp": "正则",
      "Case sensitive": "区分大小写",
      "Only apply to RegExp": "仅适用于正则表达式",
      "[Highlight] Something wrong in creating RegExp, please view logs at DevTool":
        "[高亮] 创建正则表达式时出现错误，请查看开发者工具的日志",
    },
  ],
];
