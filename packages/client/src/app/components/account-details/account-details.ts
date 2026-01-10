
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { AccountService } from '../../services/account';
import { TransactionService } from '../../services/transaction';
import { AuthService } from '../../services/auth.service';
import { Account, IBalanceCheckpoint, ITransaction } from '@finapp/shared/models';

import { MatDialog } from '@angular/material/dialog';
import { UpdateBalanceDialogComponent } from '../accounts/update-balance-dialog/update-balance-dialog';

@Component({
    selector: 'app-account-details',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        NgxChartsModule,
        CurrencyPipe,
        DatePipe
    ],
    templateUrl: './account-details.html',
    styleUrl: './account-details.css'
})
export class AccountDetailsComponent {
    private route = inject(ActivatedRoute);
    private accountService = inject(AccountService);
    private transactionService = inject(TransactionService);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);

    account = signal<Account | null>(null);
    checkpoints = signal<IBalanceCheckpoint[]>([]);
    transactions = signal<ITransaction[]>([]);

    // Chart Data
    chartData = signal<{ name: string, series: any[] }[]>([]);
    view: [number, number] = [700, 300];
    colorScheme: Color = {
        name: 'cool',
        selectable: true,
        group: ScaleType.Ordinal,
        domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
    };

    displayedColumns: string[] = ['date', 'description', 'amount', 'balance'];

    constructor() {
        this.route.params.subscribe(params => {
            const accountId = params['id'];
            if (accountId) {
                this.loadData(accountId);
            }
        });
    }

    loadData(accountId: string) {
        const userId = this.authService.user()?.uid;
        if (!userId) return;

        // Load Account
        this.accountService.getAccount(userId, accountId).subscribe({
            next: (data) => this.account.set(data),
            error: (err) => console.error('Failed to load account', err)
        });

        // Load Checkpoints
        this.accountService.getCheckpoints(userId, accountId).subscribe({
            next: (data) => {
                this.checkpoints.set(data);
                this.processChartData(data);
            },
            error: (err) => console.error('Failed to load checkpoints', err)
        });

        // Load Transactions
        this.transactionService.getTransactions(userId, accountId).subscribe({
            next: (data) => this.transactions.set(data),
            error: (err) => console.error('Failed to load transactions', err)
        });
    }

    processChartData(checkpoints: IBalanceCheckpoint[]) {
        // Sort by date asc
        const sorted = [...checkpoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const series = sorted.map(cp => ({
            name: new Date(cp.date),
            value: cp.balance
        }));

        this.chartData.set([{
            name: 'Balance',
            series
        }]);
    }

    openUpdateBalanceDialog() {
        const account = this.account();
        const userId = this.authService.user()?.uid;

        if (!account || !userId) return;

        this.dialog.open(UpdateBalanceDialogComponent, {
            width: '400px',
            data: { account, userId }
        }).afterClosed().subscribe(result => {
            if (result) {
                // Refresh data
                this.loadData(account.accountId);
            }
        });
    }
}
