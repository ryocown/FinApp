import { Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Wallet, CreditCard, PieChart, Building, PlusCircle } from 'lucide-angular';
import { InstituteService } from '../../services/institute';
import { AccountService } from '../../services/account';
import { AuthService } from '../../services/auth.service';
import { Account, Institute } from '@finapp/shared/models';
import { filter } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateAccountDialogComponent } from '../accounts/create-account-dialog/create-account-dialog';
import { CreateInstituteDialogComponent } from '../accounts/create-institute-dialog/create-institute-dialog';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, LucideAngularModule, MatListModule, MatExpansionModule, MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private instituteService = inject(InstituteService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  collapsed = input(false);

  // Icons
  readonly Icons = {
    LayoutDashboard, Wallet, CreditCard, PieChart, Building, PlusCircle
  };

  // Link to service signals
  institutes = this.instituteService.institutes;
  accounts = this.accountService.accounts;
  hasAccounts = this.authService.hasAccounts;

  currentRoute = signal('');

  // Computed: Group accounts by institute
  institutesWithAccounts = computed(() => {
    const allAccounts = this.accounts();
    return this.institutes().map(inst => ({
      ...inst,
      accounts: allAccounts.filter(acc => acc.instituteId === inst.instituteId)
    }));
  });

  constructor() {
    // Initial fetch if empty (optional if app root does it, but good for safety)
    const userId = this.authService.user()?.uid;
    if (userId) {
      this.instituteService.getInstitutes(userId).subscribe();
      this.accountService.getAccounts(userId).subscribe();
    }

    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute.set(event.urlAfterRedirects);
    });
  }

  navigateTo(path: string) {
    const [url, query] = path.split('?');
    if (query) {
      const queryParams = Object.fromEntries(new URLSearchParams(query));
      this.router.navigate([url], { queryParams });
    } else {
      this.router.navigate([path]);
    }
  }

  openCreateInstituteDialog() {
    const dialogRef = this.dialog.open(CreateInstituteDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      const userId = this.authService.user()?.uid;
      if (result && userId) {
        this.instituteService.createInstitute(userId, result.name, result.type).subscribe();
      }
    });
  }

  openCreateAccountDialog() {
    const dialogRef = this.dialog.open(CreateAccountDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      const userId = this.authService.user()?.uid;
      if (result && userId) {
        const newAccount: Partial<Account> = {
          ...result,
          currency: { code: result.currency, symbol: result.currency === 'USD' ? '$' : result.currency, name: result.currency },
          userId: userId
        };
        this.accountService.createAccount(userId, newAccount).subscribe();
      }
    });
  }
}
