import { Injectable, Injector } from "@angular/core";
import { ConfigService } from "tabby-core";
import { BaseSession, BaseTerminalTabComponent, TerminalDecorator } from "tabby-terminal";
import HighlightMiddleware from "./highlight.middleware";
import { HighlightPluginConfig, HighlightProfile } from "config.provider";
import * as uuid from "uuid";

@Injectable()
export class HighlightDecorator extends TerminalDecorator {
  constructor(private config: ConfigService, protected injector: Injector) {
    super();
  }

  attach(tab: BaseTerminalTabComponent<any>): void {
    const { highlightEnabled } = this.config.store.highlightPlugin;
    if (!highlightEnabled) {
      return;
    }
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
    let profileId: string;

    // 会话配置判定喵~
    if (!profileId && pluginConfig.highlightPerSessionEnabled) {
      profileId = pluginConfig.highlightPerSessionProfileMap.find(
        (value) => value.sessionId === tab.profile.id
      )?.profileId;
    }

    // 会话分组配置判定喵~
    if (!profileId && pluginConfig.highlightPerSessionGroupEnabled) {
      profileId = pluginConfig.highlightPerSessionGroupProfileMap.find(
        (value) => value.groupId === tab.profile.group
      )?.profileId;
    }

    // 会话类型配置判定喵~
    if (!profileId && pluginConfig.highlightPerSessionTypeEnabled) {
      profileId = pluginConfig.highlightPerSessionTypeProfileMap.find(
        (value) => value.typeId === tab.profile.type
      )?.profileId;
    }

    // 全局配置判定喵~
    if (!profileId && pluginConfig.highlightGlobalEnabled) {
      profileId = pluginConfig.highlightCurrentProfile;
    }

    // 不存在的配置ID喵（通常没有这种情况喵，但万一捏？）
    // 当然，还有禁用的ID喵~
    if (!profileId || profileId === uuid.NIL) {
      return;
    }

    const profile = pluginConfig.highlightProfiles.find((value) => value.id === profileId);
    // 不存在的配置喵（通常没有这种情况喵，但万一捏？）
    if (!profile) {
      return;
    }

    const middleware = new HighlightMiddleware(this.injector, tab, profile);
    session.middleware.push(middleware);
  }
}
