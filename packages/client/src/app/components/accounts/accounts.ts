import { Component, inject, signal, effect, viewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Account, AccountType } from '@finapp/shared/models';
import { AccountService } from '../../services/account';
import { AuthService } from '../../services/auth.service';
import { CreateAccountDialogComponent } from './create-account-dialog/create-account-dialog';
import { UpdateBalanceDialogComponent } from './update-balance-dialog/update-balance-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CurrencyPipe
  ],
  templateUrl: './accounts.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AccountsComponent {
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  displayedColumns: string[] = ['name', 'balance', 'currency', 'actions'];
  dataSource = new MatTableDataSource<Account>([]);
  isLoading = signal(true);

  sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const uid = this.authService.user()?.uid;
      if (uid) {
        this.loadAccounts(uid);
      }
    });

    effect(() => {
      // Connect Sort when available
      const sort = this.sort();
      if (sort) {
        this.dataSource.sort = sort;
      }
    });
  }

  loadAccounts(userId: string) {
    this.isLoading.set(true);
    this.accountService.getAccounts(userId).subscribe({
      next: (accounts) => {
        this.dataSource.data = accounts;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.isLoading.set(false);
      }
    });
  }

  getIconForType(type: string): string {
    switch (type) {
      case AccountType.BANK: return 'account_balance';
      case AccountType.INVESTMENT: return 'trending_up';
      case AccountType.CREDIT_CARD: return 'credit_card';
      case AccountType.LOAN: return 'money_off';
      case AccountType.SUPERANNUATION: return 'savings';
      case AccountType.EMPLOYER: return 'work';
      default: return 'account_balance_wallet';
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateAccountDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const uid = this.authService.user()?.uid;
        if (!uid) return;

        const newAccount: Partial<Account> = {
          ...result,
          currency: { code: result.currency, symbol: result.currency === 'USD' ? '$' : result.currency, name: result.currency },
          userId: uid,
          balance: Number(result.balance) // Ensure balance is a number
        };
        // AccountService createAccount might expect strict typing, handle partial properly if needed
        // casting to any for quick fix if strict types complain about missing props
        this.accountService.createAccount(uid, newAccount as any).subscribe(() => this.loadAccounts(uid));
      }
    });
  }

  openUpdateBalanceDialog(account: Account) {
    const uid = this.authService.user()?.uid;
    if (!uid) return;

    const dialogRef = this.dialog.open(UpdateBalanceDialogComponent, {
      width: '400px',
      data: { account, userId: uid }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAccounts(uid);
      }
    });
  }
  navigateToAccount(accountId: string) {
    this.router.navigate(['/accounts', accountId]);
  }
}
