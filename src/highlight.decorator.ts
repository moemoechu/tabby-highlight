import { Injectable } from "@angular/core";
import HighlightMiddleware from "./highlight.middleware";
import { ConfigService, LogService, Logger, TranslateService } from "tabby-core";
import { TerminalDecorator, BaseTerminalTabComponent, BaseSession } from "tabby-terminal";
import { ToastrService } from "ngx-toastr";
import { debounce } from "utils-decorators";

@Injectable()
export class HighlightDecorator extends TerminalDecorator {
  private logger: Logger;
  constructor(
    private config: ConfigService,
    private logService: LogService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();

    this.logger = this.logService.create("tabby-highlight");
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
      tab,
      this.config.store.highlightPlugin,
      this.logger,
      this.toast.bind(this)
    );
    session.middleware.push(middleware);
  }

  @debounce(500)
  toast(message: string) {
    this.toastr.info(this.translate.instant(message));
    this.logger.info("message");
  }
}
