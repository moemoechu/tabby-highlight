import { ConfigProvider } from "tabby-core";

export type HighlightKeyword = {
  text: string;
  enabled: boolean;
  isRegExp?: boolean;
  foreground?: boolean;
  foregroundColor?: number;
  background?: boolean;
  backgroundColor?: number;
  bold?: boolean;
};

export type HighlightPluginConfig = {
  highLightEnabled: boolean;
  highlightMode: "xterm-control-sequence";
  highlightKeywords: HighlightKeyword[];
};

/** @hidden */
export class HighlightConfigProvider extends ConfigProvider {
  defaults: { highlightPlugin: HighlightPluginConfig } = {
    highlightPlugin: {
      highLightEnabled: false,
      highlightMode: "xterm-control-sequence",
      highlightKeywords: [
        {
          text: "ERROR",
          enabled: true,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 1,
        },
        {
          text: "WARN",
          enabled: true,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 3,
        },
        {
          text: "INFO",
          enabled: true,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 6,
        },
        {
          text: "错误",
          enabled: true,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 1,
        },
        {
          text: "警告",
          enabled: true,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 3,
        },
        {
          text: "信息",
          enabled: true,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 6,
        },
      ],
    },
  };
}
