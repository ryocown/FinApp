import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { InstituteProp, Institute, InstituteTypes } from '@finapp/shared/models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InstituteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  institutes = signal<Institute[]>([]);

  getInstitutes(userId: string): Observable<Institute[]> {
    return this.http.get<InstituteProp[]>(`${this.apiUrl}/institutes/users/${userId}/institutes`).pipe(
      map(props => props.map(prop => Institute.fromProp(prop))),
      tap(data => this.institutes.set(data))
    );
  }

  createInstitute(userId: string, name: string, type: InstituteTypes | string = 'Other', supportedInstituteId?: string): Observable<Institute> {
    return this.http.post<InstituteProp>(`${this.apiUrl}/institutes/users/${userId}/institutes`, { userId, name, type, supportedInstituteId }).pipe(
      map(prop => Institute.fromProp(prop)),
      tap(() => this.getInstitutes(userId).subscribe())
    );
  }
}
