import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBudget } from '@finapp/shared/models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getBudget(userId: string): Observable<IBudget[]> {
    return this.http.get<IBudget[]>(`${this.apiUrl}/accounts/users/${userId}/budget`);
  }
}
