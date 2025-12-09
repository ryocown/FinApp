# Importer Registry Pattern

The Importer Registry is a centralized configuration that maps financial institutions and their supported account types to specific `StatementImporter` implementations. This pattern ensures deterministic importer selection and enables UI features like restricted account creation.

## 1. Capabilities Definition

Located in: `packages/shared/importer/capabilities.ts`

This file defines the capabilities of the system regarding supported institutes and accounts.

### Supported Accounts Mapping

`INSTITUTE_SUPPORTED_ACCOUNTS` maps each `SupportedInstitute` to a list of `AccountType`s that the system can handle for that institute.

```typescript
export const INSTITUTE_SUPPORTED_ACCOUNTS: Record<string, AccountType[]> = {
  [SupportedInstitute.CHASE]: [AccountType.BANK, AccountType.CREDIT_CARD],
  [SupportedInstitute.MORGAN_STANLEY]: [AccountType.INVESTMENT],
  // ...
};
```

This mapping is used by the UI (e.g., `CreateAccountModal`) to filter the "Account Type" dropdown, preventing users from creating accounts that cannot be imported.

## 2. Importer Registry

Also located in: `packages/shared/importer/capabilities.ts`

This constant maps specific `(Institute, AccountType)` pairs to their corresponding `StatementImporter` class constructors. It uses `Partial` to allow institutes to support only a subset of all defined `AccountType`s.

```typescript
type ImporterConstructor = new (accountId: string, userId: string) => IStatementImporter;
type InstituteImporterMap = Partial<Record<AccountType, ImporterConstructor>>;

export const IMPORTER_REGISTRY: Record<string, InstituteImporterMap> = {
  [SupportedInstitute.CHASE]: {
    [AccountType.BANK]: ChaseCsvStatementImporter,
    [AccountType.CREDIT_CARD]: ChaseCreditCsvStatementImporter,
  },
  [SupportedInstitute.MORGAN_STANLEY]: {
    [AccountType.INVESTMENT]: MorganStanleyStatementImporter,
  }
};
```

## 3. Factory Implementation

The `getImporterForInstitute` factory function uses this registry to instantiate the correct importer.

```typescript
export function getImporterForInstitute(
  instituteName: string,
  accountType: AccountType,
  accountId: string,
  userId: string
): IStatementImporter | null {
  // Cast string to SupportedInstitute to satisfy TypeScript
  // The registry is keyed by the enum, but input is a raw string
  const instituteRegistry = IMPORTER_REGISTRY[instituteName as SupportedInstitute];
  
  // Runtime check handles invalid strings that don't map to an institute
  if (!instituteRegistry) return null;

  const ImporterClass = instituteRegistry[accountType];
  if (!ImporterClass) return null;

  return new ImporterClass(accountId, userId);
}
```

### Type Safety Note
The factory accepts a raw `string` for the institute name (likely coming from a UI dropdown or API payload) but the `IMPORTER_REGISTRY` is strictly typed with `SupportedInstitute` enum keys. We use a type cast `as SupportedInstitute` to perform the lookup, relying on the runtime check `if (!instituteRegistry)` to safely handle any invalid strings that don't actually exist in the registry.

## 4. Benefits

1.  **Explicit Resolution**: Removes ambiguity and heuristics (e.g., guessing based on file name).
2.  **Type Safety**: Ensures that only valid combinations of Institute and Account Type are used.
3.  **UI Integration**: The capabilities mapping drives the UI, ensuring consistency between what users can create and what the system can import.
