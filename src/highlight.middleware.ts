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
    // console.log("begin");
    // console.log([dataString]);

    // 匹配控制序列的正则表达式模式
    // const controlSequencePattern = /\x1b\[[0-9;]*[a-zA-Z]/g;
    // const controlSequenceReplace = "__CCCOOONNN_SSSEEEQQQ__";
    // const controlSequenceReplaceLength = controlSequenceReplace.length;

    // 匹配OSC序列的正则表达式模式
    // const oscSequencePattern = /\x1b\](?:[^\x07\x1b]*|\x1b(?:[^[\x07]|$))*[\x07\x1b]/g;
    // const oscSequenceReplace = "__OOOSSSCCC_SSSEEEQQQ__";
    // const oscSequenceReplaceLength = oscSequenceReplace.length;

    // const endSeq = "\x1b[0m";

    // 从输入字符串中提取控制序列和OSC序列
    // const controlSequences = dataString.match(controlSequencePattern);
    // const oscSequences = dataString.match(oscSequencePattern);

    // 临时替换控制序列和OSC序列
    // const tempString = dataString
    //   .replace(controlSequencePattern, controlSequenceReplace)
    //   .replace(oscSequencePattern, oscSequenceReplace);
    const tempString = dataString;

    // console.log([tempString]);
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
      const matches = tempString.matchAll(pattern);

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
    for (let i = 0; i < tempString.length; i++) {
      // 改来改去越来越复杂喵，性能蹭蹭下降喵，建议去用隔壁ElecTerm，自带高亮喵~
      const subString = tempString.slice(i);
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

      // 喵喵喵，解决讨厌的乱码问题喵
      // if (char === "_") {
      //   if (tempString.slice(i, i + controlSequenceReplaceLength) === controlSequenceReplace) {
      //     i += controlSequenceReplaceLength - 1;
      //     newDataString += controlSequenceReplace;
      //     continue;
      //   } else if (tempString.slice(i, i + oscSequenceReplaceLength) === oscSequenceReplace) {
      //     i += oscSequenceReplaceLength - 1;
      //     newDataString += oscSequenceReplace;
      //     continue;
      //   }
      // }

      // if (char === "\x1b") {
      //   conFlag = true;
      //   newDataString += char;
      //   continue;
      // } else if (conFlag === true) {
      //   if (char.match(/[A-Za-z\x07]/)) {
      //     conFlag = false;
      //   }
      //   newDataString += char;
      //   continue;
      // }

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

    // console.log([newDataString]);
    // 还原控制序列和OSC序列
    // if (controlSequences) {
    //   for (let i = 0; i < controlSequences.length; i++) {
    //     newDataString = newDataString.replace(controlSequenceReplace, controlSequences[i]);
    //   }
    // }
    // if (oscSequences) {
    //   for (let j = 0; j < oscSequences.length; j++) {
    //     newDataString = newDataString.replace(oscSequenceReplace, oscSequences[j]);
    //   }
    // }

    // console.log([newDataString]);
    // console.log("end");
    const newData = Buffer.from(newDataString);
    super.feedFromSession(newData);
  }

  close(): void {
    super.close();
  }
}
