import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import TabbyCoreModule, {
  ConfigProvider,
  ConfigService,
  TabContextMenuItemProvider,
} from "tabby-core";
import { SettingsTabProvider } from "tabby-settings";
import { TerminalDecorator } from "tabby-terminal";

import { HighlightConfigProvider } from "./config.provider";
import { HighlightDecorator } from "./highlight.decorator";
import { HighlightService } from "./highlight.service";
import { HighlightSettingsTabComponent } from "./settings-tab.component";
import { HighlightSettingsTabProvider } from "./settings-tab.provider";
import { HighlightContextMenu } from "./context-menu.provider";

@NgModule({
  imports: [CommonModule, FormsModule, TabbyCoreModule, NgbModule],
  providers: [
    { provide: ConfigProvider, useClass: HighlightConfigProvider, multi: true },
    { provide: SettingsTabProvider, useClass: HighlightSettingsTabProvider, multi: true },
    { provide: TerminalDecorator, useClass: HighlightDecorator, multi: true },
    { provide: TabContextMenuItemProvider, useClass: HighlightContextMenu, multi: true },
  ],
  entryComponents: [HighlightSettingsTabComponent],
  declarations: [HighlightSettingsTabComponent],
})
export default class HighlightModule {
  constructor(public config: ConfigService, private highlight: HighlightService) {}
}
