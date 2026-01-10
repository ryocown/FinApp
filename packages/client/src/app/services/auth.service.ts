import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, setPersistence, browserLocalPersistence, UserCredential } from 'firebase/auth';
import { auth } from '../firebase';

declare global {
    interface Window {
        google: any;
        handleCredentialResponse: (response: any) => void;
    }
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private clientId = '479344769542-c3iajipmha994v6jo7gmdsjtpl8i5ljk.apps.googleusercontent.com';
    private http = inject(HttpClient);
    private router = inject(Router);

    user = signal<any>(null); // Store user profile
    hasAccounts = signal<boolean | null>(null);
    loginState = signal<'idle' | 'loading' | 'success'>('idle');
    isInitialized = signal(false);

    constructor() {
        setPersistence(auth, browserLocalPersistence)
            .then(() => console.log("[AuthService] Persistence set to LOCAL"))
            .catch((error) => console.error("[AuthService] Failed to set persistence", error));

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("%c[AuthService] User Logged In:", "color: green; font-weight: bold;", user.uid);
                this.user.set(user);
                await this.checkOnboardingStatus(user);
            } else {
                console.log("%c[AuthService] User Logged Out", "color: orange; font-weight: bold;");
                this.user.set(null);
                this.hasAccounts.set(null);
            }
        });

        // Initialize GIS immediately on load
        this.loadGoogleScript().then(() => this.initializeGoogleAuth());
    }

    private loadGoogleScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (window.google?.accounts) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = (err) => reject(err);
            document.head.appendChild(script);
        });
    }

    initializeGoogleAuth() {
        if (!window.google) return;

        console.log("[AuthService] Initializing Google Auth (GIS) with Client ID:", this.clientId);

        window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponseWithNoRedirect.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
            // We use 'popup_closed' error_callback if available, but relying on polling mostly
        });

        this.isInitialized.set(true);
    }

    renderButton(element: HTMLElement, clickListener: () => void) {
        if (!window.google) {
            console.error('Google global not found during renderButton');
            return;
        }

        window.google.accounts.id.renderButton(
            element,
            {
                theme: 'filled_blue', // 'outline', 'filled_black', 'filled_blue'
                size: 'large', // 'large', 'medium', 'small'
                type: 'standard', // 'standard', 'icon'
                shape: 'pill', // 'rectangular', 'pill' (Fancier)
                text: 'signin_with', // 'signin_with', 'signup_with', 'continue_with'
                logo_alignment: 'left',
                width: 280, // Consistent width
                click_listener: clickListener // CRITICAL: Hook for polling start
            }
        );
    }

    // Handles the GIS token response -> Exchanges for Firebase Credential
    async handleCredentialResponseWithNoRedirect(response: any) {
        console.log("[AuthService] Received GIS Credential Response");

        try {
            const credential = GoogleAuthProvider.credential(response.credential);

            // Sign in to Firebase with the Google ID Token
            const firebaseUser = await signInWithCredential(auth, credential);

            // Wait for auth state propagation
            const user = await this.waitForAuth();
            if (user) {
                await this.checkOnboardingStatus(user);
            }
            return firebaseUser;
        } catch (error) {
            console.error("[AuthService] Firebase Credential Exchange Failed", error);
            throw error;
        }
    }

    waitForAuth(): Promise<any> {
        return new Promise((resolve) => {
            if (this.user()) {
                requestAnimationFrame(() => resolve(this.user()));
                return;
            }
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    async checkOnboardingStatus(user: any): Promise<boolean> {
        if (!user) {
            console.log("[AuthService] No user for onboarding check");
            return false;
        }
        try {
            console.log("[AuthService] Checking Onboarding Status via API...");
            const response = await lastValueFrom(this.http.post<any>(`${environment.apiUrl}/users/register`, {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }));
            const hasAcc = !!response.hasAccounts;
            console.log("[AuthService] Onboarding Check Result:", hasAcc);
            this.hasAccounts.set(hasAcc);
            return hasAcc;
        } catch (error) {
            console.error("[AuthService] Failed to check onboarding status", error);
            return false;
        }
    }

    async signOut() {
        try {
            if (window.google) {
                window.google.accounts.id.disableAutoSelect();
            }
            await auth.signOut();
            this.user.set(null);
            this.hasAccounts.set(null);
            this.loginState.set('idle');
            this.router.navigate(['/login/signin']);
        } catch (error) {
            console.error("Error signing out", error);
        }
    }

    signIn() {
        this.router.navigate(['/login/signin']);
    }
}
