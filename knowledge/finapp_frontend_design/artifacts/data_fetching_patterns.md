# Data Fetching & Error Handling Patterns

## Overview
To ensure a robust user experience, data fetching in the FinApp frontend follows a standardized pattern using custom hooks that expose explicit error states. These states are then consumed by components to display user-friendly alerts.

## Hook Implementation Pattern

Custom hooks (e.g., `useTransactions`, `useAccounts`) are responsible for:
1.  **State Management**: Managing `data`, `loading`, and `error` states.
2.  **Error Parsing**: Catching fetch errors and parsing non-200 server responses to extract meaningful error messages.
3.  **Cleanup**: Resetting error states on new fetch requests.

### Example: `useTransactions`

```typescript
export function useTransactions(userId: string, ...) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null); // Reset error before new request

    fetch(url)
      .then(async res => {
        if (!res.ok) {
          // Attempt to parse JSON error from server
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || `Server error: ${res.status}`);
          } catch (e) {
            // Fallback to status text if JSON parse fails
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [userId, ...]);

  return { data, loading, error };
}
```

## Centralized API Utility (`api.ts`)
For imperative actions (like Create, Update, Delete) that don't fit the "subscribe" model of hooks, the project uses a centralized utility module.

- **Location**: `packages/client/src/lib/api.ts`
- **Purpose**: Encapsulates `fetch` calls, error handling, and type safety for command-style operations.
- **Pattern**:
    ```typescript
    export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
      const response = await fetch(...);
      if (!response.ok) throw new Error(...);
    }
    ```

## UI Consumption Pattern

Components consume the `error` state and render a prominent alert (typically a red banner) at the top of the content area or form. This ensures the user is aware of failures like network issues or server 500 errors.

### Example: `Transactions.tsx`

```tsx
export function Transactions({ userId }: TransactionsProps) {
  const { transactions, loading, error } = useTransactions(userId, ...);

  return (
    <main className="flex-1 overflow-auto">
      {/* ... Header ... */}

      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ... Content ... */}
      </div>
    </main>
  );
}
```

### Advanced Pattern: Expandable Error Details

For internal tools or debugging contexts, it is helpful to make the error alert interactive. Clicking the alert expands it to show the full raw error message (e.g., stack traces or specific database error links).

```tsx
const [isErrorExpanded, setIsErrorExpanded] = useState(false);

// ... inside render ...
{error && (
  <div 
    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
    onClick={() => setIsErrorExpanded(!isErrorExpanded)}
  >
    <div className="flex items-center gap-2">
      <AlertIcon />
      <span className="font-medium">Error loading data (click for details)</span>
    </div>
    {isErrorExpanded && (
      <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono">
        {error}
      </pre>
    )}
  </div>
)}
```

## Relational Data Handling

### Client-Side Lookups
The API returns "flat" entities (e.g., Transactions contain `categoryId` and `accountId` but not the full objects). The frontend is responsible for resolving these relationships.

**Pattern**:
1.  **Parallel Fetching**: Fetch reference data (Accounts, Categories) in parallel with the main data (Transactions).
2.  **Lookup Helpers**: Use helper functions or maps to resolve IDs to display names or colors.

**Example (`TransactionRow.tsx`)**:
```typescript
// Props include the full list of accounts
interface TransactionRowProps {
    transaction: ITransaction;
    accounts: IAccount[];
    // ...
}

// Helper to resolve Account Name
const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.accountId === accountId);
    return account ? account.name : 'Unknown';
}
```

