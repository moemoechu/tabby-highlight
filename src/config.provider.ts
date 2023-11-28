import { ConfigProvider } from "tabby-core";

export type HighlightProfile = {
  name: string;
  keywords: HighlightKeyword[];
};
export type HighlightKeyword = {
  text: string;
  enabled: boolean;
  isRegExp?: boolean;
  isCaseSensitive?: boolean;
  foreground?: boolean;
  foregroundColor?: string;
  background: boolean;
  backgroundColor: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;
};

export type HighlightPluginConfig = {
  highlightEnabled: boolean;
  highlightMode: "xterm-control-sequence";
  highlightCurrentProfile: number;
  highlightProfiles: HighlightProfile[];
  highlightKeywords?: HighlightKeyword[];
};

/** @hidden */
export class HighlightConfigProvider extends ConfigProvider {
  defaults: { highlightPlugin: HighlightPluginConfig } = {
    highlightPlugin: {
      highlightEnabled: false,
      highlightMode: "xterm-control-sequence",
      highlightCurrentProfile: 0,
      highlightKeywords: null,
      highlightProfiles: [
        {
          name: "Default",
          keywords: [
            {
              text: "ERROR",
              enabled: true,
              background: true,
              backgroundColor: "1",
            },
            {
              text: "WARN",
              enabled: true,
              background: true,
              backgroundColor: "3",
            },
            {
              text: "INFO",
              enabled: true,
              background: true,
              backgroundColor: "6",
            },
            {
              text: "错误",
              enabled: true,
              background: true,
              backgroundColor: "1",
            },
            {
              text: "警告",
              enabled: true,
              background: true,
              backgroundColor: "3",
            },
            {
              text: "信息",
              enabled: true,
              background: true,
              backgroundColor: "6",
            },
          ],
        },
      ],
    },
  };
}
