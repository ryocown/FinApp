# TypeScript UUID Usage

## Problem
When using the `uuid` package in TypeScript, a common error is attempting to instantiate `v4` as a class:

```typescript
import { v4 } from 'uuid';
const id = new v4(); // Error: 'new' expression, whose target lacks a construct signature...
```

## Solution
The `v4` export from the `uuid` package is a function, not a class constructor. It should be invoked directly:

```typescript
import { v4 } from 'uuid';
const id = v4(); // Correct: Returns a string UUID
```

## Type
The return type of `v4()` is `string`.

## UUID v5 (Deterministic)

For generating deterministic UUIDs based on input data (hashing), use `v5`.

```typescript
import { v5 } from 'uuid';

// 1. Define a namespace UUID (can be generated via v4 once and hardcoded)
const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// 2. Generate ID based on data
const data = "some_unique_string_or_content";
const id = v5(data, NAMESPACE); 
// id will always be the same for the same data + namespace
```

## Jest Compatibility (ESM Issues)

When using `uuid` (v11+) with Jest and `ts-jest`, you may encounter the following error:

```text
SyntaxError: Unexpected token 'export'
/path/to/node_modules/uuid/dist-node/index.js:1
```

### Cause
This occurs because `uuid` exposes an ESM build (`dist-node/index.js`) which Jest (running in Node.js CommonJS mode by default) fails to parse. Jest's default behavior is to ignore `node_modules` during transformation.

### Workaround
You need to configure Jest to transform the `uuid` package or map it to a CommonJS build if available.

**Option 1: Module Name Mapping (in `jest.config.js`)**
Attempt to map to a CommonJS version if the package provides one, or ensure `ts-jest` is configured to handle ESM correctly.

**Option 2: Transform Ignore Patterns**
Allow `uuid` to be transformed:
```

**Option 3: Direct Mocking (Simplest)**
If you only need `v4()` to generate a string (e.g., for ID generation) and don't need the actual library logic, simply mock it in your test file. This bypasses the ESM import entirely.

```typescript
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));
```


