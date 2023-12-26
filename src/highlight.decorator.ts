import { Injectable, Injector } from "@angular/core";
import { ConfigService } from "tabby-core";
import { BaseSession, BaseTerminalTabComponent, TerminalDecorator } from "tabby-terminal";
import { HighlightPluginConfig, HighlightProfile, ReplaceProfile } from "./api";
import HighlightMiddleware from "./highlight.middleware";
import { HighlightService } from "./highlight.service";

@Injectable()
export class HighlightDecorator extends TerminalDecorator {
  constructor(
    private highlightService: HighlightService,
    private config: ConfigService,
    protected injector: Injector
  ) {
    super();
  }

  attach(tab: BaseTerminalTabComponent<any>): void {
    if (tab.sessionChanged$) {
      // v136+
      tab.sessionChanged$.subscribe((session) => {
        if (session) {
          this.attachToSession(session, tab);
        }
      });
    }
    if (tab.session) {
      this.attachToSession(tab.session, tab);
    }
  }

  private attachToSession(session: BaseSession, tab: BaseTerminalTabComponent<any>) {
    const pluginConfig: HighlightPluginConfig = this.config.store.highlightPlugin;
    let highlightProfile: HighlightProfile;

    if (pluginConfig.highlightEnabled) {
      // 会话配置判定喵~
      if (!highlightProfile && pluginConfig.highlightPerSessionEnabled) {
        highlightProfile = this.highlightService.getHighlightProfileBySessionId(tab.profile.id);
      }

      // 会话分组配置判定喵~
      if (!highlightProfile && pluginConfig.highlightPerSessionGroupEnabled) {
        highlightProfile = this.highlightService.getHighlightProfileBySessionGroupId(
          tab.profile.group
        );
      }

      // 会话类型配置判定喵~
      if (!highlightProfile && pluginConfig.highlightPerSessionTypeEnabled) {
        highlightProfile = this.highlightService.getHighlightProfileBySessionTypeId(
          tab.profile.type
        );
      }

      // 全局配置判定喵~
      if (!highlightProfile && pluginConfig.highlightGlobalEnabled) {
        highlightProfile = this.highlightService.getCurrentHighlightProfile();
      }
    }

    let replaceProfile: ReplaceProfile;
    if (pluginConfig.replaceEnabled) {
      // 全局配置判定喵~
      if (!replaceProfile) {
        replaceProfile = this.highlightService.getCurrentReplaceProfile();
      }
    }

    // 不存在的配置喵（通常没有这种情况喵，但万一捏？）
    if (!highlightProfile && !replaceProfile) {
      return;
    }

    // 将配置狠狠地注入到标签页喵，方便使用右键菜单切换喵~
    (tab as any).highlightProfile = highlightProfile;
    (tab as any).replaceProfile = replaceProfile;

    const middleware = new HighlightMiddleware(this.injector, tab);
    session.middleware.push(middleware);
  }
}
