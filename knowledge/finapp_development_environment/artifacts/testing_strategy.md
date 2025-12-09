# Testing Strategy

## Overview
FinApp employs a mix of integration scripts and unit tests to ensure stability.

## Bug Reproduction Strategy
When a bug is identified, especially in backend logic (Services), follow this pattern:

### 1. Create a Reproduction Unit Test
Instead of running the full app or manual scripts, create a focused unit test file in `packages/server/tests/services/` (mirroring `src` structure).
-   **Naming**: `[feature].test.ts` or `repro_[issue].test.ts`.
-   **Mocking**: Mock external dependencies (Firebase, Logger) to isolate the logic.
-   **Goal**: The test should **fail** initially (reproducing the bug) and **pass** after the fix.

### 2. Example: Date Handling Bug
**Issue**: `minDate.toISOString` crash in `TransactionService`.
**Repro**: `packages/server/tests/services/transactions.test.ts`
-   **Mock**: Firestore `get()` returns a mock object with a `toDate()` method (simulating Timestamp) but missing `toISOString()`.
-   **Test**: Call `updateTransaction` and assert it throws (or doesn't throw after fix).
-   **Test**: Call `updateTransaction` and assert it throws (or doesn't throw after fix).

### 3. Mocking Pitfalls
**Warning**: Mocking a dependency can mask bugs if the crash happens *inside* the dependency due to bad arguments.
-   **Scenario**: Service A calls Service B with a bad object. Service B crashes.
-   **If Mocked**: Service B mock does nothing. Test passes (false positive).
-   **Fix**: Validate arguments passed to the mock.
    ```typescript
    expect(MockedService.method).toHaveBeenCalledWith(expect.any(Date));
    // Or strict check
    const arg = MockedService.method.mock.calls[0][0];
    expect(typeof arg.toISOString).toBe('function');
    ```

## Integration Scripts
For end-to-end verification (e.g., Importers -> Database -> Reconciliation), use standalone scripts in `packages/shared/lib/` or `packages/server/src/scripts/`.
-   **Direct Service Testing**: `reconciliation_direct.ts` (bypasses API).
-   **Full Flow**: `import_to_firebase.ts` (tests parsing + DB insertion).

## ESM Configuration & Mocking
The server package is configured as **Native ESM** (`"type": "module"`).
-   **Execution**: Tests run with `NODE_OPTIONS=--experimental-vm-modules jest`.
-   **Mocking**: Standard `jest.mock` hoisting behaves differently in ESM.
    -   **Pattern**: Use `jest.unstable_mockModule` *before* dynamic imports.
    ```typescript
    // 1. Define mocks
    jest.unstable_mockModule('../../src/firebase', () => ({
      db: { ... },
    }));

    // 2. Import module UNDER TEST (dynamic import)
    const { Service } = await import('../../src/services/service');

    // 3. Run tests
    describe('Service', () => { ... });
    ```

## Common TypeScript Mocking Issues

### `mockResolvedValue` Type Error
**Error**: `Argument of type 'any' is not assignable to parameter of type 'never'`
**Cause**: When `jest.fn()` is used without generic type arguments, TypeScript may infer a return type that is not a Promise (e.g., `undefined`), making `mockResolvedValue` invalid.
**Fix**: Use `mockReturnValue(Promise.resolve(...))` to bypass strict return type checking, or explicitly type the mock `jest.fn<Promise<Type>, []>()`.

```typescript
// Error
const mock = jest.fn().mockResolvedValue({ ... });

// Fix 1 (Bypass)
const mock = jest.fn().mockReturnValue(Promise.resolve({ ... }));

// Fix 2 (Explicit Type)
const mock = jest.fn<Promise<any>, []>().mockResolvedValue({ ... });
```


## Service Testing with Firebase Mocks
When testing services that interact with Firebase (e.g., `TransactionService`), use `jest.unstable_mockModule` to mock `firebase.ts` exports.

### Pattern: Mocking `db.batch` and `db.getAll`
For batch operations, ensure `db.batch()` returns a consistent mock object so you can assert on it.

```typescript
// 1. Define consistent mock object
const mockBatch = {
  set: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

// 2. Mock the module
jest.unstable_mockModule('../../src/firebase', () => ({
  db: {
    batch: jest.fn(() => mockBatch), // Return the SAME object
    getAll: jest.fn(),
  },
  getUserRef: jest.fn(),
  getAccountRef: jest.fn(),
}));

// 3. Import dependencies
const { TransactionService } = await import('../../src/services/transactions');
const { db } = await import('../../src/firebase');

// 4. Test
it('should commit batch', async () => {
  await TransactionService.batchCreateTransactions(...);
  expect(mockBatch.commit).toHaveBeenCalled(); // Works because we kept the reference
});
```

### Pattern: Mocking `db.getAll` for Duplicate Checks
```typescript
(db.getAll as jest.Mock).mockResolvedValue([
  { exists: true, id: 'tx1' },  // Existing doc
  { exists: false, id: 'tx2' }, // New doc
]);
```
