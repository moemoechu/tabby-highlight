import { Injectable } from "@angular/core";
import { ConfigService, LogService, Logger, TranslateService } from "tabby-core";
import { translations } from "./translations";

@Injectable({ providedIn: "root" })
export class HighlightService {
  private logger: Logger;
  constructor(
    public config: ConfigService,
    private logService: LogService,
    private translate: TranslateService
  ) {
    this.logger = this.logService.create("tabby-highlight");
    this.logger.info("HighlightService ctor");

    this.config.ready$.subscribe(() => {
      this.logger.info("config ready");
      for (const translation of translations) {
        const [lang, trans] = translation;
        this.translate.setTranslation(lang, trans, true);
      }
      this.upgrade();
    });
  }

  upgrade() {
    if (this.config.store.highlightPlugin.highlightKeywords) {
      this.config.store.highlightPlugin.highlightProfiles = [
        {
          name: "Default",
          keywords: this.config.store.highlightPlugin.highlightKeywords,
        },
      ];
      this.config.store.highlightPlugin.highlightKeywords = undefined;
      this.config.save();
      this.logger.info("upgrade finished.");
    }
  }
}
