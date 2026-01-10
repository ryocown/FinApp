import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetService } from '../../services/budget';
import { AuthService } from '../../services/auth.service';
import { IBudget } from '@finapp/shared/models';

@Component({
  selector: 'app-budget',
  imports: [CommonModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class BudgetComponent {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  budgetData = signal<IBudget[]>([]);

  constructor() {
    // TODO: Get real userId from auth service
    const userId = this.authService.user()?.uid || '';
    this.budgetService.getBudget(userId).subscribe({
      next: (data) => this.budgetData.set(data),
      error: (e) => console.error(e)
    });
  }
}
