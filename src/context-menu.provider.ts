import { Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import {
  BaseTabComponent,
  ConfigService,
  MenuItemOptions,
  TabContextMenuItemProvider,
  TranslateService,
} from "tabby-core";
import { BaseTerminalTabComponent } from "tabby-terminal";
import { HighlightPluginConfig } from "./api";
import { HighlightService } from "./highlight.service";

@Injectable()
export class HighlightContextMenu extends TabContextMenuItemProvider {
  weight = 1;

  constructor(
    private highlightService: HighlightService,
    public config: ConfigService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  async getItems(tab: BaseTabComponent): Promise<MenuItemOptions[]> {
    const pluginConfig: HighlightPluginConfig = this.config.store.highlightPlugin;
    if (!(tab instanceof BaseTerminalTabComponent) || !pluginConfig.highlightEnabled) {
      return [];
    }

    return [
      {
        label: this.translate.instant("Highlight"),
        type: "submenu",
        submenu: this.highlightService.getHighlightProfiles(true).map((value) => ({
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
            this.highlightService.setHighlightPerSessionProfileMap(tab.profile.id, value.id);
          },
        })),
      },
    ];
  }
}
