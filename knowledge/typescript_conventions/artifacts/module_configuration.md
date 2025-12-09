# TypeScript Module Configuration

## ESM vs CommonJS Alignment

When configuring TypeScript projects, it is critical to align the `package.json` type definition with the `tsconfig.json` module settings. A mismatch can lead to errors such as:
> "ECMAScript imports and exports cannot be written in a CommonJS file under 'verbatimModuleSyntax'"

### Common Cause
This error typically occurs when:
1. `tsconfig.json` is configured for modern ESM output:
   - `"module": "nodenext"` (or `esnext`)
   - `"verbatimModuleSyntax": true`
2. `package.json` is configured for CommonJS (or defaults to it):
   - `"type": "commonjs"` (or missing `"type"` field)

### Solution
To enable ECMAScript modules (ESM) fully:

1. **Update `package.json`**:
   Set the type to module.
   ```json
   {
     "type": "module"
   }
   ```

2. **Update Execution Scripts**:
   To support ESM with extensionless imports, use **`tsx`**.
   - **Recommended**: Use `tsx` (e.g., `tsx src/index.ts`). It supports ESM and handles extension resolution automatically.
   - **Legacy/Alternative**: `ts-node-esm` (requires explicit `.js` extensions in imports).

### Project-Wide Consistency
In the FinApp project, we strive for consistency across all packages (client, server, shared).
- **Client**: Uses `vite` with `verbatimModuleSyntax: true` in `tsconfig.app.json`.
- **Server**: Should match this strictness by using `type: "module"` and `verbatimModuleSyntax: true`.
- **Shared**: Must also be ESM (`"type": "module"`) to be imported by the ESM server.

### Example Configuration

**package.json**
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon --watch 'src/**/*.ts' --exec 'tsx' src/index.ts"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "esnext",
    "verbatimModuleSyntax": true
  }
}
```

**Note:** We use `"moduleResolution": "Bundler"` (instead of `NodeNext`) to allow **extensionless imports** while still outputting ESM. This relies on tools like `tsx` or `vite` to handle the actual file resolution at runtime/build time.

## ESM Global Variables
In ESM (`"type": "module"`), CommonJS globals like `__dirname` and `__filename` are **not available**. You must reconstruct them using `import.meta.url`.

**Pattern:**
```typescript
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Managing Global Types

When `tsconfig.json` has `"types": []` (often used to prevent automatic inclusion of all `@types/*` packages), global definitions like `node` or `jest` are **not** automatically available.

### Solution
1. **Explicit Imports**: Import globals from their respective packages (e.g., `import { jest } from '@jest/globals'`).
2. **Explicit Inclusion**: Add the specific types to the `types` array in `tsconfig.json`:
   ```json
   "compilerOptions": {
     "types": ["node", "jest"]
   }
   ```

## Erasable Syntax Configuration

### Erasable Syntax Only (`erasableSyntaxOnly`)
TypeScript 5.8+ introduces the `erasableSyntaxOnly` flag, which forbids syntax that cannot be simply "erased" to produce valid JavaScript (e.g., `enum`, `namespace`, `parameter properties`). This is useful for compatibility with bundlers like `esbuild` or `swc` that strip types without full type checking.

### Project Decision: Disabled
In this project, we have **disabled** `erasableSyntaxOnly` (`"erasableSyntaxOnly": false`) in `packages/client/tsconfig.app.json`.

**Reasoning:**
- We share code between the Server (Node.js) and Client (Vite) via the `packages/shared` workspace.
- The shared code uses TypeScript `enum`s (e.g., `AccountType`, `TransactionType`) for type safety and runtime value mapping.
- Enabling `erasableSyntaxOnly` in the client would cause build failures when importing these shared Enums.
- **Trade-off**: By disabling this flag, we allow the use of Enums but rely on Vite/esbuild to handle them correctly (which they generally do, though `const enum` is often preferred for pure erasure).

### Best Practices
While Enums are allowed, prefer **`const` objects with `as const`** for new definitions where runtime overhead is a concern or where simple string unions suffice.

```typescript
// Allowed (due to config), but consider alternatives for new code:
export enum AccountType {
  BANK = 'Bank'
}

// Preferred for strict erasure compatibility (if we ever re-enable the flag):
export const AccountType = {
  BANK: 'Bank',
  CREDIT_CARD: 'Credit Card'
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];
```
