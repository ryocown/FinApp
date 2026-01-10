import { Component, inject, signal, effect, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { InstituteFormComponent } from '../institutes/institute-form/institute-form.component';
import { InstituteService } from '../../services/institute';


@Component({
    selector: 'app-onboarding',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatSelectModule, MatFormFieldModule, InstituteFormComponent],
    templateUrl: './onboarding.html',
    styleUrls: ['./onboarding.scss']
})
export class OnboardingComponent {
    authService = inject(AuthService);
    instituteService = inject(InstituteService);
    http = inject(HttpClient);
    router = inject(Router);
    ngZone = inject(NgZone);

    step = signal<number>(1);
    username = signal<string>('');
    accountName = signal<string>('My Vault');
    currency = signal<string>('USD');
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor() {
        // Pre-fill username & Handle Auto-Redirects
        effect(() => {
            const user = this.authService.user();
            const hasAccounts = this.authService.hasAccounts();

            if (user && !this.username()) {
                this.username.set(user.displayName || '');
            }

            // Auto-Redirect: If user is logged in AND has accounts, they shouldn't be here.
            if (user && hasAccounts === true) {
                console.log("[Onboarding] User already has accounts. Redirecting to Dashboard.");
                this.ngZone.run(() => this.router.navigate(['/']));
            }
        });
    }

    async saveProfile() {
        if (!this.username()) return;
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const user = this.authService.user();
            if (!user) throw new Error('No user');

            await lastValueFrom(this.http.put(`${environment.apiUrl}/users/${user.uid}`, {
                displayName: this.username()
            }));

            this.step.set(2);
        } catch (err: any) {
            console.error('Error saving profile', err);
            this.error.set(err.message || 'Failed to save profile');
        } finally {
            this.isLoading.set(false);
        }
    }

    @ViewChild(InstituteFormComponent) instituteForm!: InstituteFormComponent;
    createdInstituteId: string | null = null;

    async createInstitute() {
        if (this.instituteForm && this.instituteForm.valid) {
            this.isLoading.set(true);
            this.error.set(null);
            try {
                const user = this.authService.user();
                if (!user) throw new Error('No user');

                const val = this.instituteForm.value;
                const name = val.name || '';
                const type = val.type || 'Other';

                const res = await lastValueFrom(this.instituteService.createInstitute(user.uid, name, type));
                // Use the returned ID. Note: createInstitute returns custom object or Institute model?
                // InstituteService.createInstitute returns Observable<Institute>.
                // Institute has instituteId property.
                // Note: The variable name in Service is 'prop' mapped to Institute.
                this.createdInstituteId = res.instituteId;
                this.step.set(3);
            } catch (err: any) {
                console.error('Error creating institute', err);
                this.error.set(err.message || 'Failed to create institute');
            } finally {
                this.isLoading.set(false);
            }
        }
    }

    async createVault() {
        if (!this.accountName()) return;
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const user = this.authService.user();
            if (!user) throw new Error('No user');

            if (!this.createdInstituteId) {
                throw new Error('Institute not created');
            }

            const getCurrencyObject = (code: string) => {
                const symbols: Record<string, string> = {
                    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': '$'
                };
                return { code, symbol: symbols[code] || '$', name: code };
            };

            await lastValueFrom(this.http.post(`${environment.apiUrl}/accounts/users/${user.uid}/accounts`, {
                name: this.accountName(),
                type: 'CHECKING',
                currency: getCurrencyObject(this.currency()),
                balance: 0,
                instituteId: this.createdInstituteId,
                initialBalance: 0,
                initialDate: new Date().toISOString()
            }));

            await this.authService.checkOnboardingStatus(user);
            this.router.navigate(['/']);

        } catch (err: any) {
            console.error('Error creating vault', err);
            this.error.set(err.message || 'Failed to create vault');
        } finally {
            this.isLoading.set(false);
        }
    }
}
