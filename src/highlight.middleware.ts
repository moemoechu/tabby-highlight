import { Injector } from "@angular/core";
import Color from "color";
import _ from "lodash";
import { ToastrService } from "ngx-toastr";
import { ConfigService, LogService, Logger, TranslateService } from "tabby-core";
import { SessionMiddleware } from "tabby-terminal";
import { inspect } from "util";
import { debounce } from "utils-decorators";
import {
  HighlightEngagedTab,
  HighlightJSFunctionResultType,
  HighlightPluginConfig,
  ReplaceJSFunctionResultType,
} from "./api";

export default class HighlightMiddleware extends SessionMiddleware {
  tab: HighlightEngagedTab;
  logger: Logger;
  toastr: ToastrService;
  translate: TranslateService;
  enterReplacer = "\r\n";
  config: ConfigService;
  get pluginConfig() {
    return this.config.store.highlightPlugin as HighlightPluginConfig;
  }

  constructor(injector: Injector, tab: HighlightEngagedTab) {
    super();
    this.tab = tab;
    this.logger = injector.get(LogService).create(`tabby-highlight`);
    this.toastr = injector.get(ToastrService);
    this.translate = injector.get(TranslateService);
    this.config = injector.get(ConfigService);

    // this.logger.info("HighlightMiddleware ctor.");

    // if (process.platform === "win32") {
    //   this.enterReplacer = "\r\n";
    // } else if (process.platform === "darwin") {
    //   this.enterReplacer = "\r";
    // } else {
    //   this.enterReplacer = "\n";
    // }
  }

  // 注意：本插件没有做过性能测试喵，不知道多少关键字是极限喵
  // PS：其实跑过cacafire，别问喵，问就是卡死了喵
  feedFromSession(data: Buffer): void {
    if (data.length === 0) {
      return super.feedFromSession(data);
    }
    const dataStringRaw = data.toString();
    // this.logger.debug(`raw string:`);
    // this.logger.debug(inspect(dataStringRaw));
    const dataStringSplitted = dataStringRaw.split(this.enterReplacer);

    const { highlightAlternateDisable, replaceAlternateDisable, advanced } = this.pluginConfig;
    const { debug, debugTerminalOutput, debugPluginOutput, debugMatch } = advanced;

    if (debug && debugTerminalOutput) {
      this.logger.debug(`raw terminal line:\n${inspect(dataStringRaw)}`);
    }

    const isAlternate = this.tab.alternateScreenActive;

    const dataStringArray: string[] = [];
    let passthroughFlag = true;
    for (let dataString of dataStringSplitted) {
      // let dataString = data.toString();

      const { highlightProfile, replaceProfile } = this.tab;
      let dataStringReplaced = dataString;

      if (replaceProfile && ((isAlternate && !replaceAlternateDisable) || !isAlternate)) {
        const { patterns } = replaceProfile;

        for (const pattern of patterns) {
          const { enabled, isJS, isCaseSensitive, isRegExp, search, replace } = pattern;
          if (!enabled) {
            continue;
          }
          passthroughFlag = false;

          let realSearch: string = search;
          let isReplaceJSReturnString = false;
          let searchPattern: RegExp;
          let replacePattern: string = replace;
          if (isJS) {
            let replaceFunc: Function;
            try {
              replaceFunc = new Function("_", `${realSearch}; return replace;`)(_);
            } catch (e) {
              console.error(e);
              this.toast(
                "[Highlight] Something wrong when creating JS Function, please check replace settings"
              );
              continue;
            }
            let results: ReplaceJSFunctionResultType;
            try {
              results = replaceFunc(dataStringReplaced);
            } catch (e) {
              console.error(e);
              this.toast(
                "[Highlight] Something wrong when execute JS Function, please check replace settings"
              );
              continue;
            }

            if (typeof results === "string") {
              dataStringReplaced = results;
            } else if (Array.isArray(results)) {
              const [jsSearchPattern, jsReplacePattern] = results;
              replacePattern = jsReplacePattern;
              if (typeof jsSearchPattern === "string") {
                realSearch = jsSearchPattern;
                isReplaceJSReturnString = true;
              } else {
                searchPattern = jsSearchPattern;
              }
            }
          }

          if (!isJS || isReplaceJSReturnString || searchPattern) {
            const regexpFlag = isCaseSensitive ? "g" : "gi";

            // let searchPattern: RegExp;
            try {
              // 不管是字符串还是正则，通通用正则来匹配，只不过对于字符串需要一丢丢特殊处理，不然会寄喵
              if (!searchPattern) {
                searchPattern = isRegExp
                  ? new RegExp(`${realSearch}`, regexpFlag)
                  : new RegExp(realSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), regexpFlag);
              }
            } catch (e) {
              // 象征性的捕获并忽略一下错误喵
              this.toast(
                "[Highlight] Something wrong when creating RegExp, please check replace settings"
              );
              this.logger.error(e.message);
              return super.feedFromSession(data);
            }
            dataStringReplaced = dataStringReplaced.replaceAll(
              searchPattern,
              replacePattern.replaceAll("\\n", this.enterReplacer)
            );
          }
        }
      }

      // this.logger.debug("replaced terminal line:");
      // this.logger.debug(inspect(dataString));
      let dataStringHighlighted = dataStringReplaced;
      if (highlightProfile && ((isAlternate && !highlightAlternateDisable) || !isAlternate)) {
        const { keywords } = highlightProfile;
        const occurrences: {
          start: number;
          end: number;
          fg?: string;
          bg?: string;
          bold?: boolean;
          italic?: boolean;
          underline?: string;
          dim?: boolean;
          inverse?: boolean;
          invisible?: boolean;
        }[] = [];

        for (const keyword of keywords) {
          const {
            text,
            enabled,
            isJS = false,
            isRegExp = false,
            isCaseSensitive = false,
            foreground = false,
            foregroundColor = "0",
            background = false,
            backgroundColor = "1",
            bold = false,
            italic = false,
            underline = false,
            underlineStyle = "1",
            dim = false,
            inverse = false,
            invisible = false,
            isMatchGroup = false,
            matchGroup = "0",
          } = keyword;

          // 未启用的关键字直接跳过喵
          if (!enabled) {
            continue;
          }

          let realText = text;

          let isJSReturnString = false;
          let pattern: RegExp;
          if (isJS) {
            // 真的要实现可编程高亮喵？会不会出现什么巨大漏洞然后被超市喵？
            // 要不要用eval喵？毕竟速度最快喵？
            // const matcher = eval(text);
            // console.log(text);
            let highlightFunc: Function;
            try {
              highlightFunc = new Function("_", `${text}; return highlight;`)(_);
            } catch (e) {
              console.error(e);
              this.toast(
                "[Highlight] Something wrong when creating JS Function, please check highlight settings"
              );
              continue;
            }
            // const highlight = highlightFunc();
            let results: HighlightJSFunctionResultType;
            try {
              results = highlightFunc(dataStringReplaced) ?? [];
            } catch (e) {
              console.error(e);
              this.toast(
                "[Highlight] Something wrong when execute JS Function, please check highlight settings"
              );
              continue;
            }

            if (typeof results === "string") {
              isJSReturnString = true;
              realText = results;
            } else if (results instanceof RegExp) {
              pattern = results;
            } else if (Array.isArray(results) && results.length > 0) {
              // const results: (number | [number, number])[] = [1, 3, 5, [6, 7]];
              for (const result of results) {
                let start = -1;
                let end = -1;
                if (typeof result === "number") {
                  start = result;
                  end = result;
                } else {
                  const [s, e] = result;
                  start = s;
                  end = e;
                }
                if (start >= 0 && end >= 0) {
                  occurrences.push({
                    start,
                    end,
                    fg: foreground ? foregroundColor : undefined,
                    bg: background ? backgroundColor : undefined,
                    bold,
                    italic,
                    underline: underline ? underlineStyle : undefined,
                    dim,
                    inverse,
                    invisible,
                  });
                }
              }
            } else {
              continue;
            }
          }

          if (!isJS || isJSReturnString || pattern) {
            if (!pattern) {
              try {
                const regexpFlag = isCaseSensitive ? "gd" : "gid";
                // 不管是字符串还是正则，通通用正则来匹配，只不过对于字符串需要一丢丢特殊处理，不然会寄喵
                pattern = isRegExp
                  ? new RegExp(`${realText}`, regexpFlag)
                  : new RegExp(realText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), regexpFlag);
              } catch (e) {
                // 象征性的捕获并忽略一下错误喵
                this.toast(
                  "[Highlight] Something wrong when creating RegExp, please check highlight settings"
                );
                this.logger.error(e.message);
                return super.feedFromSession(data);
              }
            }

            // this.logger.debug(`highlight match terminal line when match ${pattern}:`);
            // this.logger.debug(inspect(dataString));
            const matches = dataStringReplaced.matchAll(pattern);

            for (const match of matches) {
              const indices = (match as any).indices;
              if (!indices) {
                this.toast("[Highlight] indices not exist, please check highlight settings");
                this.logger.error("[Highlight] indices not exist, please check highlight settings");
                continue;
              }
              let indict: [number, number] = indices[0];

              // 匹配组处理喵
              if (isMatchGroup) {
                const group = parseInt(matchGroup);
                if (!isNaN(group)) {
                  indict = indices[group];
                } else {
                  // 命名匹配组处理喵
                  indict = indices.groups?.[matchGroup];
                }
              }

              if (indict) {
                const [start, end] = indict;
                occurrences.push({
                  start: start,
                  end: end - 1,
                  fg: foreground ? foregroundColor : undefined,
                  bg: background ? backgroundColor : undefined,
                  bold,
                  italic,
                  underline: underline ? underlineStyle : undefined,
                  dim,
                  inverse,
                  invisible,
                });
              }
            }
          }
        }

        // 如果没有匹配则直接返回，也许能提升一丢丢性能也不一定
        if (occurrences.length > 0) {
          passthroughFlag = false;
          // 改为按字符匹配的逻辑，可以解决嵌套问题喵，但……也许有性能问题也不一定(> <)，先就酱喵
          dataStringHighlighted = "";
          let char = "";

          for (let i = 0; i < dataStringReplaced.length; i++) {
            // 改来改去越来越复杂喵，性能蹭蹭下降喵，建议去用隔壁ElecTerm，自带高亮喵~
            const subString = dataStringReplaced.slice(i);

            // 其实本来可以把所有的控制字符都strip掉喵，但谁让咱比较好心，还是挨个进行了处理喵
            const csiSequenceMatch = subString.match(/\x1b\[[0-9;?]*[0-9a-zA-Z@]/);
            if (csiSequenceMatch) {
              if (csiSequenceMatch.index === 0) {
                i += csiSequenceMatch[0].length - 1;
                dataStringHighlighted += csiSequenceMatch[0];
                continue;
              }
            }
            const oscSequenceMatch = subString.match(
              /\x1b\](?:[^\x07\x1b]*|\x1b(?:[^[\x07]|$))*[\x07\x1b]/
            );
            if (oscSequenceMatch) {
              if (oscSequenceMatch.index === 0) {
                i += oscSequenceMatch[0].length - 1;
                dataStringHighlighted += oscSequenceMatch[0];
                continue;
              }
            }

            char = subString[0];
            const charCode = char.charCodeAt(0);
            // 处理宽字符喵
            if (charCode >= 0xd800 && charCode <= 0xdfff) {
              char += subString[1];
              i++;
            }
            if (charCode <= 31 || charCode === 127) {
              // 不可见字符不处理喵
            } else {
              for (const occurrence of occurrences) {
                const { start, end, bg, fg, bold, italic, underline, dim, inverse, invisible } =
                  occurrence;
                if (i >= start && i <= end) {
                  const beginSeq: string[] = [];
                  const endSeq: string[] = [];

                  if (bg) {
                    const bgIndex = parseInt(bg);
                    if (isNaN(bgIndex)) {
                      try {
                        const color = Color(bg).rgb().array();
                        const [r, g, b] = color;
                        beginSeq.push(`48;2;${r};${g};${b}`);
                        endSeq.push(`49`);
                      } catch (e) {
                        //假装捕获了异常喵
                      }
                    } else {
                      beginSeq.push(`48;5;${bgIndex}`);
                      endSeq.push(`49`);
                    }
                  }
                  if (fg) {
                    const fgIndex = parseInt(fg);
                    if (isNaN(fgIndex)) {
                      try {
                        const color = Color(fg).rgb().array();
                        const [r, g, b] = color;
                        beginSeq.push(`38;2;${r};${g};${b}`);
                        endSeq.push(`39`);
                      } catch (e) {
                        //假装捕获了异常喵
                      }
                    } else {
                      beginSeq.push(`38;5;${fgIndex}`);
                      endSeq.push(`39`);
                    }
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
                    beginSeq.push(`4:${underline}`);
                    endSeq.push(`24`);
                  }
                  if (dim) {
                    beginSeq.push(`2`);
                    endSeq.push(`22`);
                  }
                  if (inverse) {
                    beginSeq.push(`7`);
                    endSeq.push(`27`);
                  }
                  if (invisible) {
                    beginSeq.push(`8`);
                    endSeq.push(`28`);
                  }
                  char = `\x1b[${beginSeq.join(";")}m${char}\x1b[${endSeq.join(";")}m`;
                  break;
                }
              }
            }

            dataStringHighlighted += char;
          }
        }
      }
      dataStringArray.push(dataStringHighlighted);
    }

    if (passthroughFlag) {
      return super.feedFromSession(data);
    }
    const dataStringCombined = dataStringArray.join(this.enterReplacer);
    if (debug && debugPluginOutput) {
      this.logger.debug(`proceeded output:\n${inspect(dataStringCombined)}`);
    }
    return super.feedFromSession(Buffer.from(dataStringCombined));
  }

  close(): void {
    super.close();
  }

  @debounce(500)
  toast(message: string) {
    this.toastr.info(this.translate.instant(message));
  }
}
