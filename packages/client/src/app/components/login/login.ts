import { Component, inject, Signal, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ParticleBackgroundComponent } from '../shared/particle-background.component';
import { WaypointIconComponent } from '../shared/waypoint-icon.component';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-login', // Acts as Auth Layout
    templateUrl: './login.html',
    styleUrl: './login.scss',
    standalone: true,
    imports: [CommonModule, ParticleBackgroundComponent, WaypointIconComponent, RouterOutlet, MatButtonModule, MatIconModule, MatTooltipModule]
})
export class LoginComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    router = inject(Router);

    // Sync state from service to drive animations
    loginState: Signal<'idle' | 'loading' | 'success'> = this.authService.loginState;

    // Track if we are on the onboarding route for card width
    isOnboarding = toSignal(
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            map(() => this.router.url.includes('onboarding'))
        ),
        { initialValue: false }
    );

    // Card width depends on route
    cardWidthClass = computed(() => this.isOnboarding() ? 'mode-onboarding' : 'mode-signin');

    constructor() {
        // Always reset state when entering the Auth Layout
        // This prevents the 'expanded' state from persisting if the user navigates back
        this.authService.loginState.set('idle');
    }

    toggleTheme() {
        const current = this.themeService.theme();
        const next = current === 'light' ? 'dark' : 'light';
        this.themeService.setTheme(next);
    }
}
