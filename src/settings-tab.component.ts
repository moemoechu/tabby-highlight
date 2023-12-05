import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component } from "@angular/core";
import { NgbModal, NgbNavChangeEvent } from "@ng-bootstrap/ng-bootstrap";
import fs from "fs";
import { ToastrService } from "ngx-toastr";
import { ConfigService, PromptModalComponent, TranslateService } from "tabby-core";
import { ElectronHostWindow, ElectronService } from "tabby-electron";
import { HighlightKeyword, HighlightPluginConfig, HighlightProfile } from "./config.provider";
import { ProfileDeleteModalComponent } from "./profile-delete-modal.component";

/** @hidden */
@Component({
  template: require("./settings-tab.component.pug"),
  styles: [
    `
      .list-group-item-highlight {
        --bs-list-group-action-hover-bg: rgba(0, 0, 0, 0.55);
        // backdrop-filter: blur(3px);
      }
      .close {
        // font-size: 1.4rem;
        opacity: 0.1;
        transition: opacity 0.3s;
      }
      .nav-link:hover > .close {
        opacity: 0.8;
      }
      .add-button {
        opacity: 0.4;
      }
      .add-button:hover {
        opacity: 0.9;
      }
    `,
  ],
})
export class HighlightSettingsTabComponent {
  styles = [
    {
      name: "Background",
      enabledModel: "background",
      valueType: "number",
      valueModel: "backgroundColor",
      min: 0,
      max: 15,
    },
    {
      name: "Foreground",
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
    {
      name: "Dim",
      enabledModel: "dim",
    },
  ];
  alertMessage: string;
  alertType: "info" | "success" | "danger";
  verifyStatus: [boolean, string][][];

  currentTheme: string;
  pluginConfig: HighlightPluginConfig;
  constructor(
    public config: ConfigService,
    private electron: ElectronService,
    private hostWindow: ElectronHostWindow,
    private toastr: ToastrService,
    private translate: TranslateService,
    private ngbModal: NgbModal
  ) {
    // 兼容亮色主题太麻烦了喵，先做个基本兼容，以后再说喵
    this.currentTheme = this.config.store.appearance.colorSchemeMode;
    this.pluginConfig = this.config.store.highlightPlugin;

    this.verify();
  }

  import() {
    const paths = this.electron.dialog.showOpenDialogSync(this.hostWindow.getWindow(), {
      filters: [
        { name: "Profile", extensions: ["thp", "json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile", "showHiddenFiles"],
    });
    if (paths && paths[0]) {
      const data = fs.readFileSync(paths[0]);
      const keywordsJSON = data.toString();
      this.pluginConfig.highlightProfiles[this.pluginConfig.highlightCurrentProfile] =
        JSON.parse(keywordsJSON);
      this.apply();
    }
  }

  async export() {
    const keywordsData = JSON.stringify(
      this.pluginConfig.highlightProfiles[this.pluginConfig.highlightCurrentProfile]
    );
    const result = await this.electron.dialog.showSaveDialog(this.hostWindow.getWindow(), {
      filters: [
        { name: "Profile", extensions: ["thp", "json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile", "showHiddenFiles"],
    });
    if (!result?.canceled) {
      const file = fs.writeFile(result.filePath, keywordsData, (err) => {});
    }
  }

  addKeyword() {
    const newKeyword: HighlightKeyword = {
      text: "INFO",
      enabled: false,
      background: true,
      backgroundColor: "1",
    };
    this.pluginConfig.highlightProfiles[this.pluginConfig.highlightCurrentProfile].keywords.unshift(
      newKeyword
    );
    this.apply();
  }

  removeKeyword(i: number) {
    this.pluginConfig.highlightProfiles[this.pluginConfig.highlightCurrentProfile].keywords.splice(
      i,
      1
    );
    this.apply();
  }

  verify() {
    this.verifyStatus = [];
    for (const profile of this.pluginConfig.highlightProfiles) {
      const { keywords } = profile;
      const profileStatus = [];
      for (const keyword of keywords) {
        let status = true;
        let errInfo = "";
        const { isRegExp, text } = keyword;
        if (isRegExp) {
          try {
            const regexp = new RegExp(text, "g");
          } catch (e) {
            errInfo = e.message;
            status = false;
          }
        }
        profileStatus.push([status, errInfo]);
      }
      this.verifyStatus.push(profileStatus);
    }
  }

  dropKeyword(event: CdkDragDrop<HighlightKeyword[]>) {
    moveItemInArray(
      this.pluginConfig.highlightProfiles[this.pluginConfig.highlightCurrentProfile].keywords,
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }

  dropProfile(event: CdkDragDrop<HighlightProfile[]>) {
    moveItemInArray(this.pluginConfig.highlightProfiles, event.previousIndex, event.currentIndex);
    if (this.pluginConfig.highlightCurrentProfile === event.previousIndex) {
      this.pluginConfig.highlightCurrentProfile = event.currentIndex;
    } else if (
      event.previousIndex > this.pluginConfig.highlightCurrentProfile &&
      event.currentIndex <= this.pluginConfig.highlightCurrentProfile
    ) {
      this.pluginConfig.highlightCurrentProfile += 1;
    }
    this.apply();
  }

  getAnsiColorById(id: number) {
    const schema = this.currentTheme === "light" ? "lightColorScheme" : "colorScheme";
    const colorSchema = this.config.store.terminal[schema].colors;
    return colorSchema[id];
  }

  apply() {
    this.config.save();
    this.verify();
  }

  addProfile(event: MouseEvent) {
    event.preventDefault();
    this.pluginConfig.highlightProfiles.push({
      name: `Profile ${this.pluginConfig.highlightProfiles.length}`,
      keywords: [],
    });
    this.pluginConfig.highlightCurrentProfile = this.pluginConfig.highlightProfiles.length - 1;
    this.apply();
  }

  async delProfile(event: MouseEvent, toRemove: number) {
    if (this.pluginConfig.highlightProfiles.length > 1) {
      const modal = this.ngbModal.open(ProfileDeleteModalComponent);
      modal.componentInstance.prompt = `${this.translate.instant("Delete")} ${
        this.pluginConfig.highlightProfiles[this.pluginConfig.highlightCurrentProfile].name
      }${this.translate.instant("?")}`;

      try {
        const result = await modal.result.catch(() => null);
        if (result === true) {
          this.pluginConfig.highlightProfiles = this.pluginConfig.highlightProfiles.filter(
            (item, index) => index !== toRemove
          );
          if (
            this.pluginConfig.highlightCurrentProfile === this.pluginConfig.highlightProfiles.length
          ) {
            this.pluginConfig.highlightCurrentProfile -= 1;
          }
          this.apply();
        }
      } catch {}
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  onProfileChange(changeEvent: NgbNavChangeEvent) {
    this.pluginConfig.highlightCurrentProfile = changeEvent.nextId;
    this.apply();
  }

  async changeProfileName(profileIndex: number) {
    const modal = this.ngbModal.open(PromptModalComponent);
    modal.componentInstance.prompt = this.translate.instant("Profile name");
    modal.componentInstance.value = this.pluginConfig.highlightProfiles[profileIndex].name;
    modal.componentInstance.password = false;
    try {
      const result = await modal.result.catch(() => null);
      if (result?.value) {
        this.pluginConfig.highlightProfiles[profileIndex].name = result.value;
        this.apply();
      }
    } catch {}
  }
}
