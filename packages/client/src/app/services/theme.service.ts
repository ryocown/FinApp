import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    theme = signal<Theme>(this.getStoredTheme());

    constructor() {
        effect(() => {
            this.applyTheme(this.theme());
            localStorage.setItem('theme', this.theme());
        });

        // Listen for system changes if auto
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.theme() === 'auto') {
                this.applyTheme('auto');
            }
        });
    }

    setTheme(theme: Theme) {
        this.theme.set(theme);
    }

    private getStoredTheme(): Theme {
        return (localStorage.getItem('theme') as Theme) || 'auto';
    }

    private applyTheme(theme: Theme) {
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
            // For Tailwind dark mode if using 'class' strategy (optional, but good practice)
            root.classList.add('dark');
        } else {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
            root.classList.remove('dark');
        }

        // Update Material global theme attribute if needed, but class based approach usually suffices for custom mixins
        // We will update material-theme.scss to use these classes
    }
}
