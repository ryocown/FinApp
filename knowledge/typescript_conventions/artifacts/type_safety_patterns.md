# TypeScript Type Safety Patterns

## Const Assertions (`as const`)

Use `as const` to create deeply readonly objects with literal types. This is particularly useful for defining lookup trees or configuration objects where you want to preserve the exact string values as types.

### Example: Category Tree

Instead of using a plain object where values are inferred as `string`, use `as const` to infer the specific literal values.

```typescript
// Without as const
const BadTree = {
  Expense: {
    Food: 'Food' // Type is string
  }
};

// With as const
const GoodTree = {
  Expense: {
    Food: 'Food' // Type is 'Food'
  }
} as const;
```

### Benefits
1.  **Literal Inference**: Enables strict type checking against specific values.
2.  **Readonly**: Prevents accidental mutation of the structure at runtime (compile-time check).
3.  **Autocomplete**: Provides better IDE suggestions for nested properties.

## Object Property Overwriting

When spreading an object and attempting to overwrite a property in the same object literal, TypeScript/Linters may flag this as a "duplicate property" error or warning, even if the overwrite is intentional.

### Problem
```typescript
// Error: 'id' is specified more than once, so this usage will be overwritten.
const item = { ...data, id: newId };
```

### Solution
Use `Object.assign()` to explicitly merge objects without triggering the lint error.

```typescript
// Safe workaround
const item = Object.assign({}, data, { id: newId });
```

## Array Access Safety (`noUncheckedIndexedAccess`)

When `noUncheckedIndexedAccess` is enabled, accessing an array by index returns `T | undefined`, even if you are iterating with a standard loop, because TypeScript cannot guarantee the index is within bounds at compile time.

### Problem
```typescript
const items: string[] = ['a', 'b'];
for (let i = 0; i < items.length; i++) {
  const item = items[i]; // Type is string | undefined
  const value = data[item]; // Error: Type 'undefined' cannot be used as an index type
}
```

### Solution
Check that the item is defined before using it.

```typescript
const item = items[i];
if (item) {
  const value = data[item]; // Safe, item is string
}
```

### Common Pitfall: `split()[0]`
A frequent source of this error is splitting a string and taking the first element.

```typescript
// Error: Type 'undefined' is not assignable to type 'string'
const datePart = date.toISOString().split('T')[0]; 

// Fix: Explicit cast (if you are sure it exists) or check
const datePart = date.toISOString().split('T')[0] as string;
```

### Firestore/Snapshot Access Pattern

Even when checking `.empty` or `.length`, TypeScript may still consider indexed access as potentially undefined.

#### Problem
```typescript
if (!snapshot.empty) {
  // Error: Object is possibly 'undefined'
  const data = snapshot.docs[0].data(); 
}
```

#### Solution
Assign to a variable and check for existence.

```typescript
if (!snapshot.empty) {
  const doc = snapshot.docs[0];
  if (doc) {
    const data = doc.data();
  }
}
```

## Exact Optional Property Types (`exactOptionalPropertyTypes`)

When `exactOptionalPropertyTypes` is enabled in `tsconfig.json`, TypeScript distinguishes between a property being *missing* and a property being explicitly set to `undefined`.

### Problem
```typescript
interface User {
  name?: string; // string | undefined (if missing)
}

const u: User = {};
u.name = undefined; // Error: Type 'undefined' is not assignable to type 'string'
```

### Solution
If you need to allow `undefined`, you must explicitly include it in the type definition, or rely on omitting the key entirely.

```typescript
interface User {
  name?: string | undefined; // Explicitly allows undefined assignment
}
```

This is particularly relevant for Firestore models where `undefined` fields might be stripped or cause issues if not handled consistently.
 
## Enum Indexing with Strings
 
When you have a `Record` keyed by an Enum, but you try to access it using a generic `string` (e.g., from an API input), TypeScript will throw an error.
 
### Problem
```typescript
enum MyEnum {
  A = 'A',
  B = 'B'
}
 
const REGISTRY: Record<MyEnum, number> = {
  [MyEnum.A]: 1,
  [MyEnum.B]: 2
};
 
function getValue(key: string) {
  // Error: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Record<MyEnum, number>'.
  // No index signature with a parameter of type 'string' was found on type 'Record<MyEnum, number>'.
  return REGISTRY[key];
}
```
 
### Solution
Use a type cast (`as MyEnum`) to tell TypeScript to treat the string as a valid key, **but always pair this with a runtime check** because the cast suppresses the validity check.
 
```typescript
function getValue(key: string) {
  // 1. Cast to the Enum type
  const value = REGISTRY[key as MyEnum];
 
  // 2. Runtime check (essential!)
  if (value === undefined) {
    return null; // or throw error
  }
 
  return value;
}
```
