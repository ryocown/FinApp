import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getRates(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/currencies/rates`);
  }

  getNetWorthHistory(userId: string, range: string): Observable<{ date: string; value: number }[]> {
    return this.http.get<{ date: string; value: number }[]>(`${this.apiUrl}/analytics/users/${userId}/net-worth`, {
      params: { range }
    });
  }
}
