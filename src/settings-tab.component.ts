import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component } from "@angular/core";
import { NgbModal, NgbNavChangeEvent } from "@ng-bootstrap/ng-bootstrap";
import fs from "fs";
import { ToastrService } from "ngx-toastr";
import { ConfigService, PromptModalComponent, TranslateService } from "tabby-core";
import { ElectronHostWindow, ElectronService } from "tabby-electron";
import * as uuid from "uuid";
import {
  HighlightKeyword,
  HighlightPluginConfig,
  HighlightProfile,
  ReplacePattern,
  ReplaceProfile,
} from "./config.provider";
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

  sessionTypes: { id: string; name: string }[] = [
    { id: "ssh", name: "SSH" },
    { id: "telnet", name: "Telnet" },
    { id: "serial", name: "Serial" },
    { id: "local", name: "Local" },
  ];
  alertMessage: string;
  alertType: "info" | "success" | "danger";
  verifyStatus: [boolean, string][][];

  currentTheme: string;
  pluginConfig: HighlightPluginConfig;
  uuidNIL = uuid.NIL;

  get currentProfile() {
    let currentIndex = 0;
    const result = this.pluginConfig.highlightProfiles.find((value, index) => {
      currentIndex = index;
      return value.id === this.pluginConfig.highlightCurrentProfile;
    });

    return currentIndex;
  }

  set currentProfile(value) {
    this.pluginConfig.highlightCurrentProfile = this.pluginConfig.highlightProfiles[value].id;
    this.apply();
  }

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
    this.replaceVerify();
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
      const importedProfile: HighlightProfile = JSON.parse(keywordsJSON);
      importedProfile.id = this.pluginConfig.highlightCurrentProfile;
      this.pluginConfig.highlightProfiles[this.currentProfile] = importedProfile;
      this.apply();
    }
  }

  async export() {
    const keywordsData = JSON.stringify(this.pluginConfig.highlightProfiles[this.currentProfile]);
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
    this.pluginConfig.highlightProfiles[this.currentProfile].keywords.unshift(newKeyword);
    this.apply();
  }

  removeKeyword(i: number) {
    this.pluginConfig.highlightProfiles[this.currentProfile].keywords.splice(i, 1);
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
      this.pluginConfig.highlightProfiles[this.currentProfile].keywords,
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }

  dropProfile(event: CdkDragDrop<HighlightProfile[]>) {
    moveItemInArray(this.pluginConfig.highlightProfiles, event.previousIndex, event.currentIndex);
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
    this.replaceVerify();
  }

  addProfile(event: MouseEvent) {
    event.preventDefault();
    this.pluginConfig.highlightProfiles.push({
      id: uuid.v4(),
      name: `Profile ${this.pluginConfig.highlightProfiles.length}`,
      keywords: [],
    });
    this.currentProfile = this.pluginConfig.highlightProfiles.length - 1;
    this.apply();
  }

  async delProfile(event: MouseEvent, toRemove: number) {
    if (this.pluginConfig.highlightProfiles.length > 1) {
      const modal = this.ngbModal.open(ProfileDeleteModalComponent);
      modal.componentInstance.prompt = `${this.translate.instant("Delete")} ${
        this.pluginConfig.highlightProfiles[this.currentProfile].name
      }${this.translate.instant("?")}`;

      try {
        const result = await modal.result.catch(() => null);
        if (result === true) {
          this.pluginConfig.highlightProfiles = this.pluginConfig.highlightProfiles.filter(
            (item, index) => index !== toRemove
          );
          if (this.currentProfile === this.pluginConfig.highlightProfiles.length) {
            this.currentProfile -= 1;
          }
          this.apply();
        }
      } catch {}
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  onProfileChange(changeEvent: NgbNavChangeEvent) {
    this.currentProfile = changeEvent.nextId;
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

  addPerSessionProfile() {
    this.pluginConfig.highlightPerSessionProfileMap.push({
      sessionId: uuid.NIL,
      profileId: uuid.NIL,
    });
    this.apply();
  }

  removePerSessionProfile(i: number) {
    this.pluginConfig.highlightPerSessionProfileMap.splice(i, 1);
    this.apply();
  }

  addPerSessionGroupProfile() {
    this.pluginConfig.highlightPerSessionGroupProfileMap.push({
      groupId: uuid.NIL,
      profileId: uuid.NIL,
    });
    this.apply();
  }

  removePerSessionGroupProfile(i: number) {
    this.pluginConfig.highlightPerSessionGroupProfileMap.splice(i, 1);
    this.apply();
  }

  addPerSessionTypeProfile() {
    this.pluginConfig.highlightPerSessionTypeProfileMap.push({
      typeId: uuid.NIL,
      profileId: uuid.NIL,
    });
    this.apply();
  }

  removePerSessionTypeProfile(i: number) {
    this.pluginConfig.highlightPerSessionTypeProfileMap.splice(i, 1);
    this.apply();
  }

  getSessions(sessionId) {
    return this.config.store.profiles.filter(
      (all) =>
        !this.pluginConfig.highlightPerSessionProfileMap.some(
          (exist) => exist.sessionId === all.id
        ) || all.id === sessionId
    );
  }

  getSessionGroups(groupId) {
    return this.config.store.groups.filter(
      (all) =>
        !this.pluginConfig.highlightPerSessionGroupProfileMap.some(
          (exist) => exist.groupId === all.id
        ) || all.id === groupId
    );
  }
  getSessionTypes(typeId) {
    return this.sessionTypes.filter(
      (all) =>
        !this.pluginConfig.highlightPerSessionTypeProfileMap.some(
          (exist) => exist.typeId === all.id
        ) || all.id === typeId
    );
  }

  // Replace

  get currentReplaceProfile() {
    let currentIndex = 0;
    const result = this.pluginConfig.replaceProfiles.find((value, index) => {
      currentIndex = index;
      return value.id === this.pluginConfig.replaceCurrentProfile;
    });

    return currentIndex;
  }

  set currentReplaceProfile(value) {
    this.pluginConfig.replaceCurrentProfile = this.pluginConfig.replaceProfiles[value].id;
    this.apply();
  }

  replaceVerifyStatus: [boolean, string][][];

  replaceVerify() {
    this.replaceVerifyStatus = [];
    for (const profile of this.pluginConfig.replaceProfiles) {
      const { patterns } = profile;
      const profileStatus = [];
      for (const pattern of patterns) {
        let status = true;
        let errInfo = "";
        const { isRegExp, search } = pattern;
        if (isRegExp) {
          try {
            const regexp = new RegExp(search, "g");
          } catch (e) {
            errInfo = e.message;
            status = false;
          }
        }
        profileStatus.push([status, errInfo]);
      }
      this.replaceVerifyStatus.push(profileStatus);
    }
  }

  onReplaceProfileChange(changeEvent: NgbNavChangeEvent) {
    this.currentReplaceProfile = changeEvent.nextId;
    this.apply();
  }

  dropReplaceProfile(event: CdkDragDrop<ReplaceProfile[]>) {
    moveItemInArray(this.pluginConfig.replaceProfiles, event.previousIndex, event.currentIndex);
    this.apply();
  }

  dropReplacePattern(event: CdkDragDrop<ReplacePattern[]>) {
    moveItemInArray(
      this.pluginConfig.replaceProfiles[this.currentReplaceProfile].patterns,
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }
  async changeReplaceProfileName(profileIndex: number) {
    const modal = this.ngbModal.open(PromptModalComponent);
    modal.componentInstance.prompt = this.translate.instant("Profile name");
    modal.componentInstance.value = this.pluginConfig.replaceProfiles[profileIndex].name;
    modal.componentInstance.password = false;
    try {
      const result = await modal.result.catch(() => null);
      if (result?.value) {
        this.pluginConfig.replaceProfiles[profileIndex].name = result.value;
        this.apply();
      }
    } catch {}
  }

  addReplaceProfile(event: MouseEvent) {
    event.preventDefault();
    this.pluginConfig.replaceProfiles.push({
      id: uuid.v4(),
      name: `Profile ${this.pluginConfig.replaceProfiles.length}`,
      patterns: [],
    });
    this.currentReplaceProfile = this.pluginConfig.replaceProfiles.length - 1;
    this.apply();
  }

  async delReplaceProfile(event: MouseEvent, toRemove: number) {
    if (this.pluginConfig.replaceProfiles.length > 1) {
      const modal = this.ngbModal.open(ProfileDeleteModalComponent);
      modal.componentInstance.prompt = `${this.translate.instant("Delete")} ${
        this.pluginConfig.replaceProfiles[this.currentReplaceProfile].name
      }${this.translate.instant("?")}`;

      try {
        const result = await modal.result.catch(() => null);
        if (result === true) {
          this.pluginConfig.replaceProfiles = this.pluginConfig.replaceProfiles.filter(
            (item, index) => index !== toRemove
          );
          if (this.currentReplaceProfile === this.pluginConfig.replaceProfiles.length) {
            this.currentReplaceProfile -= 1;
          }
          this.apply();
        }
      } catch {}
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  addReplacePattern() {
    const newPattern: ReplacePattern = {
      enabled: false,
      search: "INFO",
      replace: "信息",
    };
    this.pluginConfig.replaceProfiles[this.currentReplaceProfile].patterns.unshift(newPattern);
    this.apply();
  }

  removeReplacePattern(i: number) {
    this.pluginConfig.replaceProfiles[this.currentReplaceProfile].patterns.splice(i, 1);
    this.apply();
  }
}
