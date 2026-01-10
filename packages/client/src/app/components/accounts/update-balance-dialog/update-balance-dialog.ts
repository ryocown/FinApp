import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, DateAdapter } from '@angular/material/core';
import { Account, AccountType } from '@finapp/shared/models';
import { AccountService } from '../../../services/account';

export interface EditAccountDialogData {
  account: Account;
  userId: string;
}

@Component({
  selector: 'app-update-balance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
  ],
  template: `
    <h2 mat-dialog-title>Update Balance</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <p class="text-[var(--mat-sys-on-surface-variant)] text-sm mb-2">
            Update the balance for <strong>{{data.account.name}}</strong>.
        </p>

        <div class="flex flex-col gap-4">
            <mat-form-field class="w-full">
            <mat-label>New Balance</mat-label>
            <input matInput type="number" formControlName="balance">
            </mat-form-field>

            <mat-form-field class="w-full">
                <mat-label>Date of Balance</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="balanceDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
        </div>
        <mat-hint class="text-xs text-[var(--mat-sys-on-surface-variant)] mb-4 block">
            This will create a manual reconciliation adjustment in your history.
        </mat-hint>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || isSaving()" (click)="save()">
        {{ isSaving() ? 'Saving...' : 'Update' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field { width: 100%; }
  `]
})
export class UpdateBalanceDialogComponent {
  data = inject<EditAccountDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<UpdateBalanceDialogComponent>);
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);

  isSaving = signal(false);

  form = this.fb.group({
    balance: [this.data.account.balance, Validators.required],
    balanceDate: [this.data.account.balanceDate ? new Date(this.data.account.balanceDate) : new Date(), Validators.required],
  });

  save() {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    const formValue = this.form.value;

    const updates: Partial<Account> = {
      balance: Number(formValue.balance),
      balanceDate: formValue.balanceDate!,
    };

    this.accountService.updateAccount(this.data.userId, this.data.account.accountId, updates)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          console.error(err);
          this.isSaving.set(false);
        }
      });
  }
}
