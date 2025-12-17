# TypeScript Import Patterns

## Extensionless Imports
The project prefers **extensionless imports** for internal modules to maintain a clean, modern TypeScript style. To support this within an ESM environment (`"type": "module"`), we rely on build tools and runtimes that handle resolution automatically.

**Standard:**
```typescript
import { type ITransaction } from "../models/transaction";
```

**Tooling Requirements:**
- **Server**: Use `tsx` (instead of `ts-node`) to execute TypeScript files. `tsx` handles ESM resolution for extensionless imports on the fly.
- **Client**: Uses `vite`, which naturally supports extensionless imports.
- **Shared**: When consumed by the above tools, extensionless imports work seamlessly.

## Type-Only Imports
Use `import type` when importing types to ensure they are erased during compilation and to make intent clear. This is **required** when `verbatimModuleSyntax: true` is enabled in `tsconfig.json`, as it prevents the compiler from emitting import statements for types (which would cause runtime errors in ESM).

**Standard:**
```typescript
import express, { type Request, type Response } from 'express';
```

## CommonJS Interop in ESM
When importing CommonJS modules (like `firebase-admin`) into an ESM project (`"type": "module"`), you must use the **default import** syntax if the module exports a single object via `module.exports`. Using namespace imports (`import * as ...`) may result in runtime errors like `TypeError: ... is not a function`.

**Standard:**
```typescript
// Correct for firebase-admin in ESM
import admin from 'firebase-admin';

// Incorrect (causes runtime error)
import * as admin from 'firebase-admin';
```
