import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import TabbyCoreModule, { ConfigProvider, ConfigService } from "tabby-core";
import { SettingsTabProvider } from "tabby-settings";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { HighlightConfigProvider } from "./configProvider";
import { HighlightSettingsTabComponent } from "./settingsTab.component";
import { HighlightSettingsTabProvider } from "./settingsTabProvider";
import { HighlightDecorator } from "./highlight.decorator";
import { TerminalDecorator } from "tabby-terminal";
import { HighlightService } from "./highlight.service";

@NgModule({
  imports: [CommonModule, FormsModule, TabbyCoreModule, NgbModule],
  providers: [
    { provide: ConfigProvider, useClass: HighlightConfigProvider, multi: true },
    { provide: SettingsTabProvider, useClass: HighlightSettingsTabProvider, multi: true },
    { provide: TerminalDecorator, useClass: HighlightDecorator, multi: true },
  ],
  entryComponents: [HighlightSettingsTabComponent],
  declarations: [HighlightSettingsTabComponent],
})
export default class BackgroundModule {
  constructor(public config: ConfigService, private highlight: HighlightService) {}
}
