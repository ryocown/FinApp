# Date Handling Standards

## Core Principle
- **Database (Firestore)**: Stores dates as `Timestamp` objects (UTC).
- **Application Logic**: Uses native JavaScript `Date` objects.
- **UI**: Displays dates in the user's local timezone (Browser Locale) using `toLocaleDateString(undefined, options)`.

## Common Pitfalls
- **Firestore Timestamps**: When retrieving documents, date fields are `Timestamp` objects. They have `toDate()` but NOT `toISOString()`.
- **Mixing Types**: `TransactionService` logic often compares dates. Ensure all inputs are converted to `Date` before comparison or method calls.

## Utilities
- `ensureDate(date: any): Date`: Helper in `packages/shared/lib/date_utils.ts` to safely convert Timestamp/String/Date to Date.
- `parsePSTDateToUTC(dateString: string): Date`: For importers (Chase, Morgan Stanley) to parse statement dates (PST) into UTC. **Crucial**: Statement dates are often in PST/PDT, and `new Date()` uses the server's local time. This utility ensures consistent UTC conversion assuming PST source.

## Testing
- **Mocking Dates**: When mocking Firestore data, ensure date fields are either real `Timestamp` objects (from `firebase-admin/firestore`) or mocks that implement `toDate()`.
- **Validation**: Tests should verify that services receive `Date` objects, not raw `Timestamp`s.
