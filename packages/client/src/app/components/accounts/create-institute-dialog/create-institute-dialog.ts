import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { InstituteFormComponent } from '../../institutes/institute-form/institute-form.component';

@Component({
  selector: 'app-create-institute-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    InstituteFormComponent
  ],
  template: `
    <h2 mat-dialog-title>Add Institute</h2>
    <mat-dialog-content>
      <app-institute-form #formRef></app-institute-form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="formRef.invalid" (click)="submit()">Create</button>
    </mat-dialog-actions>
  `
})
export class CreateInstituteDialogComponent {
  private dialogRef = inject(MatDialogRef<CreateInstituteDialogComponent>);

  @ViewChild('formRef') formComponent!: InstituteFormComponent;

  submit() {
    if (this.formComponent.valid) {
      this.dialogRef.close(this.formComponent.value);
    }
  }
}
