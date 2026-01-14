import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionProto } from '@finapp/shared/models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  getTransactions(userId: string, accountId?: string): Observable<TransactionProto[]> {
    let url = `${this.apiUrl}/transactions/users/${userId}/transactions`;
    if (accountId) {
      url += `?accountId=${accountId}`;
    }
    return this.http.get<{ transactions: TransactionProto[] }>(url).pipe(
      map(response => response.transactions)
    );
  }

  createTransaction(userId: string, transaction: Partial<TransactionProto>): Observable<TransactionProto> {
    const url = `${this.apiUrl}/transactions/users/${userId}/transactions`;
    return this.http.post<TransactionProto>(url, transaction);
  }

  batchCreateTransactions(userId: string, accountId: string, transactions: TransactionProto[]): Observable<any> {
    const url = `${this.apiUrl}/transactions/users/${userId}/accounts/${accountId}/transactions/batch`;
    return this.http.post(url, { transactions, skipDuplicates: true });
  }

  updateTransaction(userId: string, transactionId: string, updates: Partial<TransactionProto>): Observable<TransactionProto> {
    const url = `${this.apiUrl}/transactions/users/${userId}/transactions/${transactionId}`;
    return this.http.patch<TransactionProto>(url, updates);
  }

  deleteTransaction(userId: string, transactionId: string): Observable<void> {
    const url = `${this.apiUrl}/transactions/users/${userId}/transactions/${transactionId}`;
    return this.http.delete<void>(url);
  }
}
