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
    const { highlightKeywords } = this.config;
    const dataString = data.toString();

    const occurrences: {
      start: number;
      end: number;
      fg?: number;
      bg?: number;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      dim?: boolean;
    }[] = [];

    for (const keyword of highlightKeywords) {
      const {
        text,
        enabled,
        isRegExp = false,
        isCaseSensitive = false,
        foreground = false,
        foregroundColor = 0,
        background = false,
        backgroundColor = 1,
        bold = false,
        italic = false,
        underline = false,
        dim = false,
      } = keyword;

      // 未启用的关键字直接跳过喵
      if (!enabled) {
        continue;
      }

      const regexpFlag = `g${isCaseSensitive ? "" : "i"}`;

      let pattern: RegExp;
      try {
        // 不管是字符串还是正则，通通用正则来匹配，只不过对于字符串需要一丢丢特殊处理，不然会寄喵
        pattern = isRegExp
          ? new RegExp(`${text}`, regexpFlag)
          : new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), regexpFlag);
      } catch (e) {
        // 象征性的捕获并忽略一下错误喵
        this.toast(
          "[Highlight] Something wrong when creating RegExp, please check highlight settings"
        );
        this.logger.error(e.message);
        return super.feedFromSession(data);
      }
      const matches = dataString.matchAll(pattern);

      for (const match of matches) {
        occurrences.push({
          start: match.index,
          end: match.index + match[0].length - 1,
          fg: foreground ? foregroundColor : undefined,
          bg: background ? backgroundColor : undefined,
          bold,
          italic,
          underline,
          dim,
        });
      }
    }

    // 如果没有匹配则直接返回，也许能提升一丢丢性能也不一定
    if (occurrences.length === 0) {
      return super.feedFromSession(data);
    }

    // 改为按字符匹配的逻辑，可以解决嵌套问题喵，但……也许有性能问题也不一定(> <)，先就酱喵
    let newDataString = "";
    for (let i = 0; i < dataString.length; i++) {
      // 改来改去越来越复杂喵，性能蹭蹭下降喵，建议去用隔壁ElecTerm，自带高亮喵~
      const subString = dataString.slice(i);
      const csiSequenceMatch = subString.match(/\x1b\[[0-9;?]*[a-zA-Z]/);
      if (csiSequenceMatch) {
        if (csiSequenceMatch.index === 0) {
          i += csiSequenceMatch[0].length - 1;
          newDataString += csiSequenceMatch[0];
          continue;
        }
      }
      const oscSequenceMatch = subString.match(
        /\x1b\](?:[^\x07\x1b]*|\x1b(?:[^[\x07]|$))*[\x07\x1b]/
      );
      if (oscSequenceMatch) {
        if (oscSequenceMatch.index === 0) {
          i += oscSequenceMatch[0].length - 1;
          newDataString += oscSequenceMatch[0];
          continue;
        }
      }

      let char = subString[0];
      for (const occurrence of occurrences) {
        const { start, end, bg, fg, bold, italic, underline, dim } = occurrence;
        if (i >= start && i <= end) {
          const beginSeq: string[] = [];
          const endSeq: string[] = [];

          if (fg) {
            beginSeq.push(`38;5;${fg}`);
            endSeq.push(`39`);
          }
          if (bg) {
            beginSeq.push(`48;5;${bg}`);
            endSeq.push(`49`);
          }
          if (bold) {
            beginSeq.push(`1`);
            endSeq.push(`22`);
          }
          if (italic) {
            beginSeq.push(`3`);
            endSeq.push(`23`);
          }
          if (underline) {
            beginSeq.push(`4`);
            endSeq.push(`24`);
          }
          if (dim) {
            beginSeq.push(`2`);
            endSeq.push(`22`);
          }
          char = `\x1b[${beginSeq.join(";")}m${char}\x1b[${endSeq.join(";")}m`;
          break;
        }
      }

      newDataString += char;
    }

    const newData = Buffer.from(newDataString);
    super.feedFromSession(newData);
  }

  close(): void {
    super.close();
  }
}
