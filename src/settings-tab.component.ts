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
      name: "Background Color",
      enabledModel: "background",
      valueType: "number",
      valueModel: "backgroundColor",
      min: 0,
      max: 15,
    },
    {
      name: "Foreground Color",
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

  sessionTypes: string[];
  alertMessage: string;
  alertType: "info" | "success" | "danger";
  verifyStatus: [boolean, string][][];

  currentTheme: string;
  pluginConfig: HighlightPluginConfig;
  uuidNIL = uuid.NIL;

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
    this.pluginConfig = this.config.store.highlightPlugin;
    this.verify();
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

  getAnsiColorById(id: number): string {
    const schema = this.currentTheme === "light" ? "lightColorScheme" : "colorScheme";
    const colorSchema = this.config.store.terminal[schema].colors;
    return colorSchema[id];
  }

  getForegroundColor(item: HighlightKeyword): string {
    if (item.foreground !== undefined) {
      if (item.foregroundColor !== undefined) {
        return this.getAnsiColorById(Number.parseInt(item.foregroundColor));
      }
      return this.getAnsiColorById(1);
    }
    return this.getAnsiColorById(0);
  }

  getBackgroundColor(item: HighlightKeyword): string {
    if (item.background !== undefined) {
      if (item.backgroundColor !== undefined) {
        return this.getAnsiColorById(Number.parseInt(item.backgroundColor));
      }
      return this.getAnsiColorById(1);
    }
    return "transparent";
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
