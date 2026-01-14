import { Component, inject, signal, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { lastValueFrom } from 'rxjs';

import { Account, TransactionProcessor, TransactionProto, ParsedTransaction, Institute, AccountType, Currency, TransactionType, toDateProto } from '@finapp/shared/models';
import { TransactionService } from '../../../services/transaction';
import { InstituteService } from '../../../services/institute';
import { AccountService } from '../../../services/account';
import { GoogleDriveService } from '../../../services/google-drive';
import { fromExcelToCsv } from '@finapp/shared/lib/from_excel_to_csv';
import { extractTextFromPdf } from '../../../utils/pdf-utils';

export interface ImportDialogData {
    account?: Account;
    instituteName?: string; // Current context
    userId: string;
}

@Component({
    selector: 'app-import-transaction-dialog',
    standalone: true,
    imports: [
        CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
        MatProgressBarModule, MatStepperModule, MatCheckboxModule, MatSelectModule,
        MatInputModule, MatFormFieldModule
    ],
    template: `
    <h2 mat-dialog-title>Import Wizard</h2>
    <mat-dialog-content class="min-w-[800px] min-h-[500px] max-h-[80vh]">
      
      <mat-stepper [linear]="true" #stepper>
        
        <!-- Step 1: Upload -->
        <mat-step [completed]="!!file()" label="Select File">
            <div class="h-64 flex flex-col items-center justify-center space-y-6">
                
                @if (isDownloading() || loading()) {
                    <mat-progress-bar mode="indeterminate" class="max-w-md w-full mb-4"></mat-progress-bar>
                    <p class="text-zinc-400">
                        {{ isDownloading() ? 'Downloading from Drive...' : 'Processing file...' }}
                    </p>
                } @else {
                    <!-- Drag & Drop / Local -->
                    <div class="border-2 border-dashed rounded-xl p-8 w-full max-w-md flex flex-col items-center justify-center text-center cursor-pointer transition-all relative"
                        [class.border-emerald-500]="isDragging()"
                        [class.bg-emerald-500\/10]="isDragging()"
                        [class.border-zinc-700]="!isDragging()"
                        [class.hover:bg-zinc-800\/50]="!isDragging()">
                        
                        <input type="file" 
                            (change)="onFileSelected($event)" 
                            (dragenter)="isDragging.set(true)"
                            (dragleave)="isDragging.set(false)"
                            (drop)="isDragging.set(false)"
                            accept=".csv,.xlsx,.pdf,.txt" 
                            class="absolute inset-0 opacity-0 cursor-pointer z-10">
                            
                        <mat-icon class="scale-150 mb-4" [class.text-emerald-500]="isDragging()" [class.text-zinc-500]="!isDragging()">upload_file</mat-icon>
                        <p class="text-lg font-medium text-white">Drag and drop to upload</p>
                        <p class="text-sm text-zinc-400 mt-2">or click to browse</p>
                    </div>

                    <div class="flex items-center w-full max-w-md">
                        <div class="h-px bg-zinc-800 flex-1"></div>
                        <span class="px-4 text-zinc-500 text-sm">OR</span>
                        <div class="h-px bg-zinc-800 flex-1"></div>
                    </div>

                    <!-- Google Drive -->
                    <button mat-stroked-button color="primary" class="w-full max-w-md py-6 text-lg" (click)="onDriveClick()">
                        <mat-icon class="mr-2">add_to_drive</mat-icon>
                        Select from Google Drive
                    </button>
                }
            </div>
        </mat-step>

        <!-- Step 2: Match & Review -->
        <mat-step [completed]="isMatched() && selection().length > 0" label="Review & Match">
            
            <div class="space-y-6 py-4">
                
                <!-- Matching Config -->
                <div class="grid grid-cols-2 gap-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    
                    <!-- Institute Match -->
                    <div class="flex flex-col gap-2">
                            <label class="text-xs text-zinc-500 uppercase tracking-wide">Institute</label>
                            <div class="flex gap-2">
                            <mat-form-field appearance="outline" class="w-full">
                                <mat-select [(ngModel)]="selectedInstituteId" (selectionChange)="onInstituteChange()">
                                    @for (inst of instituteService.institutes(); track inst.instituteId) {
                                        <mat-option [value]="inst.instituteId">{{ inst.name }}</mat-option>
                                    }
                                    <mat-option [value]="'NEW'">+ Create New Institute</mat-option>
                                </mat-select>
                            </mat-form-field>
                            </div>
                            @if (selectedInstituteId() === 'NEW') {
                                <mat-form-field appearance="outline">
                                    <mat-label>New Institute Name</mat-label>
                                    <input matInput [(ngModel)]="newInstituteName">
                                </mat-form-field>
                            }
                    </div>

                    <!-- Account Match -->
                    <div class="flex flex-col gap-2">
                            <label class="text-xs text-zinc-500 uppercase tracking-wide">Account</label>
                            <div class="flex gap-2">
                            <mat-form-field appearance="outline" class="w-full">
                                <mat-select [(ngModel)]="selectedAccountId">
                                        @for (acc of availableAccounts(); track acc.accountId) {
                                        <mat-option [value]="acc.accountId">{{ acc.name }}</mat-option>
                                    }
                                    <mat-option [value]="'NEW'">+ Create New Account</mat-option>
                                </mat-select>
                            </mat-form-field>
                            </div>
                            @if (selectedAccountId() === 'NEW') {
                                <mat-form-field appearance="outline">
                                    <mat-label>New Account Name</mat-label>
                                    <input matInput [(ngModel)]="newAccountName">
                                </mat-form-field>
                            }
                    </div>
                </div>

                <!-- Transactions Table -->
                <div class="border border-zinc-800 rounded-lg overflow-hidden flex flex-col max-h-[400px]">
                    <div class="bg-zinc-900 p-3 border-b border-zinc-800 flex justify-between items-center">
                        <h3 class="font-medium text-white">Transactions ({{ transactions().length }})</h3>
                        <div class="text-sm text-zinc-400">
                            {{ selection().length }} selected
                        </div>
                    </div>
                    
                    <div class="overflow-y-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-zinc-900/50 text-zinc-400 sticky top-0">
                                <tr>
                                    <th class="px-4 py-3 w-12">
                                        <mat-checkbox 
                                            [checked]="isAllSelected()"
                                            [indeterminate]="isPartiallySelected()"
                                            (change)="toggleAll($event.checked)">
                                        </mat-checkbox>
                                    </th>
                                    <th class="px-4 py-3">Date</th>
                                    <th class="px-4 py-3">Description</th>
                                    <th class="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-800">
                                @for (t of transactions(); track $index) {
                                    <tr class="hover:bg-zinc-800/30 transition-colors">
                                        <td class="px-4 py-2">
                                            <mat-checkbox 
                                                [checked]="isSelected(t)"
                                                (change)="toggleSelection(t, $event.checked)">
                                            </mat-checkbox>
                                        </td>
                                        <td class="px-4 py-2 text-zinc-300">{{ t.date.timestamp | date:'shortDate' }}</td>
                                        <td class="px-4 py-2 text-white">{{ t.description }}</td>
                                        <td class="px-4 py-2 text-right font-medium" 
                                            [class.text-emerald-400]="t.amount > 0" 
                                            [class.text-white]="t.amount <= 0">
                                            {{ t.amount | currency:t.currency.code:'symbol':'1.2-2' }}
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </mat-step>

        <!-- Step 3: Result -->
        <mat-step label="Finish">
             @if (uploading()) {
                 <div class="flex flex-col items-center justify-center py-12">
                    <mat-progress-bar mode="indeterminate" class="max-w-md mb-4"></mat-progress-bar>
                    <p class="text-zinc-400">Saving transactions...</p>
                </div>
            } @else if (error()) {
                 <div class="flex flex-col items-center justify-center py-12 text-center">
                    <mat-icon class="text-red-500 scale-150 mb-4">error</mat-icon>
                    <h3 class="text-lg font-medium text-white mb-2">Import Failed</h3>
                    <p class="text-red-400 mb-6">{{ error() }}</p>
                    <button mat-stroked-button (click)="resetState()">Try Again</button>
                </div>
            } @else {
                 <div class="flex flex-col items-center justify-center py-12 text-center">
                    <mat-icon class="text-emerald-500 scale-150 mb-4">check_circle</mat-icon>
                    <h3 class="text-lg font-medium text-white mb-2">Success!</h3>
                    <p class="text-zinc-400 mb-6">Imported {{ selection().length }} transactions.</p>
                    <button mat-raised-button color="primary" mat-dialog-close>Close</button>
                 </div>
            }
        </mat-step>

      </mat-stepper>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" *ngIf="stepper.selectedIndex < 2"> <!-- Hide actions on step 3 -->
         <button mat-button mat-dialog-close>Cancel</button>

         @if (stepper.selectedIndex === 0) {
             <!-- Next button handled by file selection automation, or could be manual -->
         } 
         
         @if (stepper.selectedIndex === 1) {
             <button mat-button matStepperPrevious>Back</button>
             <button mat-raised-button color="primary" 
                [disabled]="!isMatched() || selection().length === 0" 
                (click)="save()">
                Import Selected
             </button>
         }
    </mat-dialog-actions>
    `
})
export class ImportTransactionDialogComponent {
    data = inject<ImportDialogData>(MAT_DIALOG_DATA);

    transactionService = inject(TransactionService);
    instituteService = inject(InstituteService);
    accountService = inject(AccountService);
    driveService = inject(GoogleDriveService);

    stepper = viewChild<MatStepper>('stepper');

    // State
    file = signal<{ name: string, blob: Blob } | null>(null);
    transactions = signal<TransactionProto[]>([]);
    selection = signal<TransactionProto[]>([]);
    loading = signal(false);
    uploading = signal(false);
    error = signal<string | null>(null);
    isDragging = signal(false); // New signal for drag state
    isDownloading = signal(false); // New signal for Drive download

    // Matching
    selectedInstituteId = signal<string | 'NEW'>('');
    selectedAccountId = signal<string | 'NEW'>('');
    newInstituteName = signal('');
    newAccountName = signal('');

    // Computed
    availableAccounts = computed(() => {
        const instId = this.selectedInstituteId();
        if (!instId || instId === 'NEW') return [];
        return this.accountService.accounts().filter(a => a.instituteId === instId);
    });

    isMatched = computed(() => {
        const iId = this.selectedInstituteId();
        const aId = this.selectedAccountId();

        const instValid = iId && (iId !== 'NEW' || this.newInstituteName().length > 0);
        const accValid = aId && (aId !== 'NEW' || this.newAccountName().length > 0);

        return instValid && accValid;
    });

    constructor() {
        // Initialize with context data
        // We know the institute and account from context if provided
        const knownInst = this.instituteService.institutes().find(i => i.name === this.data.instituteName);
        if (knownInst) this.selectedInstituteId.set(knownInst.instituteId);

        if (this.data.account) {
            this.selectedAccountId.set(this.data.account.accountId);
        }
    }

    // --- File Handling ---

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        this.handleFile(input.files[0].name, input.files[0]);
    }

    async onDriveClick() {
        try {
            const fileData = await this.driveService.openPicker();
            // fileData has id, name, etc.
            if (!fileData) return; // User cancelled

            this.isDownloading.set(true);
            const blob = await this.driveService.downloadFile(fileData.id);
            this.handleFile(fileData.name, blob as any); // blob is Blob
        } catch (err) {
            console.error("Drive Error", err);
            this.error.set("Failed to download file from Drive");
        } finally {
            this.isDownloading.set(false);
        }
    }

    async handleFile(name: string, blob: Blob) {
        this.file.set({ name, blob });
        this.stepper()?.next(); // Move to Step 2
        this.processFile();
    }

    async processFile() {
        const f = this.file();
        if (!f) return;

        this.loading.set(true);
        this.error.set(null);
        this.transactions.set([]);

        try {
            let text = '';
            const filename = f.name.toLowerCase();

            if (filename.endsWith('.xlsx')) {
                const buffer = await f.blob.arrayBuffer();
                const csvs = fromExcelToCsv(buffer);
                if (!csvs.length) throw new Error('Empty Excel file');
                text = csvs[0];
            } else if (filename.endsWith('.pdf')) {
                // PDF Utils expects File, but Blob is parent of File. 
                // We might need to cast or ensure extractTextFromPdf handles Blob
                // extractTextFromPdf uses arrayBuffer() which Blob has.
                // Assuming type compatibility or casting.
                text = await extractTextFromPdf(f.blob as File);
            } else {
                text = await f.blob.text();
            }

            const processor = new TransactionProcessor();
            const parsed = processor.process(text);

            if (parsed.length === 0) {
                // Warn but allow?
            }

            // --- Smart Matching (Detect Institute) ---
            if (parsed.length > 0) {
            }

            const txns = parsed.map(t => ({
                transactionId: crypto.randomUUID(),
                date: toDateProto(t.date),
                amount: t.amount,
                description: t.description,
                merchant: { name: t.merchant || t.description, merchantId: 'unknown' },
                userId: this.data.userId,
                accountId: '', // Will be set on save
                currency: new Currency('US Dollar', '$', 'USD'),
                transactionType: TransactionType.General,
                categoryId: 'uncategorized',
                tagIds: [],
                statementId: null
            } as TransactionProto));

            this.transactions.set(txns);
            this.toggleAll(true); // Select all by default

        } catch (e: any) {
            console.error(e);
            this.error.set(e.message);
        } finally {
            this.loading.set(false);
        }
    }

    // --- Selection ---

    isAllSelected() {
        return this.transactions().length > 0 && this.selection().length === this.transactions().length;
    }

    isPartiallySelected() {
        const len = this.selection().length;
        return len > 0 && len < this.transactions().length;
    }

    isSelected(t: TransactionProto) {
        return this.selection().includes(t);
    }

    toggleAll(checked: boolean) {
        this.selection.set(checked ? [...this.transactions()] : []);
    }

    toggleSelection(t: TransactionProto, checked: boolean) {
        this.selection.update(sel => {
            if (checked) return [...sel, t];
            return sel.filter(x => x !== t);
        });
    }

    onInstituteChange() {
        // Reset account selection if institute changes
        this.selectedAccountId.set('');
    }

    // --- Save ---

    async save() {
        if (!this.isMatched()) return;

        this.uploading.set(true);
        this.stepper()?.next(); // Move to Step 3

        try {
            // 1. Create Institute if NEW
            let instituteId = this.selectedInstituteId();
            if (instituteId === 'NEW') {
                // Fixed: using correct positional arguments (userId, name) and checking return.
                // Wait, I need to observe the return.
                // createInstitute returns Observable<Institute>.
                const newInst = await lastValueFrom(this.instituteService.createInstitute(
                    this.data.userId,
                    this.newInstituteName()
                ));

                instituteId = newInst.instituteId;
            }

            // 2. Create Account if NEW
            let accountId = this.selectedAccountId();
            if (accountId === 'NEW') {
                const newAcc = await lastValueFrom(this.accountService.createAccount(this.data.userId, {
                    name: this.newAccountName(),
                    instituteId: instituteId,
                    type: AccountType.BANK,
                    balance: 0,
                    currency: new Currency('US Dollar', '$', 'USD')
                }));

                accountId = newAcc.accountId;
            }

            // 3. Save Transactions
            const txnsToSave = this.selection().map(t => ({
                ...t,
                accountId: accountId
            }));

            this.transactionService.batchCreateTransactions(
                this.data.userId,
                accountId,
                txnsToSave
            ).subscribe({
                next: () => {
                    this.uploading.set(false);
                    // Done.
                },
                error: (e) => {
                    this.uploading.set(false);
                    this.error.set(e.message || 'Save failed');
                }
            });

        } catch (e: any) {
            console.error(e);
            this.error.set(e.message);
            this.uploading.set(false);
        }
    }

    resetState() {
        this.error.set(null);
        this.file.set(null);
        this.transactions.set([]);
        this.stepper()?.reset();
    }
}
