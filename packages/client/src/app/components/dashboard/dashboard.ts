
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AccountService } from '../../services/account';
import { AnalyticsService } from '../../services/analytics';
import { AuthService } from '../../services/auth.service';
import { InstituteService } from '../../services/institute';
import { Account, AccountType, Institute } from '@finapp/shared/models';
import { NetWorthChartComponent } from './net-worth-chart/net-worth-chart';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { CreateAccountDialogComponent } from '../accounts/create-account-dialog/create-account-dialog';
import { CreateInstituteDialogComponent } from '../accounts/create-institute-dialog/create-institute-dialog';
import { UpdateBalanceDialogComponent } from '../accounts/update-balance-dialog/update-balance-dialog';
import { Router } from '@angular/router';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NetWorthChartComponent, MatCardModule, MatButtonModule, MatButtonToggleModule, MatDialogModule, MatIconModule, MatCheckboxModule, MatListModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private accountService = inject(AccountService);
  private analyticsService = inject(AnalyticsService);
  private instituteService = inject(InstituteService);
  readonly dialog = inject(MatDialog);
  private router = inject(Router);
  authService = inject(AuthService);

  accounts = signal<Account[]>([]);
  institutes = signal<Institute[]>([]);
  rates = signal<Record<string, number>>({});
  netWorthHistory = signal<{ date: string; value: number }[]>([]);
  range = signal('30d');
  isLoading = signal(true);


  visibleAccountIds = signal<Set<string>>(new Set());

  // ... computed properties ...
  totalAssets = computed(() => {
    const accounts = this.accounts();
    console.log('[Dashboard] Calculating Assets. Total Accounts:', accounts.length);
    const assetAccounts = accounts.filter(a => ![AccountType.CREDIT_CARD, AccountType.LOAN].includes(a.type));
    console.log('[Dashboard] Asset Accounts:', assetAccounts);

    return assetAccounts.reduce((acc, curr) => {
      const val = this.getBalanceInUSD(curr);
      console.log(` -> Account ${curr.name} (${curr.currency.code}): Balance ${curr.balance} -> USD ${val}`);
      return acc + val;
    }, 0);
  });

  totalLiabilities = computed(() => {
    const accounts = this.accounts();
    const liabilityAccounts = accounts.filter(a => [AccountType.CREDIT_CARD, AccountType.LOAN].includes(a.type));
    console.log('[Dashboard] Liability Accounts:', liabilityAccounts);

    return liabilityAccounts.reduce((acc, curr) => {
      const val = this.getBalanceInUSD(curr);
      console.log(` -> Liability ${curr.name} (${curr.currency.code}): Balance ${curr.balance} -> USD ${val}`);
      return acc + val;
    }, 0) * -1;
  });

  netWorth = computed(() => {
    const val = this.totalAssets() - Math.abs(this.totalLiabilities());
    //   console.log('[Dashboard] Net Worth Updated:', val);
    return val;
  });

  // Grouped Accounts for Filter Card
  groupedAccounts = computed(() => {
    const groups: Record<string, Account[]> = {};
    const instituteMap = new Map(this.institutes().map(i => [i.instituteId, i.name]));

    this.accounts().forEach(acc => {
      const instituteName = acc.instituteId ? (instituteMap.get(acc.instituteId) || 'Other') : 'Other';
      if (!groups[instituteName]) groups[instituteName] = [];
      groups[instituteName].push(acc);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  });

  // Metrics
  burnRate = computed(() => {
    const history = this.netWorthHistory();
    if (history.length < 2) return 0;
    const current = history[history.length - 1].value;
    const start = history[0].value;
    // If we lost money, show it as positive burn rate
    return start > current ? (start - current) : 0;
  });

  futureWealth = computed(() => this.netWorth() * Math.pow(1.08, 10)); // +8% projection over 10y

  buyingPower = computed(() => {
    // Sum of Bank accounts (Liquid Cash)
    return this.accounts()
      .filter(a => a.type === AccountType.BANK)
      .reduce((sum, acc) => sum + this.getBalanceInUSD(acc), 0);
  });

  creditScore = computed(() => 785); // Still mocked as we don't have credit report API

  // MoM Changes
  netWorthMoM = computed(() => {
    const history = this.netWorthHistory();
    if (history.length < 2) return { value: 0, trend: 'flat' };

    const current = history[history.length - 1].value;
    const start = history[0].value;

    if (start === 0 && current === 0) return { value: 0, trend: 'flat' };
    if (start === 0) return { value: 100, trend: 'up' };

    const diffPercent = ((current - start) / start) * 100;
    return {
      value: Math.abs(Math.round(diffPercent * 10) / 10),
      trend: diffPercent >= 0 ? 'up' : 'down'
    };
  });

  // Assets/Liabilities MoM - Approximation based on current only (unavailable history)
  // We will hide or keep mocked for now, or just return 0 to avoid misleading "mock" data
  assetsMoM = computed(() => ({ value: 0, trend: 'flat' }));
  liabilitiesMoM = computed(() => ({ value: 0, trend: 'flat' }));

  constructor() {
    this.loadData();

    // Defer history loading slightly or let it run parallel via effect
    effect(() => {
      this.loadHistory(this.range());
    });
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      accounts: this.accountService.getAccounts(this.authService.user()!.uid),
      institutes: this.instituteService.getInstitutes(this.authService.user()!.uid),
      rates: this.analyticsService.getRates()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (results) => {
        this.accounts.set(results.accounts);
        this.institutes.set(results.institutes);
        this.rates.set(results.rates);

        console.group('Dashboard Data Load');
        console.log('Accounts API Response:', results.accounts);
        console.log('Institutes API Response:', results.institutes);
        console.log('Rates API Response:', results.rates);
        console.groupEnd();

        // Initialize all visible by default
        this.visibleAccountIds.set(new Set(results.accounts.map(a => a.accountId)));
      },
      error: (err) => console.error('Failed to load dashboard data', err)
    });
  }

  toggleAccount(accountId: string) {
    this.visibleAccountIds.update(ids => {
      const newSet = new Set(ids);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  }

  isAccountVisible(accountId: string): boolean {
    return this.visibleAccountIds().has(accountId);
  }

  loadHistory(range: string) {
    this.analyticsService.getNetWorthHistory(this.authService.user()!.uid, range).subscribe(data => {
      this.netWorthHistory.set(data);
    });
  }

  getBalanceInUSD(account: Account): number {
    const rates = this.rates();
    if (Object.keys(rates).length === 0) return account.balance || 0;

    if (account.currency.code === 'USD') return account.balance || 0;

    const pairId = account.currency.code < 'USD' ? `${account.currency.code} USD` : `USD${account.currency.code} `;
    const rate = rates[pairId];
    if (rate) {
      return (account.balance || 0) * rate;
    }
    return account.balance || 0;
  }

  setRange(r: string) {
    this.range.set(r);
  }
  openCreateInstituteDialog() {
    const dialogRef = this.dialog.open(CreateInstituteDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(name => {
      if (name) {
        this.instituteService.createInstitute(this.authService.user()!.uid, name).subscribe(() => this.loadData());
      }
    });
  }

  openCreateAccountDialog() {
    const dialogRef = this.dialog.open(CreateAccountDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newAccount: Partial<Account> = {
          ...result,
          currency: { code: result.currency, symbol: result.currency === 'USD' ? '$' : result.currency, name: result.currency },
          userId: this.authService.user()!.uid
        };
        this.accountService.createAccount(this.authService.user()!.uid, newAccount).subscribe(() => this.loadData());
      }
    });
  }

  navigateToAccount(accountId: string) {
    this.router.navigate(['/accounts', accountId]);
  }

  openUpdateBalanceDialog(account: Account) {
    const dialogRef = this.dialog.open(UpdateBalanceDialogComponent, {
      width: '400px',
      data: { account, userId: this.authService.user()!.uid }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

}
