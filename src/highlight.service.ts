import { Injectable } from "@angular/core";
import fs from "fs";
import { ToastrService } from "ngx-toastr";
import {
  AppService,
  ConfigService,
  LogService,
  Logger,
  SplitTabComponent,
  TranslateService,
} from "tabby-core";
import { ElectronHostWindow, ElectronService } from "tabby-electron";
import { BaseTerminalTabComponent } from "tabby-terminal";
import * as uuid from "uuid";
import {
  HighlightEngagedTab,
  HighlightKeyword,
  HighlightPluginConfig,
  HighlightProfile,
  ReplacePattern,
  ReplaceProfile,
} from "./api";
import { translations } from "./translations";

const nullProfile: HighlightProfile = { id: uuid.NIL, name: "Disable highlight", keywords: [] };

@Injectable({ providedIn: "root" })
export class HighlightService {
  private logger: Logger;
  private pluginConfig: HighlightPluginConfig;
  constructor(
    public config: ConfigService,
    private logService: LogService,
    private translate: TranslateService,
    private electron: ElectronService,
    private hostWindow: ElectronHostWindow,
    private toastr: ToastrService,
    private app: AppService,
  ) {
    this.logger = this.logService.create("tabby-highlight");
    this.logger.info("HighlightService ctor");
    this.config.ready$.subscribe(() => {
      this.logger.info("config ready");
      setImmediate(() => {
        for (const translation of translations) {
          const [lang, trans] = translation;
          this.translate.setTranslation(lang, trans, true);
          this.logger.info("translate applied");
        }
      });
      // this.upgrade();

      this.pluginConfig = this.config.store.highlightPlugin;
    });
  }

  // 高亮相关方法喵
  getHighlightProfiles(appendNil?: boolean) {
    if (appendNil) {
      return [nullProfile].concat(this.pluginConfig.highlightProfiles);
    }
    return this.pluginConfig.highlightProfiles;
  }

  getCurrentHighlightProfile() {
    return this.getHighlightProfileById(this.pluginConfig.highlightCurrentProfile);
  }

  setCurrentHighlightProfileById(id: string) {
    this.pluginConfig.highlightCurrentProfile = id;
    this.logger.info(`Highlight profile switched to [${id}]`);
    this.saveConfig();
  }
  getCurrentHighlightProfileIndex() {
    return this.getHighlightProfileIndexById(this.pluginConfig.highlightCurrentProfile);
  }
  setCurrentHighlightProfileByIndex(i: number) {
    this.setCurrentHighlightProfileById(this.pluginConfig.highlightProfiles[i].id);
  }
  getHighlightProfileIndexById(id: string) {
    let currentIndex = 0;
    const result = this.pluginConfig.highlightProfiles.find((value, index) => {
      currentIndex = index;
      return value.id === this.pluginConfig.highlightCurrentProfile;
    });

    return currentIndex;
  }
  getHighlightProfileById(id: string) {
    if (id === uuid.NIL) {
      return nullProfile;
    }
    return this.pluginConfig.highlightProfiles.find((profile) => profile.id === id);
  }
  getHighlightProfileBySessionId(sessionId: string) {
    return this.getHighlightProfileById(
      this.pluginConfig.highlightPerSessionProfileMap.find((map) => map.sessionId === sessionId)
        ?.profileId,
    );
  }
  getHighlightProfileBySessionGroupId(groupId: string) {
    return this.getHighlightProfileById(
      this.pluginConfig.highlightPerSessionGroupProfileMap.find((map) => map.groupId === groupId)
        ?.profileId,
    );
  }
  getHighlightProfileBySessionTypeId(typeId: string) {
    return this.getHighlightProfileById(
      this.pluginConfig.highlightPerSessionTypeProfileMap.find((map) => map.typeId === typeId)
        ?.profileId,
    );
  }

  setHighlightProfile(profile: HighlightProfile, newProfile: HighlightProfile, targetId?: string) {
    const targetProfile = targetId ? this.getHighlightProfileById(targetId) : profile;
    Object.assign(targetProfile, newProfile);
    this.logger.info(`Highlight profile [${targetProfile.id}] modified`);
    this.saveConfig();
  }

  // 单会话相关方法喵
  addHighlightPerSessionProfileMap(sessionId: string = uuid.NIL, profileId: string = uuid.NIL) {
    this.pluginConfig.highlightPerSessionProfileMap.push({
      sessionId,
      profileId,
    });
    this.saveConfig();
  }
  delHighlightPerSessionProfileMapByIndex(i: number) {
    this.pluginConfig.highlightPerSessionProfileMap.splice(i, 1);
    this.saveConfig();
  }

  setHighlightPerSessionProfileMap(sessionId: string, profileId: string = uuid.NIL) {
    const profileMap = this.getHighlightPerSessionProfileMap(sessionId);
    if (profileMap) {
      profileMap.profileId = profileId;
      this.saveConfig();
    } else {
      this.addHighlightPerSessionProfileMap(sessionId, profileId);
    }
  }
  getHighlightPerSessionProfileMap(sessionId: string) {
    return this.pluginConfig.highlightPerSessionProfileMap.find(
      (mapValue) => mapValue.sessionId === sessionId,
    );
  }

  // 单会话分组相关方法喵
  addHighlightPerSessionGroupProfileMap(groupId: string = uuid.NIL, profileId: string = uuid.NIL) {
    this.pluginConfig.highlightPerSessionGroupProfileMap.push({
      groupId,
      profileId,
    });
    this.saveConfig();
  }
  delHighlightPerSessionGroupProfileMapByIndex(i: number) {
    this.pluginConfig.highlightPerSessionGroupProfileMap.splice(i, 1);
    this.saveConfig();
  }

  setHighlightPerSessionGroupProfileMap(groupId: string, profileId: string = uuid.NIL) {
    const profileMap = this.getHighlightPerSessionGroupProfileMap(groupId);
    if (profileMap) {
      profileMap.profileId = profileId;
      this.saveConfig();
    } else {
      this.addHighlightPerSessionGroupProfileMap(groupId, profileId);
    }
  }
  getHighlightPerSessionGroupProfileMap(groupId: string) {
    return this.pluginConfig.highlightPerSessionGroupProfileMap.find(
      (mapValue) => mapValue.groupId === groupId,
    );
  }

  // 单会话类型相关方法喵
  addHighlightPerSessionTypeProfileMap(typeId: string = uuid.NIL, profileId: string = uuid.NIL) {
    this.pluginConfig.highlightPerSessionTypeProfileMap.push({
      typeId,
      profileId,
    });
    this.saveConfig();
  }
  delHighlightPerSessionTypeProfileMapByIndex(i: number) {
    this.pluginConfig.highlightPerSessionTypeProfileMap.splice(i, 1);
    this.saveConfig();
  }

  setHighlightPerSessionTypeProfileMap(typeId: string, profileId: string = uuid.NIL) {
    const profileMap = this.getHighlightPerSessionTypeProfileMap(typeId);
    if (profileMap) {
      profileMap.profileId = profileId;
      this.saveConfig();
    } else {
      this.addHighlightPerSessionTypeProfileMap(typeId, profileId);
    }
  }
  getHighlightPerSessionTypeProfileMap(typeId: string) {
    return this.pluginConfig.highlightPerSessionTypeProfileMap.find(
      (mapValue) => mapValue.typeId === typeId,
    );
  }

  addHighlightKeyword(id?: string) {
    const newKeyword: HighlightKeyword = {
      text: "INFO",
      enabled: false,
      background: true,
      backgroundColor: "1",
      foregroundColor: "0",
    };
    const targetProfile = id ? this.getHighlightProfileById(id) : this.getCurrentHighlightProfile();
    targetProfile.keywords.unshift(newKeyword);
    this.logger.info(`Highlight profile [${targetProfile.id}] keyword added`);
    this.saveConfig();
  }

  delHighlightKeyword(i: number, id?: string) {
    const targetProfile = id ? this.getHighlightProfileById(id) : this.getCurrentHighlightProfile();
    targetProfile.keywords.splice(i, 1);
    this.saveConfig();
  }

  addHighlightProfile() {
    const newProfile: HighlightProfile = {
      id: uuid.v4(),
      name: `Profile ${this.pluginConfig.highlightProfiles.length}`,
      keywords: [],
    };
    this.pluginConfig.highlightProfiles.push(newProfile);
    // this.pluginConfig.highlightCurrentProfile = newProfile.id;
    this.logger.info(`Highlight profile [${newProfile.id}] added`);
    this.saveConfig();
    this.setCurrentHighlightProfileById(newProfile.id);
  }

  delHighlightProfile(profile: HighlightProfile) {
    const currentIndex =
      this.getCurrentHighlightProfile().id === profile.id
        ? this.getCurrentHighlightProfileIndex() - 1
        : this.getCurrentHighlightProfileIndex();
    this.pluginConfig.highlightProfiles = this.pluginConfig.highlightProfiles.filter(
      (item) => item.id !== profile.id,
    );

    this.logger.info(`Highlight profile [${profile.id}] deleted`);
    this.saveConfig();
    this.setCurrentHighlightProfileByIndex(currentIndex);
  }

  importHighlightProfile(id?: string) {
    this.importProfile((data) => {
      const importedProfile: HighlightProfile = data;
      importedProfile.id = id ? id : this.getCurrentHighlightProfile().id;
      this.setHighlightProfile(this.getCurrentHighlightProfile(), importedProfile, id);
      this.logger.info(`Highlight profile [${importedProfile.id}] imported`);
    });
  }
  exportHighlightProfile(id?: string) {
    this.exportProfile(id ? this.getHighlightProfileById(id) : this.getCurrentHighlightProfile());

    this.logger.info(
      `Highlight profile [${id ?? this.pluginConfig.highlightCurrentProfile}] exported`,
    );
  }

  // 替换相关方法
  getReplaceProfiles(appendNil?: boolean) {
    if (appendNil) {
      return [{ id: uuid.NIL, name: this.translate.instant("Disable Replace") }].concat(
        this.pluginConfig.replaceProfiles,
      );
    }
    return this.pluginConfig.replaceProfiles;
  }

  getCurrentReplaceProfile() {
    return this.getReplaceProfileById(this.pluginConfig.replaceCurrentProfile);
  }

  setCurrentReplaceProfileById(id: string) {
    this.pluginConfig.replaceCurrentProfile = id;
    this.logger.info(`Replace profile switched to [${id}]`);
    this.saveConfig();
  }

  getCurrentReplaceProfileIndex() {
    return this.getReplaceProfileIndexById(this.pluginConfig.replaceCurrentProfile);
  }
  setCurrentReplaceProfileByIndex(i: number) {
    this.setCurrentReplaceProfileById(this.pluginConfig.replaceProfiles[i].id);
  }

  getReplaceProfileIndexById(id: string) {
    let currentIndex = 0;
    const result = this.pluginConfig.replaceProfiles.find((value, index) => {
      currentIndex = index;
      return value.id === this.pluginConfig.replaceCurrentProfile;
    });

    return currentIndex;
  }
  getReplaceProfileById(id: string) {
    return this.pluginConfig.replaceProfiles.find((profile) => profile.id === id);
  }

  setReplaceProfile(profile: ReplaceProfile, newProfile: ReplaceProfile, targetId?: string) {
    const targetProfile = targetId ? this.getReplaceProfileById(targetId) : profile;
    Object.assign(targetProfile, newProfile);
    this.logger.info(`Replace profile [${targetProfile.id}] modified`);
    this.saveConfig();
  }
  setReplaceProfileById(id: string, newProfile: ReplaceProfile) {
    return this.setReplaceProfile(this.getReplaceProfileById(id), newProfile);
  }

  addReplacePattern(id?: string) {
    const newPattern: ReplacePattern = {
      enabled: false,
      search: "INFO",
      replace: "信息",
    };
    const targetProfile = id ? this.getReplaceProfileById(id) : this.getCurrentReplaceProfile();

    targetProfile.patterns.unshift(newPattern);
    this.saveConfig();
  }

  delReplacePattern(i: number, id?: string) {
    const targetProfile = id ? this.getReplaceProfileById(id) : this.getCurrentReplaceProfile();
    targetProfile.patterns.splice(i, 1);
    this.saveConfig();
  }
  addReplaceProfile() {
    const newProfile = {
      id: uuid.v4(),
      name: `Profile ${this.pluginConfig.replaceProfiles.length}`,
      patterns: [],
    };
    this.pluginConfig.replaceProfiles.push(newProfile);
    // this.pluginConfig.replaceCurrentProfile = newProfile.id;
    this.logger.info(`Replace profile [${newProfile.id}] added`);
    this.saveConfig();
    this.setCurrentReplaceProfileById(newProfile.id);
  }

  delReplaceProfile(profile: ReplaceProfile) {
    const currentIndex =
      this.getCurrentReplaceProfile().id === profile.id
        ? this.getCurrentReplaceProfileIndex() - 1
        : this.getCurrentReplaceProfileIndex();
    this.pluginConfig.replaceProfiles = this.pluginConfig.replaceProfiles.filter(
      (item) => item.id !== profile.id,
    );

    this.logger.info(`Replace profile [${profile.id}] deleted`);
    this.saveConfig();
    this.setCurrentReplaceProfileByIndex(currentIndex);
  }

  importReplaceProfile(id?: string) {
    this.importProfile((data) => {
      const importedProfile: ReplaceProfile = data;
      importedProfile.id = id ? id : this.getCurrentReplaceProfile().id;
      this.setReplaceProfile(this.getCurrentReplaceProfile(), importedProfile, id);
      this.logger.info(`Replace profile [${importedProfile.id}] imported`);
    });
  }

  exportReplaceProfile(id?: string) {
    this.exportProfile(id ? this.getReplaceProfileById(id) : this.getCurrentReplaceProfile());

    this.logger.info(
      `Replace profile [${id ?? this.pluginConfig.highlightCurrentProfile}] exported`,
    );
  }

  importProfile(handler: (data: any) => void) {
    const paths = this.electron.dialog.showOpenDialogSync(this.hostWindow.getWindow(), {
      filters: [
        { name: "Profile", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile", "showHiddenFiles"],
    });
    if (paths && paths[0]) {
      const dataString = fs.readFileSync(paths[0]);
      const dataJSON = dataString.toString();
      const data = JSON.parse(dataJSON);
      handler(data);
      this.saveConfig();
    }
  }

  async exportProfile(data: any) {
    let dataJSON = JSON.stringify(data);

    const result = await this.electron.dialog.showSaveDialog(this.hostWindow.getWindow(), {
      filters: [
        { name: "Profile", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile", "showHiddenFiles"],
    });
    if (!result?.canceled) {
      const file = fs.writeFile(result.filePath, dataJSON, (err) => {});
    }
  }

  saveConfig() {
    this.config.save();
    this.logger.info(`Plugin settings saved`);
    this.applyPluginSettings();
  }

  injectProfilesToTab(
    tab: HighlightEngagedTab,
    highlightProfile?: HighlightProfile,
    replaceProfile?: ReplaceProfile,
  ) {
    // 将配置狠狠地注入到标签页喵，方便使用右键菜单切换喵~
    tab.highlightProfile = highlightProfile;
    tab.replaceProfile = replaceProfile;
  }

  injectHighlightToTab(tab: HighlightEngagedTab) {
    let highlightProfile: HighlightProfile;
    if (this.pluginConfig.highlightEnabled) {
      // 会话配置判定喵~
      if (!highlightProfile && this.pluginConfig.highlightPerSessionEnabled) {
        highlightProfile = this.getHighlightProfileBySessionId(tab.profile.id);
      }

      // 会话分组配置判定喵~
      if (!highlightProfile && this.pluginConfig.highlightPerSessionGroupEnabled) {
        highlightProfile = this.getHighlightProfileBySessionGroupId(tab.profile.group);
      }

      // 会话类型配置判定喵~
      if (!highlightProfile && this.pluginConfig.highlightPerSessionTypeEnabled) {
        highlightProfile = this.getHighlightProfileBySessionTypeId(tab.profile.type);
      }

      // 全局配置判定喵~
      if (!highlightProfile && this.pluginConfig.highlightGlobalEnabled) {
        highlightProfile = this.getCurrentHighlightProfile();
      }
    }

    let replaceProfile: ReplaceProfile;
    if (this.pluginConfig.replaceEnabled) {
      // 全局配置判定喵~
      if (!replaceProfile) {
        replaceProfile = this.getCurrentReplaceProfile();
      }
    }

    // 不存在的配置喵（通常没有这种情况喵，但万一捏？）
    if (!highlightProfile && !replaceProfile) {
      return;
    }
    this.injectProfilesToTab(tab, highlightProfile, replaceProfile);
  }

  applyPluginSettings() {
    for (const tab of this.app.tabs) {
      if (tab instanceof SplitTabComponent) {
        for (const subTab of tab.getAllTabs()) {
          if (subTab instanceof BaseTerminalTabComponent) {
            this.injectHighlightToTab(subTab);
          }
        }
      } else if (tab instanceof BaseTerminalTabComponent) {
        this.injectHighlightToTab(tab);
      }
    }
    this.logger.info(`Plugin settings applied`);
  }

  private upgrade() {
    if (this.config.store.highlightPlugin.highlightKeywords) {
      this.config.store.highlightPlugin.highlightProfiles = [
        {
          name: "Default",
          keywords: this.config.store.highlightPlugin.highlightKeywords,
        },
      ];
      this.config.store.highlightPlugin.highlightKeywords = undefined;
      this.config.save();
      this.logger.info("profile upgrade finished.");
    }
    let profileIdNeedUpgrade = false;
    for (const profile of this.config.store.highlightPlugin.highlightProfiles) {
      if (!profile.id) {
        profileIdNeedUpgrade = true;
        profile.id = uuid.v4();
      }
    }
    if (typeof this.config.store.highlightPlugin.highlightCurrentProfile === "number") {
      profileIdNeedUpgrade = true;
      this.config.store.highlightPlugin.highlightCurrentProfile =
        this.config.store.highlightPlugin.highlightProfiles[
          this.config.store.highlightPlugin.highlightCurrentProfile
        ].id;
    }
    if (profileIdNeedUpgrade) {
      this.config.save();
      this.logger.info("profile id upgrade finished.");
    }
  }
}
