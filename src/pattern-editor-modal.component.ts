import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {} from "@codemirror/view";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { EditorView, basicSetup } from "codemirror";
import { ConfigService } from "tabby-core";
import beautify from "js-beautify";

/** @hidden */
@Component({
  template: require("./pattern-editor-modal.component.html"),
  styles: [],
})
export class PatternEditorModalComponent {
  constructor(
    public config: ConfigService,
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

  format() {
    if (this.type !== "javascript") {
      return;
    }
    const newCode = this.editorView.state.doc.toString();
    const formattedCode = beautify(newCode, { indent_size: 2, space_before_conditional: true });
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: formattedCode,
      },
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
