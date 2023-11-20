import { Logger } from "tabby-core";
import { BaseTerminalTabComponent, SessionMiddleware } from "tabby-terminal";
import { HighlightPluginConfig } from "./configProvider";

// code by chatGPT >w<
function replaceCharacter(
  inputString: string,
  characterToReplace: string | RegExp,
  replacementCharacter: string
) {
  // 匹配控制序列的正则表达式模式
  const controlSequencePattern = /\x1b\[[0-9;]*[a-zA-Z]/g;

  // 匹配OSC序列的正则表达式模式
  const oscSequencePattern = /\x1b\](?:[^\x07\x1b]*|\x1b(?:[^[\x07]|$))*[\x07\x1b]/g;

  // 从输入字符串中提取控制序列和OSC序列
  const controlSequences = inputString.match(controlSequencePattern);
  const oscSequences = inputString.match(oscSequencePattern);

  // 临时替换控制序列和OSC序列
  let tempString = inputString.replace(controlSequencePattern, "__CONTROL_SEQUENCE__");
  tempString = tempString.replace(oscSequencePattern, "__OSC_SEQUENCE__");

  // 替换指定字符
  let replacedString = tempString.replaceAll(characterToReplace, replacementCharacter);

  // 还原控制序列和OSC序列
  if (controlSequences) {
    for (let i = 0; i < controlSequences.length; i++) {
      replacedString = replacedString.replace("__CONTROL_SEQUENCE__", controlSequences[i]);
    }
  }
  if (oscSequences) {
    for (let j = 0; j < oscSequences.length; j++) {
      replacedString = replacedString.replace("__OSC_SEQUENCE__", oscSequences[j]);
    }
  }

  return replacedString;
}

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
    // console.log([dataString]);
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
      const seq: string[] = [];

      if (foreground) {
        seq.push(`38;5;${foregroundColor}`);
      }
      if (background) {
        seq.push(`48;5;${backgroundColor}`);
      }
      if (bold) {
        seq.push(`5`);
      }
      if (seq.length === 0) {
        continue;
      }

      try {
        let characterToReplace = isRegExp
          ? new RegExp(`(${text})`, `g${highlightCaseSensitive ? "" : "i"}`)
          : text;
        let replacementCharacter = isRegExp
          ? `\x1b[${seq.join(";")}m$1\x1b[0m`
          : `\x1b[${seq.join(";")}m${text}\x1b[0m`;
        // dataString = dataString.replaceAll(text, `\x1b[${seq.join(";")}m${text}\x1b[0m`);
        dataString = replaceCharacter(dataString, characterToReplace, replacementCharacter);
      } catch (e) {
        this.logger.error(e.message);
        this.toast("[Highlight] Something wrong in creating RegExp, please view logs at DevTool");
      }
    }

    // console.log([dataString]);
    data = Buffer.from(dataString);
    super.feedFromSession(data);
  }

  close(): void {
    super.close();
  }
}
