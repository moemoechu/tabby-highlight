import { BaseTerminalTabComponent } from "tabby-terminal";

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
  underlineStyle?: string;
  inverse?: boolean;
  invisible?: boolean;
  dim?: boolean;
  isMatchGroup?: boolean;
  matchGroup?: string;
  remark?: string;
};

export type ReplaceProfile = {
  id: string;
  name: string;
  patterns: ReplacePattern[];
};

export type ReplacePattern = {
  enabled: boolean;
  isRegExp?: boolean;
  isCaseSensitive?: boolean;
  search: string;
  replace: string;
};

export type HighlightPluginConfig = {
  highlightEnabled: boolean;
  highlightAlternateDisable: boolean;
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
  replaceEnabled: boolean;
  replaceAlternateDisable: boolean;
  replaceCurrentProfile: string;
  replaceProfiles: ReplaceProfile[];
  advanced: {
    debug?: boolean;
    debugTerminalOutput?: boolean;
    debugPluginOutput?: boolean;
    debugMatch?: boolean;
  };
};

export type HighlightEngagedTab = BaseTerminalTabComponent<any> & {
  highlightProfile?: HighlightProfile;
  replaceProfile?: ReplaceProfile;
};
