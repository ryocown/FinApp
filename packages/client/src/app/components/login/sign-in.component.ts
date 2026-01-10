import { Component, inject, NgZone, ChangeDetectorRef, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-sign-in',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
    template: `
        <div class="card-header">
            <h2>Welcome</h2>
            <p>Sign in with Google to access your dashboard</p>
        </div>

        <div class="google-btn-wrapper">
             
             <!-- Primary Login Button (Official GIS Container) -->
             <div #googleButton [class.hidden]="isLoading() || isSuccess()"></div>

             <!-- Loading State -->
             <div class="loader-container animate-in fade-in zoom-in duration-300"
                  [class.hidden]="!isLoading() || isSuccess()">
                 <div class="morph-loader"></div>
                 <span class="text-sm font-medium text-[var(--app-theme-text-link)] tracking-wide">Connecting to Google...</span>
             </div>

             <!-- Success State -->
             @if (isSuccess()) {
             <div class="loader-container animate-in fade-in zoom-in duration-300">
                 <svg class="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                     <circle class="check-circle" cx="26" cy="26" r="25" fill="none"/>
                     <path class="check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                 </svg>
                 <span class="text-sm font-medium text-emerald-400 tracking-wide">Successfully verified!</span>
             </div>
             }
        </div>

        <div class="action-bar">
            <p class="text-xs text-[var(--app-theme-text-secondary)] w-full">
                By signing in, you agree to Waypoint's <a href="#" class="text-[var(--app-theme-text-link)] hover:underline">Terms</a>
                and
                <a href="#" class="text-[var(--app-theme-text-link)] hover:underline">Privacy Policy</a>.
            </p>
        </div>
    `,
    styles: [`
        .card-header {
            text-align: center;
            margin-bottom: 3rem;

            h2 {
                font-family: 'Google Sans', sans-serif;
                font-size: 28px;
                font-weight: 500;
                color: var(--app-theme-text-primary);
                margin-bottom: 0.75rem;
                letter-spacing: -0.02em;
            }

            p {
                font-size: 1rem;
                color: var(--app-theme-text-secondary);
                letter-spacing: 0.01em;
            }
        }

        .google-btn-wrapper {
            margin: 2rem 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 96px;
        }

        .action-bar {
            border-top: 1px solid var(--app-theme-divider);
            margin-top: 2rem;
            padding-top: 1.5rem;
            text-align: center;

            p {
                color: var(--app-theme-text-secondary);
                font-size: 0.75rem;
                line-height: 1.5;

                a {
                    color: var(--app-theme-text-link);
                    text-decoration: none;
                    transition: color 0.2s;

                    &:hover {
                        color: color-mix(in srgb, var(--app-theme-text-link), white 20%);
                        text-decoration: underline;
                    }
                }
            }
        }
        
        /* Success Checkmark */
        .success-checkmark {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #4ade80; /* Green-400 */
            stroke-miterlimit: 10;
            box-shadow: inset 0px 0px 0px #4ade80;
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }

        .check-circle {
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .check-path {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }

        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
        @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 30px #4ade80; } }

        .loader-container {
            display: flex;
            flex-direction: column;
            gap: var(--spaces-and-sizes-large);
            align-items: center;
            justify-content: center;
            min-height: 96px;
            width: 100%;
        }

        .morph-loader {
            width: 48px;
            height: 48px;
            background: var(--app-theme-text-link);
            box-shadow: 0 0 15px rgb(from var(--app-theme-text-link) r g b / 0.3);
            animation: morph 6s ease-in-out infinite;
        }

        @keyframes morph {
            0%, 100% { 
                /* Tilted Rounded Rect (Starting Shape) */
                border-radius: 12px;
                transform: rotate(45deg);
            }
            25% { 
                /* Rounded Star-ish */
                border-radius: 20% 80% 20% 80% / 80% 20% 80% 20%;
                transform: rotate(135deg);
            }
            50% { 
                /* Planet-like / Ovalish Pill */
                border-radius: 50%;
                transform: rotate(225deg) scaleX(1.2);
            }
            75% { 
                /* Rounded Box / Squircle */
                border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
                transform: rotate(315deg);
            }
        }
        
        .hidden {
            display: none !important;
        }
    `]
})
export class SignInComponent {
    authService = inject(AuthService);
    router = inject(Router);
    ngZone = inject(NgZone);
    cdr = inject(ChangeDetectorRef);

    googleButton = viewChild<ElementRef>('googleButton');

    isLoading = signal(false);
    isSuccess = signal(false);

    constructor() {
        // Global Handler for GIS Callback
        (window as any).handleCredentialResponse = this.handleCredentialResponse.bind(this);

        // Render button when auth initialized
        effect(() => {
            const btn = this.googleButton();
            if (this.authService.isInitialized() && btn) {
                this.authService.renderButton(btn.nativeElement, () => this.startAggressivePolling());
            }
        });

        // Auto-Redirect if Session Restored
        effect(() => {
            const user = this.authService.user();
            const hasAccounts = this.authService.hasAccounts();

            if (user && hasAccounts === true && !this.isSuccess()) {
                console.log("[SignIn] Session Restored & Valid. Auto-redirecting...");
                this.ngZone.run(() => this.router.navigate(['/']));
            } else if (user && hasAccounts === false) {
                console.log("[SignIn] Session Restored & New User. Redirecting...");
                this.ngZone.run(() => this.router.navigate(['/login/onboarding']));
            }
        });
    }

    // --- AGGRESSIVE POLLING STRATEGY ---
    private pollInterval: any;
    private hasOpened = false;

    startAggressivePolling() {
        console.log("[SignIn] GIS Button Clicked - Starting Aggressive Polling");

        this.ngZone.run(() => {
            this.isLoading.set(true);
            this.cdr.detectChanges();
        });

        this.hasOpened = false;

        if (this.pollInterval) clearInterval(this.pollInterval);

        // Poll every 200ms
        this.pollInterval = setInterval(() => {
            const hasFocus = document.hasFocus();

            // 1. Detect Opening (Window Lost Focus)
            if (!hasFocus) {
                if (!this.hasOpened) {
                    console.log("[SignIn] Popup Opened (Focus Lost)");
                    this.hasOpened = true;
                }
            }
            // 2. Detect Closing (Focus Regained AFTER Opening)
            else if (this.hasOpened) {
                console.log("[SignIn] Popup Closed (Focus Regained). Waiting 500ms for Success...");
                clearInterval(this.pollInterval);

                // Grace Period: 500ms for handleCredentialResponse to fire
                setTimeout(() => {
                    if (this.isLoading() && !this.isSuccess()) {
                        this.ngZone.run(() => {
                            console.log("[SignIn] No credential received. Assuming Cancellation. Resetting.");
                            this.isLoading.set(false);
                            this.cdr.detectChanges();
                        });
                    }
                }, 500);
            }
        }, 200);
    }

    async handleCredentialResponse(response: any) {
        console.log("[SignIn] Credential Received! Processing...");

        // STOP polling immediately
        if (this.pollInterval) clearInterval(this.pollInterval);

        // Wrap entire flow in Zone to be safe
        this.ngZone.run(async () => {
            try {
                const _ = await this.authService.handleCredentialResponseWithNoRedirect(response);
                console.log("[SignIn] Credential Exchange Complete. Checking Accounts...");

                // Success Logic
                const hasAccounts = this.authService.hasAccounts();
                console.log("[SignIn] Has Accounts Signal:", hasAccounts);

                if (hasAccounts) {
                    console.log("[SignIn] Success! Starting Animation...");
                    // Initial delay for smooth UX
                    await new Promise(resolve => setTimeout(resolve, 250));

                    this.isSuccess.set(true);
                    this.authService.loginState.set('success');
                    this.cdr.detectChanges();

                    // Animation delay
                    await new Promise(resolve => setTimeout(resolve, 1200));
                    console.log("[SignIn] Navigating to Dashboard");
                    this.router.navigate(['/']);
                } else {
                    console.log("[SignIn] New User. Navigating to Onboarding");
                    this.router.navigate(['/login/onboarding']);
                }
            } catch (error) {
                console.error("[SignIn] Login Process Failed", error);
                this.isLoading.set(false);
                this.cdr.detectChanges();
            }
        });
    }
}
