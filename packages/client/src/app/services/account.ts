import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { Account, IBalanceCheckpoint } from '@finapp/shared/models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  accounts = signal<Account[]>([]);

  getAccounts(userId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/accounts/users/${userId}/accounts`).pipe(
      tap(data => this.accounts.set(data))
    );
  }

  createAccount(userId: string, account: Partial<Account>): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/accounts/users/${userId}/accounts`, account).pipe(
      tap(() => this.getAccounts(userId).subscribe())
    );
  }

  updateAccount(userId: string, accountId: string, updates: Partial<Account>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/accounts/users/${userId}/accounts/${accountId}`, updates).pipe(
      tap(() => this.getAccounts(userId).subscribe())
    );
  }

  getAccount(userId: string, accountId: string): Observable<Account> {
    // Try to get from signal first, else fetch
    // Actually, just fetch to be fresh, or look up from signal if available?
    // Let's look up from signal if available, but also fallback to fetch if not found (or if we want fresh details).
    // For simplicity, let's just use the list if loaded, otherwise fetch (but we don't have a specific endpoint for single GET in this service yet? the server likely supports it or we filter list).
    // The server routes: `router.get('/users/:userId/accounts', ...)` - checks list.
    // Does server have single GET? Let's check routes file again...
    // It doesn't seem to have `router.get('/users/:userId/accounts/:accountId')` specifically listed in the snippet I saw?
    // Wait, I missed checking for single GET route.
    // Use the list filtering for now, as it's efficient enough for small user data.
    return this.getAccounts(userId).pipe(
      map(accounts => {
        const acc = accounts.find(a => a.accountId === accountId);
        if (!acc) throw new Error('Account not found');
        return acc;
      })
    );
  }

  getCheckpoints(userId: string, accountId: string): Observable<IBalanceCheckpoint[]> {
    return this.http.get<IBalanceCheckpoint[]>(`${this.apiUrl}/accounts/users/${userId}/accounts/${accountId}/checkpoints`);
  }
}
