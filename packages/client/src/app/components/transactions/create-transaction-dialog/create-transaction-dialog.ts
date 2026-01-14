import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AccountService } from '../../../services/account';
import { AuthService } from '../../../services/auth.service';
import { Account, TransactionType } from '@finapp/shared/models';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-transaction-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule
  ],
  template: `
    <h2 mat-dialog-title>Add Transaction</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <mat-form-field>
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Type</mat-label>
          <mat-select formControlName="transactionType">
            <mat-option value="GENERAL">Bank Transaction</mat-option>
            <mat-option value="TRADE">Trade</mat-option>
            <mat-option value="TRANSFER">Transfer</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description (Merchant)</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Amount (Negative for expense)</mat-label>
          <input matInput type="number" formControlName="amount">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Balance (Optional)</mat-label>
          <input matInput type="number" formControlName="balance" placeholder="Running balance after this tx">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Category</mat-label>
          <input matInput formControlName="category">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Tags (comma separated)</mat-label>
          <input matInput formControlName="tags" placeholder="e.g. food, lunch">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Account</mat-label>
          <mat-select formControlName="accountId">
            @for (acc of accounts(); track acc.accountId) {
              <mat-option [value]="acc.accountId">{{ acc.name }}</mat-option>
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
export class CreateTransactionDialogComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private authService = inject(AuthService); // Inject Auth
  private dialogRef = inject(MatDialogRef<CreateTransactionDialogComponent>);

  // Use real user ID
  accounts = toSignal(this.accountService.getAccounts(this.authService.user()?.uid || ''), { initialValue: [] });

  form = this.fb.group({
    date: [new Date(), Validators.required],
    description: ['', Validators.required],
    amount: ['', Validators.required],
    balance: [''],
    category: ['Uncategorized'],
    accountId: ['', Validators.required],
    transactionType: [TransactionType.General, Validators.required],
    tags: ['']
  });

  submit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const tagIds = formValue.tags
        ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : [];

      const dateInput = formValue.date!;
      let finalDate = dateInput;
      const now = new Date();
      if (dateInput.getDate() === now.getDate() &&
        dateInput.getMonth() === now.getMonth() &&
        dateInput.getFullYear() === now.getFullYear()) {
        finalDate = now;
      }

      this.dialogRef.close({
        ...formValue,
        date: finalDate,
        tagIds
      });
    }
  }
}
