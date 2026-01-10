import { Component, inject, signal, viewChild, computed } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu'; // Import MatMenuTrigger
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core'; // Import MatRippleModule
import { RouterOutlet, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common'; // Import CurrencyPipe
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list'; // Import MatListModule
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SidebarComponent } from '../sidebar/sidebar';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account'; // Correct path and import
import { Account } from '@finapp/shared/models'; // Import Account model

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, RouterLink, SidebarComponent, MatSidenavModule, MatToolbarModule, MatButtonModule, MatIconModule, MatListModule, MatTooltipModule, MatMenuModule, MatDividerModule, MatRippleModule, CurrencyPipe],
    templateUrl: './layout.html',
})
export class LayoutComponent {
    private breakpointObserver = inject(BreakpointObserver);
    themeService = inject(ThemeService);
    authService = inject(AuthService);
    accountService = inject(AccountService); // Inject AccountService

    // Compute Net Worth for the menu pill
    netWorth = computed(() => {
        return this.accountService.accounts().reduce((sum: number, acc: Account) => sum + (acc.balance || 0), 0);
    });

    menuTrigger = viewChild(MatMenuTrigger);

    closeUserMenu() {
        this.menuTrigger()?.closeMenu();
    }

    sidenav = viewChild<MatSidenav>('sidenav');

    isMobile = toSignal(
        this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
            .pipe(map(result => result.matches)),
        { initialValue: false }
    );

    isCollapsed = signal(false);

    toggleSidenav() {
        if (this.isMobile()) {
            this.sidenav()?.toggle();
        } else {
            this.isCollapsed.update(v => !v);
        }
    }

    toggleTheme() {
        const current = this.themeService.theme();
        const next: 'light' | 'dark' | 'auto' = current === 'light' ? 'dark' : (current === 'dark' ? 'auto' : 'light');
        this.themeService.setTheme(next);
    }
}
