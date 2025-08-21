import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, Input, Type, ViewChild } from "@angular/core";
import { NgbActiveModal, NgbModal, NgbNavChangeEvent } from "@ng-bootstrap/ng-bootstrap";
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
import Color from "color";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import {} from "@codemirror/view";
// import hljs from "highlight.js/lib/core";
// import javascript from "highlight.js/lib/languages/javascript";
// hljs.registerLanguage("javascript", javascript);

/** @hidden */
@Component({
  template: require("./pattern-editor-modal.component.html"),
  // styles: [require("./pattern-editor-modal.component.scss")],
  styles: [],
})
export class PatternEditorModalComponent {
  constructor(
    public config: ConfigService,
    private electron: ElectronService,
    private hostWindow: ElectronHostWindow,
    private toastr: ToastrService,
    private translate: TranslateService,
    private ngbModal: NgbModal,
    private sessionsService: ProfilesService,
    private highlightService: HighlightService,
    private modalInstance: NgbActiveModal,
  ) {
    console.log(this.type);
  }

  @ViewChild("editorContainer") editorContainer!: ElementRef;
  @Input() code: string = "";
  @Input() type: string = "plain";

  editorView: EditorView;

  ngAfterViewInit(): void {
    const extensions = [basicSetup, oneDark, EditorView.lineWrapping];

    if (this.type === "javascript") {
      extensions.push(javascript());
    }

    this.editorView = new EditorView({
      doc: this.code,
      parent: this.editorContainer.nativeElement,
      extensions,
    });
  }
  ok() {
    const newCode = this.editorView.state.doc.toString();
    this.modalInstance.close(newCode);
  }

  cancel(): void {
    this.modalInstance.close(this.code);
  }
}
