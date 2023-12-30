import { Injectable, Injector } from "@angular/core";
import { BaseSession, BaseTerminalTabComponent, TerminalDecorator } from "tabby-terminal";
import { HighlightEngagedTab } from "./api";
import HighlightMiddleware from "./highlight.middleware";
import { HighlightService } from "./highlight.service";

@Injectable()
export class HighlightDecorator extends TerminalDecorator {
  constructor(private highlightService: HighlightService, protected injector: Injector) {
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

  private attachToSession(session: BaseSession, tab: HighlightEngagedTab) {
    this.highlightService.injectHighlightToTab(tab);

    const middleware = new HighlightMiddleware(this.injector, tab);
    session.middleware.push(middleware);
  }
}
