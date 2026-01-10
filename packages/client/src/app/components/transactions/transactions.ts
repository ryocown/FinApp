import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../services/transaction';
import { AccountService } from '../../services/account';
import { InstituteService } from '../../services/institute';
import { AuthService } from '../../services/auth.service';
import { ITransaction, Account, TransactionProcessor, ParsedTransaction } from '@finapp/shared/models';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateTransactionDialogComponent } from './create-transaction-dialog/create-transaction-dialog';

import { EditTransactionDialogComponent } from './edit-transaction-dialog/edit-transaction-dialog';

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class TransactionsComponent {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private instituteService = inject(InstituteService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['date', 'merchant', 'category', 'amount'];
  transactions = signal<ITransaction[]>([]);
  authService = inject(AuthService);
  accountId = signal<string | undefined>(undefined);

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.accountId.set(params['account']);
    });

    // Ensure metadata is loaded for matching
    // Use effect to load data when user is available
    effect(() => {
      const uid = this.authService.user()?.uid;
      if (uid) {
        this.accountService.getAccounts(uid).subscribe();
        this.instituteService.getInstitutes(uid).subscribe();
        this.loadTransactions(this.accountId());
      }
    });
  }

  loadTransactions(accountId?: string) {
    const uid = this.authService.user()?.uid;
    if (!uid) return;
    this.transactionService.getTransactions(uid, accountId).subscribe(data => {
      this.transactions.set(data || []);
    });
  }

  getMerchantName(txn: ITransaction): string {
    if ('merchant' in txn) {
      return (txn as any).merchant?.name || 'Unknown Merchant';
    }
    return 'Unknown';
  }

  getCategoryName(txn: ITransaction): string {
    return txn.categoryId || (txn as any).category || 'Uncategorized';
  }

  openImportDialog() {
    const currentAccountId = this.accountId();
    const account = this.accountService.accounts().find(a => a.accountId === currentAccountId);
    const institute = account ? this.instituteService.institutes().find(i => i.instituteId === account.instituteId) : undefined;

    // ImportTransactionDialog now handles null account/institute gracefully (global import style)
    // If we have context, we pass it to pre-fill.

    // Lazy load the component import if needed, but here we just import it at top
    import('../transactions/import-transaction-dialog/import-transaction-dialog').then(({ ImportTransactionDialogComponent }) => {
      this.dialog.open(ImportTransactionDialogComponent, {
        width: '800px',
        data: {
          account,
          instituteName: institute?.name,
          userId: this.authService.user()?.uid
        }
      }).afterClosed().subscribe(() => {
        // Refresh transactions after import
        this.loadTransactions(this.accountId());
      });
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateTransactionDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Fix Payload to match Zod Schema
        const newTxn: any = {
          date: (result.date as Date).toISOString(), // Convert Date to String
          amount: Number(result.amount),
          description: result.description, // Schema expects 'description'
          categoryId: result.category, // Assuming dialog returns ID or Name
          userId: this.authService.user()?.uid,
          accountId: result.accountId,
          currency: { code: 'USD', symbol: '$', name: 'US Dollar' }
        };

        // Remove merchant object if it causes validation error, relying on description
        // merchant: { name: result.description ... } // Removed

        this.transactionService.createTransaction(this.authService.user()!.uid, newTxn).subscribe({
          next: () => this.loadTransactions(this.accountId()),
          error: (err) => console.error('Failed to create transaction', err)
        });
      }
    });
  }

  openEditDialog(transaction: ITransaction) {
    const dialogRef = this.dialog.open(EditTransactionDialogComponent, {
      width: '600px',
      data: { transaction, userId: this.authService.user()?.uid }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'delete') {
        this.transactions.update(txs => txs.filter(t => t.transactionId !== result.transactionId));
      } else if (result.action === 'update') {
        this.transactions.update(txs => txs.map(t => t.transactionId === result.transaction.transactionId ? result.transaction : t));
      }
    });
  }
}
