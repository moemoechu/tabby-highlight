import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {} from "@codemirror/view";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { EditorView, basicSetup } from "codemirror";
import { ConfigService } from "tabby-core";
import beautify from "js-beautify";

const templates = [
  {
    name: `[Highlight]Return pos array`,
    mode: "highlight",
    code: `function highlight(input) {
  // Highlight odd number
  const pos = [];
  for (i = 0; i < input.length; i++) {
    const num = parseInt(input[i]);
    if (!isNaN(num) && num % 2 != 0) {
      pos.push(i);
    }
  }
  // Return position array contains char indexes to highlight
  return pos;
}`,
  },
  {
    name: `[Highlight]Return substring`,
    mode: "highlight",
    code: `function highlight(input) {
  // Highlight part of string
  const r = input.match(/".*?": "(.*?)"/);
  // Return a string, plugin will use this string to highlight
  return r[1].slice(3, 8);
}`,
  },
  {
    name: `[Highlight]Return regexp string`,
    mode: "highlight",
    code: `function highlight(input) {
  // Highlight JSON string type
  // Return regex string, plugin will use this regex to highlight
  // The regex checkbox must be checked
  return \`".*?": "(.*?)"\`;
}`,
  },
  {
    name: `[Highlight]Return regexp`,
    mode: "highlight",
    code: `function highlight(input) {
  // Highlight JSON string type
  // Return regex, plugin will use this regex to highlight
  // The regex and case sensitive checkbox is not effect this
  // gd flag is required, otherwise error may occur
  return /".*?": "(.*?)"/gd;
}}`,
  },
  {
    name: `[Replace]Return replaced string`,
    mode: "replace",
    code: `function replace(input) {
  // Return replaced string
  return input.replace("aaa", "bbb");
}`,
  },
  {
    name: `[Replace]Return string array`,
    mode: "replace",
    code: `function replace(input) {
  // Return strings: [ search, replace ]
  return [ "aaa", "bbb" ];
}`,
  },
  {
    name: `[Replace]Return regexp string array`,
    mode: "replace",
    code: `function replace(input) {
  // Return regexp strings: [ search, replace ]
  // The regex checkbox must be checked
  return ["Last login:\\\\s*(.*?)\\\\s*from\\\\s*(.*)", "杂鱼～上次是在 $1 从 $2 登录的♡"];
}`,
  },
  {
    name: `[Replace]Return regexp and string`,
    mode: "replace",
    code: `function replace(input) {
  // Return regexp strings: [ search, replace ]
  // The regex and case sensitive checkbox is not effect this
  // g flag is required, otherwise error may occur
  return [ /Last login:\\s*(.*?)\\s*from\\s*(.*)/g, "杂鱼～上次是在 $1 从 $2 登录的♡"];
}`,
  },
];

/** @hidden */
@Component({
  template: require("./pattern-editor-modal.component.html"),
  styles: [],
})
export class PatternEditorModalComponent {
  selectedTemplate = -1;
  constructor(public config: ConfigService, private modalInstance: NgbActiveModal) {}

  @ViewChild("editorContainer") editorContainer!: ElementRef;
  @Input() code: string = "";
  @Input() type: string = "plain";

  @Input() mode: "highlight" | "replace";

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

  getTemplate() {
    return templates.filter((item) => item.mode === this.mode);
  }

  applyTemplate(index: number) {
    if (index < 0) {
      return;
    }
    if (this.type !== "javascript") {
      return;
    }
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: this.getTemplate()[index].code,
      },
    });
  }

  format() {
    if (this.type !== "javascript") {
      return;
    }
    const code = this.editorView.state.doc.toString();
    const formattedCode = beautify(code, { indent_size: 2, space_before_conditional: true });
    if (code !== formattedCode) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: formattedCode,
        },
      });
    }
  }
  ok() {
    const newCode = this.editorView.state.doc.toString();
    this.modalInstance.close(newCode);
  }

  cancel(): void {
    this.modalInstance.close(this.code);
  }
}
