import { ConfigProvider } from "tabby-core";

export type HighlightKeyword = {
  text: string;
  enabled: boolean;
  isRegExp: boolean;
  foreground: boolean;
  foregroundColor: number;
  background: boolean;
  backgroundColor: number;
  bold: boolean;
};

export type HighlightPluginConfig = {
  highlightEnabled: boolean;
  highlightCaseSensitive: boolean;
  highlightMode: "xterm-control-sequence";
  highlightKeywords: HighlightKeyword[];
};

/** @hidden */
export class HighlightConfigProvider extends ConfigProvider {
  defaults: { highlightPlugin: HighlightPluginConfig } = {
    highlightPlugin: {
      highlightEnabled: false,
      highlightCaseSensitive: true,
      highlightMode: "xterm-control-sequence",
      highlightKeywords: [
        {
          text: "ERROR",
          enabled: true,
          isRegExp: false,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 1,
          bold: false,
        },
        {
          text: "WARN",
          enabled: true,
          isRegExp: false,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 3,
          bold: false,
        },
        {
          text: "INFO",
          enabled: true,
          isRegExp: false,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 6,
          bold: false,
        },
        {
          text: "错误",
          enabled: true,
          isRegExp: false,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 1,
          bold: false,
        },
        {
          text: "警告",
          enabled: true,
          isRegExp: false,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 3,
          bold: false,
        },
        {
          text: "信息",
          enabled: true,
          isRegExp: false,
          foreground: true,
          foregroundColor: 0,
          background: true,
          backgroundColor: 6,
          bold: false,
        },
      ],
    },
  };
}
