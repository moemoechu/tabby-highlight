import { Injectable, Injector } from "@angular/core";
import { ConfigService } from "tabby-core";
import { BaseSession, BaseTerminalTabComponent, TerminalDecorator } from "tabby-terminal";
import HighlightMiddleware from "./highlight.middleware";

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
    const middleware = new HighlightMiddleware(
      this.injector,
      tab,
      this.config.store.highlightPlugin
    );
    session.middleware.push(middleware);
  }
}
