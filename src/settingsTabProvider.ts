import { Injectable } from "@angular/core";
import { SettingsTabProvider } from "tabby-settings";
import { HighlightSettingsTabComponent } from "./settingsTab.component";

/** @hidden */
@Injectable()
export class HighlightSettingsTabProvider extends SettingsTabProvider {
  id = "tabby-highlight";
  icon = "fa-solid fa-highlighter";
  title = "Highlight";

  constructor() {
    super();
  }

  getComponentType(): any {
    return HighlightSettingsTabComponent;
  }
}
