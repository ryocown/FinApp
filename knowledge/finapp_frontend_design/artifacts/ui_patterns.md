# UI Patterns & Standards

## Date Formatting

Dates should always be displayed in the user's local timezone (Browser Locale).

- **Pattern**: Use `toLocaleDateString(undefined, options)` where `undefined` lets the browser use the default locale.
- **Avoid**: Hardcoding `'en-US'` unless specifically required for a fixed format.

### Examples

**Standard Date (e.g., "Jan 1, 2025")**:
```tsx
new Date(date).toLocaleDateString(undefined, { 
  month: 'short', 
  day: 'numeric', 
  year: 'numeric' 
})
```

**Short Date (e.g., "Jan 1")**:
```tsx
new Date(date).toLocaleDateString(undefined, { 
  month: 'short', 
  day: 'numeric' 
})
```

**Full Date with Weekday**:
```tsx
new Date(date).toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
})
```

## Enum & Text Formatting

### Uppercase Enums
Backend enums often use `UPPERCASE_WITH_UNDERSCORES` (e.g., `TransactionType.GENERAL`).
- **Display Rule**: Convert to **Title Case** for readability.
- **Pattern**: `value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()` (simple) or a more robust utility for multi-word enums.
- **Example**: `GENERAL` -> "General", `CREDIT_CARD` -> "Credit Card".


## Interactive Elements

### CSS-only Tooltip
For simple informational tooltips without JavaScript state overhead.
- **Pattern**: Use a parent `group` and a child with `opacity-0 invisible group-hover:opacity-100 group-hover:visible`.
- **Styling**: `absolute` positioning relative to the trigger.
- **Example**:
```tsx
<div className="group relative flex items-center">
  <InfoIcon className="cursor-help" />
  <div className="absolute bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
    Tooltip Content
    {/* Arrow */}
    <div className="absolute top-full ... border-t-zinc-700"></div>
  </div>
</div>
```

### Inline Editing
For editing simple fields (like names) directly within a list view without opening a modal.
- **State**: Requires local state for `isEditing` (boolean) and `editValue` (string).
- **UI**: Swaps a text display element for an `<input>` element.
- **Actions**:
    - **Save**: Triggered by Enter key or "Check" button. Calls async update function.
    - **Cancel**: Triggered by Escape key or "X" button. Reverts `editValue` to original and sets `isEditing` to false.
- **UX**:
    - Input should `autoFocus` when entering edit mode.
    - "Edit" trigger (pencil icon) should typically be hidden until hover (`group-hover`) to reduce visual clutter.
