// Copyright (c) 2017 VMware, Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewChecked,
  ChangeDetectorRef,
  OnDestroy
} from "@angular/core";
import { NgForm } from "@angular/forms";
import { Subscription } from "rxjs";
import { TranslateService } from "@ngx-translate/core";

import { EndpointService } from "../service/endpoint.service";
import { ErrorHandler } from "../error-handler/index";
import { InlineAlertComponent } from "../inline-alert/inline-alert.component";
import { Endpoint } from "../service/interface";
import { clone, compareValue, isEmptyObject } from "../utils";


const FAKE_PASSWORD = "rjGcfuRu";

@Component({
  selector: "hbr-create-edit-endpoint",
  templateUrl: "./create-edit-endpoint.component.html",
  styleUrls: ["./create-edit-endpoint.component.scss"]
})
export class CreateEditEndpointComponent
  implements AfterViewChecked, OnDestroy {
  modalTitle: string;
  createEditDestinationOpened: boolean;
  staticBackdrop: boolean = true;
  closable: boolean = false;
  editable: boolean;

  target: Endpoint = this.initEndpoint();
  initVal: Endpoint;

  targetForm: NgForm;
  @ViewChild("targetForm") currentForm: NgForm;

  testOngoing: boolean;
  onGoing: boolean;
  endpointId: number | string;

  @ViewChild(InlineAlertComponent) inlineAlert: InlineAlertComponent;

  @Output() reload = new EventEmitter<boolean>();

  timerHandler: any;
  valueChangesSub: Subscription;
  formValues: { [key: string]: string } | any;

  constructor(
    private endpointService: EndpointService,
    private errorHandler: ErrorHandler,
    private translateService: TranslateService,
    private ref: ChangeDetectorRef
  ) {}

  public get isValid(): boolean {
    return (
      !this.testOngoing &&
      !this.onGoing &&
      this.targetForm &&
      this.targetForm.valid &&
      this.editable &&
      !compareValue(this.target, this.initVal)
    );
  }

  public get inProgress(): boolean {
    return this.onGoing || this.testOngoing;
  }

  setInsecureValue($event: any) {
    this.target.insecure = !$event;
  }

  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
  }

  initEndpoint(): Endpoint {
    return {
      endpoint: "",
      name: "",
      username: "",
      password: "",
      insecure: false,
      type: 0
    };
  }

  open(): void {
    this.createEditDestinationOpened = true;
  }

  close(): void {
    this.createEditDestinationOpened = false;
  }

  reset(): void {
    // Reset status variables
    this.testOngoing = false;
    this.onGoing = false;

    // Reset data
    this.target = this.initEndpoint();
    this.initVal = this.initEndpoint();
    this.formValues = null;
    this.endpointId = "";

    this.inlineAlert.close();
  }

  // Forcely refresh the view
  forceRefreshView(duration: number): void {
    // Reset timer
    if (this.timerHandler) {
      clearInterval(this.timerHandler);
    }
    this.timerHandler = setInterval(() => this.ref.markForCheck(), 100);
    setTimeout(() => {
      if (this.timerHandler) {
        clearInterval(this.timerHandler);
        this.timerHandler = null;
      }
    }, duration);
  }

  openCreateEditTarget(editable: boolean, targetId?: number | string) {
    this.editable = editable;
    // reset
    this.reset();
    if (targetId) {
      this.endpointId = targetId;
      this.translateService
        .get("DESTINATION.TITLE_EDIT")
        .subscribe(res => (this.modalTitle = res));
      this.endpointService.getEndpoint(targetId)
        .subscribe(target => {
          this.target = target;
          // Keep data cache
          this.initVal = clone(target);
          this.initVal.password = FAKE_PASSWORD;
          this.target.password = FAKE_PASSWORD;

          // Open the modal now
          this.open();
          this.forceRefreshView(2000);
        }, error => this.errorHandler.error(error));
    } else {
      this.endpointId = "";
      this.translateService
        .get("DESTINATION.TITLE_ADD")
        .subscribe(res => (this.modalTitle = res));
      // Directly open the modal
      this.open();
    }
  }

  testConnection() {
    let payload: Endpoint = this.initEndpoint();
    if (!this.endpointId) {
      payload.endpoint = this.target.endpoint;
      payload.username = this.target.username;
      payload.password = this.target.password;
      payload.insecure = this.target.insecure;
    } else {
      let changes: { [key: string]: any } = this.getChanges();
      for (let prop of Object.keys(payload)) {
        delete payload[prop];
      }
      payload.id = this.target.id;
      if (!isEmptyObject(changes)) {
        let changekeys: { [key: string]: any } = Object.keys(this.getChanges());
        changekeys.forEach((key: string) => {
          payload[key] = changes[key];
        });
      }
    }

    this.testOngoing = true;
    this.endpointService.pingEndpoint(payload)
      .subscribe(response => {
        this.inlineAlert.showInlineSuccess({
          message: "DESTINATION.TEST_CONNECTION_SUCCESS"
        });
        this.forceRefreshView(2000);
        this.testOngoing = false;
      }, error => {
        this.inlineAlert.showInlineError("DESTINATION.TEST_CONNECTION_FAILURE");
        this.forceRefreshView(2000);
        this.testOngoing = false;
      });
  }

  onSubmit() {
    if (this.endpointId) {
      this.updateEndpoint();
    } else {
      this.addEndpoint();
    }
  }

  addEndpoint() {
    if (this.onGoing) {
      return; // Avoid duplicated submitting
    }

    this.onGoing = true;
    this.endpointService.createEndpoint(this.target)
      .subscribe(response => {
        this.translateService
          .get("DESTINATION.CREATED_SUCCESS")
          .subscribe(res => this.errorHandler.info(res));
        this.reload.emit(true);
        this.onGoing = false;
        this.close();
        this.forceRefreshView(2000);
      }, error => {
        this.onGoing = false;
        let errorMessageKey = this.handleErrorMessageKey(error.status);
        this.translateService.get(errorMessageKey).subscribe(res => {
          this.inlineAlert.showInlineError(res);
        });
        this.forceRefreshView(2000);
      });
  }

  updateEndpoint() {
    if (this.onGoing) {
      return; // Avoid duplicated submitting
    }

    let payload: Endpoint = this.initEndpoint();
    for (let prop of Object.keys(payload)) {
      delete payload[prop];
    }
    let changes: { [key: string]: any } = this.getChanges();
    if (isEmptyObject(changes)) {
      return;
    }
    let changekeys: { [key: string]: any } = Object.keys(changes);

    changekeys.forEach((key: string) => {
      payload[key] = changes[key];
    });

    if (!this.target.id) {
      return;
    }

    this.onGoing = true;
      this.endpointService.updateEndpoint(this.target.id, payload)
      .subscribe(response => {
        this.translateService
          .get("DESTINATION.UPDATED_SUCCESS")
          .subscribe(res => this.errorHandler.info(res));
        this.reload.emit(true);
        this.close();
        this.onGoing = false;
        this.forceRefreshView(2000);
      }, error => {
        let errorMessageKey = this.handleErrorMessageKey(error.status);
        this.translateService.get(errorMessageKey).subscribe(res => {
          this.inlineAlert.showInlineError(res);
        });
        this.onGoing = false;
        this.forceRefreshView(2000);
      });
  }

  handleErrorMessageKey(status: number): string {
    switch (status) {
      case 409:
        return "DESTINATION.CONFLICT_NAME";
      case 400:
        return "DESTINATION.INVALID_NAME";
      default:
        return "UNKNOWN_ERROR";
    }
  }

  onCancel() {
    let changes: { [key: string]: any } = this.getChanges();
    if (!isEmptyObject(changes)) {
      this.inlineAlert.showInlineConfirmation({
        message: "ALERT.FORM_CHANGE_CONFIRMATION"
      });
    } else {
      this.close();
      if (this.targetForm) {
        this.targetForm.reset();
      }
    }
  }

  confirmCancel(confirmed: boolean) {
    this.inlineAlert.close();
    this.close();
  }

  ngAfterViewChecked(): void {
    if (this.targetForm !== this.currentForm) {
      this.targetForm = this.currentForm;
      if (this.targetForm) {
        this.valueChangesSub = this.targetForm.valueChanges.subscribe(
          (data: { [key: string]: string } | any) => {
            if (data) {
              // To avoid invalid change publish events
              let keyNumber: number = 0;
              for (let key in data) {
                // Empty string "" is accepted
                if (data[key] !== null) {
                  keyNumber++;
                }
              }
              if (keyNumber !== 5) {
                return;
              }

              if (!compareValue(this.formValues, data)) {
                this.formValues = data;
                this.inlineAlert.close();
              }
            }
          }
        );
      }
    }
  }
  getChanges(): { [key: string]: any | any[] } {
    let changes: { [key: string]: any | any[] } = {};
    if (!this.target || !this.initVal) {
      return changes;
    }
    for (let prop of Object.keys(this.target)) {
      let field: any = this.initVal[prop];
      if (!compareValue(field, this.target[prop])) {
        changes[prop] = this.target[prop];
        // Number
        if (typeof field === "number") {
          changes[prop] = +changes[prop];
        }

        // Trim string value
        if (typeof field === "string") {
          changes[prop] = ("" + changes[prop]).trim();
        }
      }
    }

    return changes;
  }
}
