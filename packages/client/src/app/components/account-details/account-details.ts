
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
import { InstituteService } from '../../services/institute';
import { Account, IBalanceCheckpoint, TransactionProto, Institute, SUPPORTED_INSTITUTES } from '@finapp/shared/models';

import { MatDialog } from '@angular/material/dialog';
import { UpdateBalanceDialogComponent } from '../accounts/update-balance-dialog/update-balance-dialog';
import { CreateTransactionDialogComponent } from '../transactions/create-transaction-dialog/create-transaction-dialog';
import { toDateProto } from '@finapp/shared/models';

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
    private instituteService = inject(InstituteService);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);

    account = signal<Account | null>(null);
    institute = signal<Institute | null>(null);
    checkpoints = signal<IBalanceCheckpoint[]>([]);
    transactions = signal<TransactionProto[]>([]);

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
            next: (data) => {
                this.account.set(data);
                if (data.instituteId) {
                    this.instituteService.getInstitutes(userId).subscribe(institutes => {
                        const match = institutes.find(i => i.instituteId === data.instituteId);
                        this.institute.set(match || null);
                    });
                }
            },
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

    get instituteLogo(): string | undefined {
        const inst = this.institute();
        if (!inst || !inst.supportedInstituteId) return undefined;
        const supported = SUPPORTED_INSTITUTES.find(s => s.supportedInstituteId === inst.supportedInstituteId);
        return supported?.logo;
    }

    processChartData(checkpoints: IBalanceCheckpoint[]) {
        // Sort by date asc
        const sorted = [...checkpoints].sort((a, b) => a.date.timestamp - b.date.timestamp);

        const series = sorted.map(cp => ({
            name: new Date(cp.date.timestamp),
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

    openAddTransactionDialog() {
        const account = this.account();
        const userId = this.authService.user()?.uid;
        if (!account || !userId) return;

        const dialogRef = this.dialog.open(CreateTransactionDialogComponent, {
            width: '400px'
            // We could pass accountId here if the dialog supported it
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const newTxn: any = {
                    date: toDateProto(result.date),
                    amount: Number(result.amount),
                    description: result.description,
                    categoryId: result.category,
                    userId,
                    accountId: result.accountId, // User selects account in dialog
                    currency: account.currency || { code: 'USD', symbol: '$', name: 'US Dollar' },
                    balance: result.balance ? Number(result.balance) : undefined
                };

                this.transactionService.createTransaction(userId, newTxn).subscribe({
                    next: () => this.loadData(account.accountId),
                    error: (err) => console.error('Failed to create transaction', err)
                });
            }
        });
    }
}
