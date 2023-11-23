import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { ConfigService, TranslateService } from "tabby-core";
import { ElectronHostWindow, ElectronService } from "tabby-electron";
import { debounce } from "utils-decorators";
import { HighlightKeyword } from "./configProvider";

/** @hidden */
@Component({
  template: require("./settingsTab.component.pug"),
  styles: [``],
})
export class HighlightSettingsTabComponent {
  styles = [
    {
      name: "#BG",
      enabledModel: "background",
      valueType: "number",
      valueModel: "backgroundColor",
      min: 0,
      max: 15,
    },
    {
      name: "#FG",
      enabledModel: "foreground",
      valueType: "number",
      valueModel: "foregroundColor",
      min: 0,
      max: 15,
    },
    {
      name: "Bold",
      enabledModel: "bold",
    },
    {
      name: "Italic",
      enabledModel: "italic",
    },
    {
      name: "Underline",
      enabledModel: "underline",
    },
  ];
  alertMessage: string;
  alertType: "info" | "success" | "danger";
  verifyStatus: [boolean, string][];
  constructor(
    public config: ConfigService,
    private electron: ElectronService,
    private hostWindow: ElectronHostWindow,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    this.verify();
  }

  async pickFile(): Promise<void> {
    const paths = (
      await this.electron.dialog.showOpenDialog(this.hostWindow.getWindow(), {
        filters: [
          { name: "Profile", extensions: ["thp", "json"] },
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
      text: "INFO",
      enabled: false,
      isRegExp: false,
      foreground: true,
      foregroundColor: 0,
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

  verify() {
    this.verifyStatus = [];
    const errorRegexp: [string, string][] = [];
    const { highlightKeywords } = this.config.store.highlightPlugin;
    for (const keyword of highlightKeywords) {
      let status = true;
      let errInfo = "";
      const { isRegExp, text } = keyword;
      if (isRegExp) {
        try {
          const regexp = new RegExp(text, "g");
        } catch (e) {
          errorRegexp.push([text, e.message]);
          errInfo = e.message;
          status = false;
        }
      }
      this.verifyStatus.push([status, errInfo]);
    }
    if (errorRegexp.length > 0) {
      this.alertMessage =
        this.translate.instant("The following regexp is not valid:\n") +
        errorRegexp.map((value) => `${value[0]}: ${value[1]}`).join("\n");
      this.alertType = "danger";
    } else {
      this.alertMessage = "Everything looks good.";
      this.alertType = "success";
    }
  }

  drop(event: CdkDragDrop<HighlightKeyword[]>) {
    moveItemInArray(
      this.config.store.highlightPlugin.highlightKeywords,
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }

  // 为了防止频繁保存可能导致的潜在的风险（其实没有），加入了防抖
  // @debounce(500)
  apply() {
    this.config.save();
    this.verify();
    // this.background.applyCss();
    // this.toastr.info(this.translate.instant("Highlight applied!"));
  }
}
