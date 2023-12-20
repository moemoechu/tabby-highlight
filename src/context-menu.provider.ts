import { Injectable } from "@angular/core";
import { HighlightPluginConfig } from "./config.provider";
import {
  BaseTabComponent,
  ConfigService,
  LogService,
  MenuItemOptions,
  SplitTabComponent,
  TabContextMenuItemProvider,
  TranslateService,
} from "tabby-core";
import { BaseTerminalTabComponent, ConnectableTerminalTabComponent } from "tabby-terminal";
import { ToastrService } from "ngx-toastr";

@Injectable()
export class HighlightContextMenu extends TabContextMenuItemProvider {
  weight = 1;

  constructor(
    public config: ConfigService,
    private logService: LogService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  async getItems(tab: BaseTabComponent): Promise<MenuItemOptions[]> {
    console.log(tab);
    if (!(tab instanceof BaseTerminalTabComponent)) {
      return [];
    }

    const pluginConfig: HighlightPluginConfig = this.config.store.highlightPlugin;
    return [
      {
        label: this.translate.instant("Highlight"),
        type: "submenu",
        submenu: pluginConfig.highlightProfiles.map((value) => ({
          type: "radio",
          label: value.name,
          checked: (tab as any).highlightProfile?.id === value.id,
          click: () => {
            if (!pluginConfig.highlightPerSessionEnabled) {
              this.toastr.warning(
                this.translate.instant(
                  "[Highlight] Can not change session profile due to per session profile not enabled"
                )
              );
              return;
            }
            const profileMap = pluginConfig.highlightPerSessionProfileMap.find(
              (mapValue) => mapValue.sessionId === tab.profile.id
            );
            if (profileMap) {
              profileMap.profileId = value.id;
            } else {
              pluginConfig.highlightPerSessionProfileMap.push({
                sessionId: tab.profile.id,
                profileId: value.id,
              });
            }
            (tab as any).highlightProfile = pluginConfig.highlightProfiles.find(
              (profileValue) => profileValue.id === value.id
            );
            this.config.save();
          },
        })),
      },
    ];
  }
}
