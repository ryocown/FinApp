# Recurring Transaction Model

## Interface: `IRecurringTransaction`

Represents a rule for automatically creating future transactions based on a template.

```typescript
export enum RecurrenceFrequency {
  Daily = 'DAILY',
  Weekly = 'WEEKLY',
  BiWeekly = 'BI_WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY'
}

export interface IRecurringTransaction {
  recurringTransactionId: string; // UUID (Primary Key)
  templateTransaction: ITransaction; // The transaction to copy/instantiate
  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  endDate: Date | null;
}
```

## Rationale
- **Separation of Concerns**: Separates the template (what) from the schedule (when).
- **Automation**: Enables the system to auto-generate transactions.
- **Forecasting**: Allows for cash flow projections based on known future expenses/income.
