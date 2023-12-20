import { ConfigProvider } from "tabby-core";

export type HighlightProfile = {
  id: string;
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
  highlightCurrentProfile: string;
  highlightProfiles: HighlightProfile[];
  highlightPerSessionEnabled: boolean;
  highlightPerSessionProfileMap: { sessionId: string; profileId: string }[];
  highlightPerSessionGroupEnabled: boolean;
  highlightPerSessionGroupProfileMap: { groupId: string; profileId: string }[];
  highlightPerSessionTypeEnabled: boolean;
  highlightPerSessionTypeProfileMap: { typeId: string; profileId: string }[];
  highlightGlobalEnabled: boolean;
  highlightKeywords?: HighlightKeyword[]; //废弃喵
  replaceCurrentProfile: number;
  replaceProfiles: any;
};

/** @hidden */
export class HighlightConfigProvider extends ConfigProvider {
  defaults: { highlightPlugin: HighlightPluginConfig } = {
    highlightPlugin: {
      highlightEnabled: false,
      highlightMode: "xterm-control-sequence",
      highlightCurrentProfile: "60606be0-c0ff-42bc-bf77-de8a2435447f",
      highlightKeywords: null, //废弃喵
      highlightProfiles: [
        {
          id: "60606be0-c0ff-42bc-bf77-de8a2435447f",
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

      highlightPerSessionEnabled: false,
      highlightPerSessionProfileMap: [],
      highlightPerSessionGroupEnabled: false,
      highlightPerSessionGroupProfileMap: [],
      highlightPerSessionTypeEnabled: false,
      highlightPerSessionTypeProfileMap: [],
      highlightGlobalEnabled: true,
      replaceCurrentProfile: 0,
      replaceProfiles: [],
    },
  };
}
