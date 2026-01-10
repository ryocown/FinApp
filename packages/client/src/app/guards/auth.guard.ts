import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.waitForAuth().then(async user => {
        const url = state.url;
        const isAuthRoute = url.includes('/login');
        const isOnboardingRoute = url.includes('onboarding');

        if (user) {
            // Ensure we know onboarding status
            await authService.checkOnboardingStatus(user);
            const hasAccounts = authService.hasAccounts();

            if (!hasAccounts && !isOnboardingRoute) {
                console.log("%c[AuthGuard] Incomplete Profile -> Redirecting to /login/onboarding", "color: orange");
                return router.createUrlTree(['/login/onboarding']);
            }
            if (hasAccounts && isOnboardingRoute) {
                console.log("%c[AuthGuard] Already Onboarded -> Redirecting to /", "color: green");
                return router.createUrlTree(['/']);
            }

            // User IS logged in but trying to access signin page
            if (isAuthRoute && !isOnboardingRoute) {
                console.log("%c[AuthGuard] Authenticated user on Login -> Redirecting to /", "color: green");
                return router.createUrlTree(['/']);
            } else {
                console.log("%c[AuthGuard] Access Granted", "color: green");
                return true;
            }
        } else {
            // User IS NOT logged in
            // Allow access to signin page (layout + signin)
            // But block onboarding if not logged in
            if (isAuthRoute && !isOnboardingRoute) {
                return true;
            } else {
                // If trying to access onboarding without login, OR dashboard
                console.log("%c[AuthGuard] Access Denied -> Redirecting to /login/signin", "color: red");
                return router.createUrlTree(['/login/signin']);
            }
        }
    });
};
