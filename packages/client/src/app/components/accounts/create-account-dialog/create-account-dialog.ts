import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { InstituteService } from '../../../services/institute';
import { AccountService } from '../../../services/account';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add Account</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          @if (form.get('name')?.hasError('duplicate')) {
            <mat-error>Name already exists in this institute</mat-error>
          }
           @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="Bank">Bank</mat-option>
            <mat-option value="Credit Card">Credit Card</mat-option>
            <mat-option value="Investment">Investment</mat-option>
            <mat-option value="Loan">Loan</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Balance</mat-label>
          <input matInput type="number" formControlName="balance">
        </mat-form-field>
        
        <mat-form-field>
          <mat-label>Currency</mat-label>
          <input matInput formControlName="currency" placeholder="USD">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Institute</mat-label>
          <mat-select formControlName="instituteId">
            @for (inst of institutes(); track inst.instituteId) {
              <mat-option [value]="inst.instituteId">{{ inst.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field { width: 100%; }
  `]
})
export class CreateAccountDialogComponent {
  private fb = inject(FormBuilder);
  private instituteService = inject(InstituteService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<CreateAccountDialogComponent>);

  institutes = toSignal(this.instituteService.getInstitutes(this.authService.user()?.uid || ''), { initialValue: [] });

  form = this.fb.group({
    name: ['', [Validators.required, this.uniqueNameValidator()]],
    type: ['Bank', Validators.required],
    balance: [0, Validators.required],
    currency: ['USD', Validators.required],
    instituteId: ['', Validators.required]
  });

  constructor() {
    // Re-validate name when institute changes
    this.form.get('instituteId')?.valueChanges.subscribe(() => {
      this.form.get('name')?.updateValueAndValidity();
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  uniqueNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const name = control.value?.trim().toLowerCase();
      // Access via this.form might be null during init, so use optional chaining or just rely on re-validation
      const instituteId = this.form?.get('instituteId')?.value; // Might be null initially

      if (!name || !instituteId) return null;

      const exists = this.accountService.accounts().some(a =>
        a.instituteId === instituteId && a.name.toLowerCase() === name
      );
      return exists ? { duplicate: true } : null;
    };
  }
}
