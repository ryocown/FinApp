import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
        children: [
            { path: '', redirectTo: 'signin', pathMatch: 'full' },
            { path: 'signin', loadComponent: () => import('./components/login/sign-in.component').then(m => m.SignInComponent) },
            { path: 'onboarding', loadComponent: () => import('./components/onboarding/onboarding').then(m => m.OnboardingComponent) }
        ]
    },
    { path: 'onboarding', redirectTo: 'login/onboarding' }, // Redirect legacy path
    {
        path: '',
        loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
        canActivate: [authGuard],
        children: [
            { path: '', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'accounts', loadComponent: () => import('./components/accounts/accounts').then(m => m.AccountsComponent) },
            { path: 'accounts/:id', loadComponent: () => import('./components/account-details/account-details').then(m => m.AccountDetailsComponent) },
            { path: 'transactions', loadComponent: () => import('./components/transactions/transactions').then(m => m.TransactionsComponent) },
            { path: 'budget', loadComponent: () => import('./components/budget/budget').then(m => m.BudgetComponent) }
        ]
    }
];
