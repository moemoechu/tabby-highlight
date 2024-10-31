import { Injector } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { ConfigService, LogService, Logger, TranslateService } from "tabby-core";
import { SessionMiddleware } from "tabby-terminal";
import { debounce } from "utils-decorators";
import { HighlightEngagedTab, HighlightPluginConfig } from "./api";
import { inspect } from "util";

export default class HighlightMiddleware extends SessionMiddleware {
  tab: HighlightEngagedTab;
  logger: Logger;
  toastr: ToastrService;
  translate: TranslateService;
  enterReplacer = "\r\n";
  pluginConfig: HighlightPluginConfig;

  constructor(injector: Injector, tab: HighlightEngagedTab) {
    super();
    this.tab = tab;
    this.logger = injector.get(LogService).create(`tabby-highlight`);
    this.toastr = injector.get(ToastrService);
    this.translate = injector.get(TranslateService);
    this.pluginConfig = injector.get(ConfigService).store.highlightPlugin;

    this.logger.info("HighlightMiddleware ctor.");

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
    const dataStringSplitted = dataStringRaw.split(this.enterReplacer);

    // this.logger.debug("raw terminal line:");
    // this.logger.debug(inspect(dataStringRaw));

    const { highlightAlternateDisable, replaceAlternateDisable } = this.pluginConfig;
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
          const { enabled, isCaseSensitive, isRegExp, search, replace } = pattern;
          if (enabled) {
            passthroughFlag = false;

            const regexpFlag = isCaseSensitive ? "g" : "gi";

            let pattern: RegExp;
            try {
              // 不管是字符串还是正则，通通用正则来匹配，只不过对于字符串需要一丢丢特殊处理，不然会寄喵
              pattern = isRegExp
                ? new RegExp(`${search}`, regexpFlag)
                : new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), regexpFlag);
            } catch (e) {
              // 象征性的捕获并忽略一下错误喵
              this.toast(
                "[Highlight] Something wrong when creating RegExp, please check replace settings",
              );
              this.logger.error(e.message);
              return super.feedFromSession(data);
            }
            dataStringReplaced = dataStringReplaced.replaceAll(
              pattern,
              replace.replaceAll("\\n", this.enterReplacer),
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
          underline?: boolean;
          dim?: boolean;
        }[] = [];

        for (const keyword of keywords) {
          const {
            text,
            enabled,
            isRegExp = false,
            isCaseSensitive = false,
            foreground = false,
            foregroundColor = "0",
            background = false,
            backgroundColor = "1",
            bold = false,
            italic = false,
            underline = false,
            dim = false,
            isMatchGroup = false,
            matchGroup = "0",
          } = keyword;

          // 未启用的关键字直接跳过喵
          if (!enabled) {
            continue;
          }

          const regexpFlag = isCaseSensitive ? "gd" : "gid";

          let pattern: RegExp;
          try {
            // 不管是字符串还是正则，通通用正则来匹配，只不过对于字符串需要一丢丢特殊处理，不然会寄喵
            pattern = isRegExp
              ? new RegExp(`${text}`, regexpFlag)
              : new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), regexpFlag);
          } catch (e) {
            // 象征性的捕获并忽略一下错误喵
            this.toast(
              "[Highlight] Something wrong when creating RegExp, please check highlight settings",
            );
            this.logger.error(e.message);
            return super.feedFromSession(data);
          }

          // this.logger.debug(`highlight match terminal line when match ${pattern}:`);
          // this.logger.debug(inspect(dataString));
          const matches = dataStringReplaced.matchAll(pattern);

          for (const match of matches) {
            const indices = (match as any).indices;
            let indict: [number, number] = indices[0];
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
                underline,
                dim,
              });
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
            const csiSequenceMatch = subString.match(/\x1b\[[0-9;?]*[a-zA-Z]/);
            if (csiSequenceMatch) {
              if (csiSequenceMatch.index === 0) {
                i += csiSequenceMatch[0].length - 1;
                dataStringHighlighted += csiSequenceMatch[0];
                continue;
              }
            }
            const oscSequenceMatch = subString.match(
              /\x1b\](?:[^\x07\x1b]*|\x1b(?:[^[\x07]|$))*[\x07\x1b]/,
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
            if (charCode >= 0xd800 && charCode <= 0xdfff) {
              char += subString[1];
              i++;
            }
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
    // this.logger.debug(`combined output string:`);
    // this.logger.debug(inspect(dataStringCombined));
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
