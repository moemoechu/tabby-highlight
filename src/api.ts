import { BaseTerminalTabComponent } from "tabby-terminal";

export type HighlightProfile = {
  id: string;
  name: string;
  keywords: HighlightKeyword[];
};
export type HighlightKeyword = {
  text: string;
  enabled: boolean;
  isJS?: boolean;
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
  isJS?: boolean;
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

// Single number, highlight chars at giving index: [1, 3, 5] // highlight chars at 1, 3, 5
// Ranges, highlight chars at giving range: [[1, 3], [5, 8]] // highlight chars at 1-3, 5-8
// Mixed: [1, 3, 5, [8-10]] // highlight chars at 1, 3, 5, 8-10
// Normal string: "abc" // highlight abc
// Regexp string: ".*?": "(.*?)" // using string to create a regexp
// Regexp: /".*?": "(.*?)"/gd // using regexp to highlight, gd flag is required
export type HighlightJSFunctionResultType = (number | [number, number])[] | string | RegExp;

// Normal string: "aaa" // replace input to aaa
// [normal string ,normal string]: [ "aaa", "bbb" ] // replace aaa to bbb
// [regexp string ,normal string]: [ "aaa(.*)", "bbb$1" ] // using first string to create Regexp and replace to second pattern
// [regexp, normal string]: [/aaa(.*)/, "bbb$1"] // using first Regexp and replace to second pattern
export type ReplaceJSFunctionResultType = string | [string | RegExp, string];
