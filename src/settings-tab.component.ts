import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component } from "@angular/core";
import { NgbModal, NgbNavChangeEvent } from "@ng-bootstrap/ng-bootstrap";
import fs from "fs";
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
} from "./config.provider";
import { ProfileDeleteModalComponent } from "./profile-delete-modal.component";
import { HighlightService } from "highlight.service";

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

  sessionTypes: string[];
  alertMessage: string;
  alertType: "info" | "success" | "danger";
  verifyStatus: [boolean, string][][];

  currentTheme: string;
  pluginConfig: HighlightPluginConfig;
  uuidNIL = uuid.NIL;
  // get highlightProfiles(): HighlightProfile[] {
  //   return this.highlightService.getHighlightProfiles();
  // }

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
    // this.config.save();
    this.highlightService.saveConfig();
    this.verify();
  }
  verify() {
    this.highlightVerify();
    this.replaceVerify();
  }

  get currentHighlightProfileIndex() {
    // let currentIndex = 0;
    // const result = this.pluginConfig.highlightProfiles.find((value, index) => {
    //   currentIndex = index;
    //   return value.id === this.pluginConfig.highlightCurrentProfile;
    // });

    // return currentIndex;
    return this.highlightService.getCurrentHighlightProfileIndex();
  }

  set currentHighlightProfileIndex(value) {
    // this.pluginConfig.highlightCurrentProfile = this.pluginConfig.highlightProfiles[value].id;
    // this.apply();
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

  getAnsiColorById(id: number) {
    const schema = this.currentTheme === "light" ? "lightColorScheme" : "colorScheme";
    const colorSchema = this.config.store.terminal[schema].colors;
    return colorSchema[id];
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
    // const profile = this.highlightService.getHighlightProfileById(id);
    modal.componentInstance.prompt = this.translate.instant("Profile name");
    modal.componentInstance.value = profile.name;
    modal.componentInstance.password = false;
    try {
      const result = await modal.result.catch(() => null);
      if (result?.value) {
        // this.pluginConfig.highlightProfiles[id].name = result.value;
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
    // let currentIndex = 0;
    // const result = this.pluginConfig.replaceProfiles.find((value, index) => {
    //   currentIndex = index;
    //   return value.id === this.pluginConfig.replaceCurrentProfile;
    // });

    // return currentIndex;
    return this.highlightService.getCurrentReplaceProfileIndex();
  }

  set currentReplaceProfileIndex(value) {
    // this.pluginConfig.replaceCurrentProfile = this.pluginConfig.replaceProfiles[value].id;
    // this.apply();

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
    // this.pluginConfig.replaceProfiles.push({
    //   id: uuid.v4(),
    //   name: `Profile ${this.pluginConfig.replaceProfiles.length}`,
    //   patterns: [],
    // });
    // this.currentReplaceProfileIndex = this.pluginConfig.replaceProfiles.length - 1;
    // this.apply();
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
          // this.pluginConfig.replaceProfiles = this.pluginConfig.replaceProfiles.filter(
          //   (item, index) => index !== toRemove
          // );
          // if (this.currentReplaceProfileIndex === this.pluginConfig.replaceProfiles.length) {
          //   this.currentReplaceProfileIndex -= 1;
          // }
          // this.apply();
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
    // const newPattern: ReplacePattern = {
    //   enabled: false,
    //   search: "INFO",
    //   replace: "信息",
    // };
    // this.pluginConfig.replaceProfiles[this.currentReplaceProfileIndex].patterns.unshift(newPattern);
    // this.apply();
    this.highlightService.addReplacePattern();
    this.verify();
  }

  delReplacePattern(i: number) {
    this.highlightService.delReplacePattern(i);
    this.verify();
  }
}
