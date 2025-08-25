import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component } from "@angular/core";
import { NgbModal, NgbNavChangeEvent } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import {
  ConfigService,
  PartialProfile,
  PartialProfileGroup,
  Profile,
  ProfileGroup,
  ProfilesService,
  PromptModalComponent,
  TranslateService,
} from "tabby-core";
import { ElectronHostWindow, ElectronService } from "tabby-electron";
import * as uuid from "uuid";
import {
  HighlightKeyword,
  HighlightPluginConfig,
  HighlightProfile,
  ReplacePattern,
  ReplaceProfile,
} from "./api";
import { HighlightService } from "./highlight.service";
import { ProfileDeleteModalComponent } from "./profile-delete-modal.component";
import { PatternEditorModalComponent } from "./pattern-editor-modal.component";
import Color from "color";

/** @hidden */
@Component({
  template: require("./settings-tab.component.html"),
  styles: [
    `
      .list-group-item-highlight {
        --bs-list-group-bg: rgba(0, 0, 0, 0.25);
        --bs-list-group-action-hover-bg: rgba(0, 0, 0, 0.65);
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
  styles: any[];

  sessionTypes: string[];
  alertMessage: string;
  alertType: "info" | "success" | "danger";
  verifyStatus: [boolean, string][][];

  currentTheme: string;
  uuidNIL = uuid.NIL;
  // 兼容设置同步的临时方案喵？
  get pluginConfig() {
    return this.config.store.highlightPlugin as HighlightPluginConfig;
  }

  constructor(
    public config: ConfigService,
    private electron: ElectronService,
    private hostWindow: ElectronHostWindow,
    private toastr: ToastrService,
    private translate: TranslateService,
    private ngbModal: NgbModal,
    private sessionsService: ProfilesService,
    private highlightService: HighlightService
  ) {
    // 兼容亮色主题太麻烦了喵，先做个基本兼容，以后再说喵
    this.currentTheme = this.config.store.appearance.colorSchemeMode;
    this.verify();
    this.styles = [
      {
        name: "Background Color",
        enabledModel: "background",
        valueType: "text",
        valueModel: "backgroundColor",
        // min: 0,
        // max: 15,
        title: this.translate.instant(
          "Use number 0-15 for ANSI color(themed), 16-256 for ANSI 256 color, #RRGGBB for RGB color (i.e. #ffd0f2), or color name(i.e. orange)"
        ),
      },
      {
        name: "Foreground Color",
        enabledModel: "foreground",
        valueType: "text",
        valueModel: "foregroundColor",
        // min: 0,
        // max: 15,
        title: this.translate.instant(
          "Use number 0-15 for ANSI color(themed), 16-256 for ANSI 256 color, #RRGGBB for RGB color (i.e. #ffd0f2), or color name(i.e. orange)"
        ),
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
        valueType: "select",
        valueModel: "underlineStyle",
        min: 1,
        max: 5,
        defaultValue: "1",
        values: [
          { title: "Single", value: "1" },
          { title: "Double", value: "2" },
          { title: "Curly", value: "3" },
          { title: "Dotted", value: "4" },
          { title: "Dashed", value: "5" },
        ],
      },
      {
        name: "Dim",
        enabledModel: "dim",
      },
      {
        name: "Inverse",
        enabledModel: "inverse",
      },
      {
        name: "Invisible",
        enabledModel: "invisible",
      },
    ];
  }

  sessions: PartialProfile<Profile>[];
  sessionGroups: PartialProfileGroup<ProfileGroup>[];

  async ngOnInit() {
    this.sessions = await this.sessionsService.getProfiles();
    this.sessionGroups = await this.sessionsService.getProfileGroups();
    this.sessionTypes = [...new Set(this.sessions.map((item) => item.type))];
  }
  apply() {
    this.highlightService.saveConfig();
    this.verify();
  }
  verify() {
    this.highlightVerify();
    this.replaceVerify();
  }

  get currentHighlightProfileIndex() {
    return this.highlightService.getCurrentHighlightProfileIndex();
  }

  set currentHighlightProfileIndex(value) {
    this.highlightService.setCurrentHighlightProfileByIndex(value);
  }

  importHighlightProfile(id?: string) {
    this.highlightService.importHighlightProfile(id);
    this.verify();
  }

  exportHighlightProfile(id?: string) {
    this.highlightService.exportHighlightProfile(id);
  }

  highlightVerify() {
    this.verifyStatus = [];
    for (const profile of this.pluginConfig.highlightProfiles) {
      const { keywords } = profile;
      const profileStatus = [];
      for (const keyword of keywords) {
        let status = true;
        let errInfo = "";
        const { isJS, isRegExp, text } = keyword;

        if (isJS) {
          try {
            const highlightFunc = new Function(`${text}; return highlight;`)();
          } catch (e) {
            errInfo = e.message;
            status = false;
          }
        } else if (isRegExp) {
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
      this.highlightService.getCurrentHighlightProfile().keywords,
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }

  dropProfile(event: CdkDragDrop<HighlightProfile[]>) {
    moveItemInArray(
      this.highlightService.getHighlightProfiles(),
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }

  getThemeColor(color: number | "foreground" | "background" | "cursor" | "palette") {
    const schema = this.currentTheme === "light" ? "lightColorScheme" : "colorScheme";
    const colorSchema = this.config.store.terminal[schema];
    if (typeof color === "number") {
      return colorSchema.colors[color];
    } else if (color === "foreground") {
      return colorSchema.foreground;
    } else if (color === "background") {
      return colorSchema.background;
    } else if (color === "cursor") {
      return colorSchema.cursor;
    } else {
      return colorSchema.colors[0];
    }
  }

  getPalette() {
    const schema = this.currentTheme === "light" ? "lightColorScheme" : "colorScheme";
    const colorSchema = this.config.store.terminal[schema].colors;
    return colorSchema;
  }

  getForegroundColor(item: HighlightKeyword): string {
    if (item.foreground) {
      const { foregroundColor = "0" } = item;
      const fgIndex = parseInt(foregroundColor);
      if (isNaN(fgIndex)) {
        try {
          const color = Color(foregroundColor).hex();
          return color;
        } catch (e) {
          //假装捕获了异常喵
        }
      } else if (fgIndex >= 16) {
        try {
          const color = Color.ansi256(fgIndex).hex();
          return color;
        } catch (e) {
          //假装捕获了异常喵
        }
      } else {
        return this.getThemeColor(fgIndex);
      }
    }
    return item.inverse ? this.getThemeColor("foreground") : this.getThemeColor(0);
  }

  getBackgroundColor(item: HighlightKeyword): string {
    if (item.background) {
      const { backgroundColor = "1" } = item;
      const bgIndex = parseInt(backgroundColor);
      if (isNaN(bgIndex)) {
        try {
          const color = Color(backgroundColor).hex();
          return color;
        } catch (e) {
          //假装捕获了异常喵
        }
      } else if (bgIndex >= 16) {
        try {
          const color = Color.ansi256(bgIndex).hex();
          return color;
        } catch (e) {
          //假装捕获了异常喵
        }
      } else {
        return this.getThemeColor(bgIndex);
      }
    }
    return "transparent";
  }

  getUnderlineStyle(item: HighlightKeyword): string {
    const { underline, underlineStyle = 1 } = item;
    const styles = ["", "solid", "double", "wavy", "dotted", "dashed"];
    if (underline) {
      return styles[underlineStyle];
    } else {
      return "";
    }
  }

  addHighlightProfile(event: MouseEvent) {
    event.preventDefault();
    this.highlightService.addHighlightProfile();
    this.verify();
  }

  async delHighlightProfile(event: MouseEvent, profile: HighlightProfile) {
    if (this.highlightService.getHighlightProfiles().length > 1) {
      const modal = this.ngbModal.open(ProfileDeleteModalComponent);
      modal.componentInstance.prompt = `${this.translate.instant("Delete")} ${
        profile.name
      }${this.translate.instant("?")}`;

      try {
        const result = await modal.result.catch(() => null);
        if (result === true) {
          this.highlightService.delHighlightProfile(profile);
          this.verify();
        }
      } catch {}
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  addKeyword() {
    this.highlightService.addHighlightKeyword();
    this.verify();
  }

  async editKeyword(event: MouseEvent, keyword: HighlightKeyword) {
    const modal = this.ngbModal.open(PatternEditorModalComponent);
    modal.componentInstance.code = keyword.text;
    if (keyword.isJS) {
      modal.componentInstance.type = "javascript";
    }
    try {
      const result = await modal.result.catch(() => null);
      if (typeof result === "string") {
        keyword.text = result;
        this.apply();
      }
    } catch {}
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  delKeyword(i: number) {
    this.highlightService.delHighlightKeyword(i);
    this.verify();
  }

  onHighlightProfileChange(changeEvent: NgbNavChangeEvent) {
    this.currentHighlightProfileIndex = changeEvent.nextId;
    this.verify();
  }

  async renameHighlightProfile(event: MouseEvent, profile: HighlightProfile) {
    const modal = this.ngbModal.open(PromptModalComponent);
    modal.componentInstance.prompt = this.translate.instant("Profile name");
    modal.componentInstance.value = profile.name;
    modal.componentInstance.password = false;
    try {
      const result = await modal.result.catch(() => null);
      if (result?.value) {
        profile.name = result.value;
        this.apply();
      }
    } catch {}

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  addHighlightPerSessionProfileMap() {
    this.highlightService.addHighlightPerSessionProfileMap();
  }

  delPerSessionProfile(i: number) {
    this.highlightService.delHighlightPerSessionProfileMapByIndex(i);
  }

  addHighlightPerSessionGroupProfile() {
    this.highlightService.addHighlightPerSessionGroupProfileMap();
  }

  delPerSessionGroupProfile(i: number) {
    this.highlightService.delHighlightPerSessionGroupProfileMapByIndex(i);
  }

  addHighlightPerSessionTypeProfile() {
    this.highlightService.addHighlightPerSessionTypeProfileMap();
  }

  delPerSessionTypeProfile(i: number) {
    this.highlightService.delHighlightPerSessionTypeProfileMapByIndex(i);
  }

  getSessions(sessionId: string) {
    if (!this.sessions) {
      return [];
    }
    return this.sessions.filter(
      (all) =>
        !this.pluginConfig.highlightPerSessionProfileMap.some(
          (exist) => exist.sessionId === all.id
        ) || all.id === sessionId
    );
  }

  getSessionGroups(groupId) {
    if (!this.sessionGroups) {
      return [];
    }
    return this.sessionGroups.filter(
      (all) =>
        !this.pluginConfig.highlightPerSessionGroupProfileMap.some(
          (exist) => exist.groupId === all.id
        ) || all.id === groupId
    );
  }
  getSessionTypes(typeId) {
    if (!this.sessions) {
      return [];
    }

    return this.sessionTypes.filter(
      (all) =>
        !this.pluginConfig.highlightPerSessionTypeProfileMap.some(
          (exist) => exist.typeId === all
        ) || all === typeId
    );
  }

  // Replace

  get currentReplaceProfileIndex() {
    return this.highlightService.getCurrentReplaceProfileIndex();
  }

  set currentReplaceProfileIndex(value) {
    this.highlightService.setCurrentReplaceProfileByIndex(value);
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
        const { isJS, isRegExp, search } = pattern;
        if (isJS) {
          try {
            const replaceFunc = new Function(`${search}; return replace;`)();
          } catch (e) {
            errInfo = e.message;
            status = false;
          }
        } else if (isRegExp) {
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
    this.currentReplaceProfileIndex = changeEvent.nextId;
    this.apply();
  }

  dropReplaceProfile(event: CdkDragDrop<ReplaceProfile[]>) {
    moveItemInArray(this.pluginConfig.replaceProfiles, event.previousIndex, event.currentIndex);
    this.apply();
  }

  dropReplacePattern(event: CdkDragDrop<ReplacePattern[]>) {
    moveItemInArray(
      this.pluginConfig.replaceProfiles[this.currentReplaceProfileIndex].patterns,
      event.previousIndex,
      event.currentIndex
    );
    this.apply();
  }

  addReplaceProfile(event: MouseEvent) {
    event.preventDefault();
    this.highlightService.addReplaceProfile();
    this.verify();
  }

  async editReplaceSearchPattern(event: MouseEvent, pattern: ReplacePattern) {
    const modal = this.ngbModal.open(PatternEditorModalComponent);
    modal.componentInstance.code = pattern.search;
    if (pattern.isJS) {
      modal.componentInstance.type = "javascript";
    }
    try {
      const result = await modal.result.catch(() => null);
      if (typeof result === "string") {
        pattern.search = result;
        this.apply();
      }
    } catch {}
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  async editReplaceReplacePattern(event: MouseEvent, pattern: ReplacePattern) {
    const modal = this.ngbModal.open(PatternEditorModalComponent);
    modal.componentInstance.code = pattern.replace;
    try {
      const result = await modal.result.catch(() => null);
      if (typeof result === "string") {
        pattern.replace = result;
        this.apply();
      }
    } catch {}
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  async delReplaceProfile(event: MouseEvent, profile: ReplaceProfile) {
    if (this.highlightService.getReplaceProfiles().length > 1) {
      const modal = this.ngbModal.open(ProfileDeleteModalComponent);
      modal.componentInstance.prompt = `${this.translate.instant("Delete")} ${
        profile.name
      }${this.translate.instant("?")}`;

      try {
        const result = await modal.result.catch(() => null);
        if (result === true) {
          this.highlightService.delReplaceProfile(profile);
        }
      } catch {}
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  async renameReplaceProfile(event: MouseEvent, profile: ReplaceProfile) {
    const modal = this.ngbModal.open(PromptModalComponent);
    modal.componentInstance.prompt = this.translate.instant("Profile name");
    modal.componentInstance.value = profile.name;
    modal.componentInstance.password = false;
    try {
      const result = await modal.result.catch(() => null);
      if (result?.value) {
        profile.name = result.value;
        this.apply();
      }
    } catch {}
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  addReplacePattern() {
    this.highlightService.addReplacePattern();
    this.verify();
  }

  delReplacePattern(i: number) {
    this.highlightService.delReplacePattern(i);
    this.verify();
  }

  importReplaceProfile(id?: string) {
    this.highlightService.importReplaceProfile(id);
    this.verify();
  }

  exportReplaceProfile(id?: string) {
    this.highlightService.exportReplaceProfile(id);
  }
}
