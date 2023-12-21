import { Injectable, Injector } from "@angular/core";
import { HighlightPluginConfig } from "config.provider";
import { ConfigService } from "tabby-core";
import { BaseSession, BaseTerminalTabComponent, TerminalDecorator } from "tabby-terminal";
import HighlightMiddleware from "./highlight.middleware";

@Injectable()
export class HighlightDecorator extends TerminalDecorator {
  constructor(private config: ConfigService, protected injector: Injector) {
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
    let highlightProfileId: string;
    let replaceProfileId: string;

    if (pluginConfig.highlightEnabled) {
      // 会话配置判定喵~
      if (!highlightProfileId && pluginConfig.highlightPerSessionEnabled) {
        highlightProfileId = pluginConfig.highlightPerSessionProfileMap.find(
          (value) => value.sessionId === tab.profile.id
        )?.profileId;
      }

      // 会话分组配置判定喵~
      if (!highlightProfileId && pluginConfig.highlightPerSessionGroupEnabled) {
        highlightProfileId = pluginConfig.highlightPerSessionGroupProfileMap.find(
          (value) => value.groupId === tab.profile.group
        )?.profileId;
      }

      // 会话类型配置判定喵~
      if (!highlightProfileId && pluginConfig.highlightPerSessionTypeEnabled) {
        highlightProfileId = pluginConfig.highlightPerSessionTypeProfileMap.find(
          (value) => value.typeId === tab.profile.type
        )?.profileId;
      }

      // 全局配置判定喵~
      if (!highlightProfileId && pluginConfig.highlightGlobalEnabled) {
        highlightProfileId = pluginConfig.highlightCurrentProfile;
      }
    }

    const highlightProfile = pluginConfig.highlightProfiles.find(
      (value) => value.id === highlightProfileId
    );

    // 全局配置判定喵~
    if (!replaceProfileId && pluginConfig.replaceEnabled) {
      replaceProfileId = pluginConfig.replaceCurrentProfile;
    }

    const replaceProfile = pluginConfig.replaceProfiles.find(
      (value) => value.id === replaceProfileId
    );

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
