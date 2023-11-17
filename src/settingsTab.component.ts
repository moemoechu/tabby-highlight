import { Component } from "@angular/core";
import { ConfigService, TranslateService } from "tabby-core";
import { ElectronHostWindow, ElectronService } from "tabby-electron";
import { debounce } from "utils-decorators";
import { ToastrService } from "ngx-toastr";
import { HighlightKeyword } from "./configProvider";

/** @hidden */
@Component({
  template: require("./settingsTab.component.pug"),
  styles: [
    `
      .color-number-input {
        width: 70px;
        flex: none;
      }
      .font-size-input {
        width: 100px;
        flex: none;
      }

      .font-family-input {
        min-width: 150px;
        // flex: none;
      }

      .background-input {
        min-width: 300px;
        // flex: none;
      }
    `,
  ],
})
export class HighlightSettingsTabComponent {
  constructor(
    public config: ConfigService,
    private electron: ElectronService,
    private hostWindow: ElectronHostWindow,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  async pickFile(): Promise<void> {
    const paths = (
      await this.electron.dialog.showOpenDialog(this.hostWindow.getWindow(), {
        filters: [
          { name: "Images", extensions: ["jpg", "png", "gif"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile", "showHiddenFiles"],
      })
    ).filePaths;
    if (paths[0]) {
      this.config.store.backgroundPlugin.backgroundPath = paths[0];
      this.apply();
    }
  }

  addKeyword() {
    const newKeyword: HighlightKeyword = {
      enabled: false,
      text: "INFO",
      foreground: false,
      foregroundColor: 4,
      background: true,
      backgroundColor: 1,
      bold: false,
    };
    this.config.store.highlightPlugin.highlightKeywords.unshift(newKeyword);
    this.apply();
  }

  removeKeyword(i: number) {
    this.config.store.highlightPlugin.highlightKeywords.splice(i, 1);
    this.apply();
  }

  // 为了防止频繁保存可能导致的潜在的风险（其实没有），加入了防抖
  @debounce(500)
  apply() {
    this.config.save();
    // this.background.applyCss();
    this.toastr.info(this.translate.instant("Highlight applied!"));
  }
}
