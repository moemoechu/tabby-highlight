import { Injectable } from "@angular/core";
import HighlightMiddleware from "./highlight.middleware";
import { ConfigService } from "tabby-core";
import { TerminalDecorator, BaseTerminalTabComponent, BaseSession } from "tabby-terminal";

@Injectable()
export class HighlightDecorator extends TerminalDecorator {
  constructor(private config: ConfigService) {
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
    // const middleware = new OscNotifyMiddleware(tabTitle);
    // session.middleware.push(middleware);
    const middleware = new HighlightMiddleware(tab, this.config.store.highlightPlugin);
    session.middleware.push(middleware);
  }
}
