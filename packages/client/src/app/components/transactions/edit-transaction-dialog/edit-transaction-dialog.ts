import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TransactionProto, toDateProto } from '@finapp/shared/models';
import { TransactionService } from '../../../services/transaction';

export interface EditTransactionDialogData {
  transaction: TransactionProto;
  userId: string;
}

@Component({
  selector: 'app-edit-transaction-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Transaction</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <mat-form-field>
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount">
          <mat-hint>Negative for expenses, positive for income</mat-hint>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Category</mat-label>
          <input matInput formControlName="category">
        </mat-form-field>

        <mat-form-field>
            <mat-label>Tags (comma separated)</mat-label>
            <input matInput formControlName="tags" placeholder="e.g. food, lunch">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button color="warn" (click)="delete()" [disabled]="isSaving()">Delete</button>
      <span class="flex-1"></span>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || isSaving()" (click)="save()">
        {{ isSaving() ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field { width: 100%; }
  `]
})
export class EditTransactionDialogComponent {
  data = inject<EditTransactionDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<EditTransactionDialogComponent>);
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);

  isSaving = signal(false);

  form = this.fb.group({
    date: [new Date(this.data.transaction.date.timestamp), Validators.required],
    description: [this.data.transaction.description, Validators.required],
    amount: [this.data.transaction.amount, Validators.required],
    category: [(this.data.transaction as any).category?.name || this.data.transaction.categoryId || 'Uncategorized'],
    tags: [this.data.transaction.tagIds?.join(', ') || '']
  });

  save() {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    const formValue = this.form.value;

    const updates: Partial<TransactionProto> = {
      date: toDateProto(formValue.date!),
      description: formValue.description!,
      amount: Number(formValue.amount),
      tagIds: formValue.tags
        ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : []
    };

    this.transactionService.updateTransaction(this.data.userId, this.data.transaction.transactionId, updates)
      .subscribe({
        next: () => {
          const updatedTx = { ...this.data.transaction, ...updates };
          this.dialogRef.close({ action: 'update', transaction: updatedTx });
        },
        error: (err) => {
          console.error(err);
          this.isSaving.set(false);
          // Show error?
        }
      });
  }

  delete() {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    this.isSaving.set(true);
    this.transactionService.deleteTransaction(this.data.userId, this.data.transaction.transactionId)
      .subscribe({
        next: () => this.dialogRef.close({ action: 'delete', transactionId: this.data.transaction.transactionId }),
        error: (err) => {
          console.error(err);
          this.isSaving.set(false);
        }
      });
  }
}
