import { Logger } from "tabby-core";
import { BaseTerminalTabComponent, SessionMiddleware } from "tabby-terminal";
import { HighlightPluginConfig } from "./configProvider";

export default class HighlightMiddleware extends SessionMiddleware {
  tab: BaseTerminalTabComponent<any>;
  config: HighlightPluginConfig;
  logger: Logger;
  toast: Function;

  constructor(
    tab: BaseTerminalTabComponent<any>,
    config: HighlightPluginConfig,
    logger?: Logger,
    toast?: Function
  ) {
    super();
    this.tab = tab;
    this.config = config;
    this.logger = logger;
    this.toast = toast;
  }

  feedFromSession(data: Buffer): void {
    const { highlightCaseSensitive, highlightKeywords } = this.config;
    let dataString = data.toString();

    // 匹配控制序列的正则表达式模式
    const controlSequencePattern = /\x1b\[[0-9;]*[a-zA-Z]/g;
    const controlSequenceReplace = "__CCCOOONNN_SSSEEEQQQ__";

    // 匹配OSC序列的正则表达式模式
    const oscSequencePattern = /\x1b\](?:[^\x07\x1b]*|\x1b(?:[^[\x07]|$))*[\x07\x1b]/g;
    const oscSequenceReplace = "__OOOSSSCCC_SSSEEEQQQ__";

    const endSeq = "\x1b[0m";

    // 从输入字符串中提取控制序列和OSC序列
    const controlSequences = dataString.match(controlSequencePattern);
    const oscSequences = dataString.match(oscSequencePattern);

    // 临时替换控制序列和OSC序列
    let tempString = dataString.replace(controlSequencePattern, controlSequenceReplace);
    tempString = tempString.replace(oscSequencePattern, oscSequenceReplace);

    const occurrences: { start: number; end: number; fg?: number; bg?: number }[] = [];
    for (const keyword of highlightKeywords) {
      const {
        text,
        enabled,
        isRegExp = false,
        foreground = false,
        foregroundColor = 0,
        background = false,
        backgroundColor = 1,
        bold = false,
      } = keyword;
      if (!enabled) {
        continue;
      }

      // const matches = [];

      const pattern = isRegExp
        ? new RegExp(`(${text})`, `g${highlightCaseSensitive ? "" : "i"}`)
        : new RegExp(
            text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            `g${highlightCaseSensitive ? "" : "i"}`
          );

      const matches = tempString.matchAll(pattern);

      for (const match of matches) {
        occurrences.push({
          start: match.index,
          end: match.index + match[0].length - 1,
          fg: foreground ? foregroundColor : undefined,
          bg: background ? backgroundColor : undefined,
        });
      }
    }

    let newDataString = "";
    for (let i = 0; i < tempString.length; i++) {
      let char = tempString[i];
      for (const occurrence of occurrences) {
        const { start, end, bg, fg } = occurrence;
        if (i >= start && i <= end) {
          const seq: string[] = [];
          if (fg) {
            seq.push(`38;5;${fg}`);
          }
          if (bg) {
            seq.push(`48;5;${bg}`);
          }
          // if (bold) {
          //   seq.push(`5`);
          // }
          char = `\x1b[${seq.join(";")}m${char}${endSeq}`;
          break;
        }
      }

      newDataString += char;
    }

    // 还原控制序列和OSC序列
    if (controlSequences) {
      for (let i = 0; i < controlSequences.length; i++) {
        newDataString = newDataString.replace(controlSequenceReplace, controlSequences[i]);
      }
    }
    if (oscSequences) {
      for (let j = 0; j < oscSequences.length; j++) {
        newDataString = newDataString.replace(oscSequenceReplace, oscSequences[j]);
      }
    }

    data = Buffer.from(newDataString);
    super.feedFromSession(data);
  }

  close(): void {
    super.close();
  }
}
