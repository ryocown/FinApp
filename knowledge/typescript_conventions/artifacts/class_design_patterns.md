# TypeScript Class Design Patterns

## Getters and Setters

In modern TypeScript/JavaScript, writing explicit getters and setters (like `getInstituteId()` or `setInstituteId(id)`) for simple properties is generally considered **redundant and "un-idiomatic"**.

### Why?
1.  **Public by Default**: Properties are public by default. Accessing `institute.instituteId` directly is the standard way.
2.  **Accessors (`get`/`set` keywords)**: If you ever *need* to add logic (like validation or logging) later, you can switch to using the `get` and `set` keywords without changing the calling code (the API remains `institute.name`).
    ```typescript
    // Start with this:
    class Institute {
      name: string;
    }
    
    // Refactor to this later if needed, without breaking consumers:
    class Institute {
      private _name: string;
      get name() { return this._name; }
      set name(val: string) { 
        if (!val) throw new Error("Name required");
        this._name = val; 
      }
    }
    ```
3.  **Boilerplate**: Writing Java-style getters/setters adds noise for no runtime benefit.

### Recommendation
Stick to `public` properties (or just properties without modifiers) unless you specifically need encapsulation, validation, or side effects.
