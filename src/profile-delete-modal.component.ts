import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

/** @hidden */
@Component({
  template: require("./profile-delete-modal.component.pug"),
})
export class ProfileDeleteModalComponent {
  @Input() prompt: string | undefined;

  constructor(private modalInstance: NgbActiveModal) {}

  async ngOnInit(): Promise<void> {}

  ok() {
    this.modalInstance.close(true);
  }

  cancel(): void {
    this.modalInstance.close(false);
  }
}
