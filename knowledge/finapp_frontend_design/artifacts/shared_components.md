# Shared UI Components

This document details reusable UI components used across the application to ensure consistency and reduce code duplication.

## Modals

### DeleteConfirmationModal
A standardized modal for confirming destructive actions.

- **File**: `src/components/DeleteConfirmationModal.tsx`
- **Usage**:
  ```tsx
  <DeleteConfirmationModal
    isOpen={isOpen}
    onClose={handleClose}
    onConfirm={handleConfirm}
    title="Delete Item"
    message="Are you sure? This cannot be undone."
    itemName="Item Name" // Optional: highlighted in the modal
    loading={isDeleting} // Optional: shows spinner on confirm button
  />
  ```
- **Features**:
  - **Visual Warning**: Displays a red warning icon and destructive button styling.
  - **Loading State**: Disables buttons and shows a spinner during async operations.
  - **Backdrop**: Blurs the background for focus.
  - **Animation**: Subtle fade-in/zoom-in entry.

## Form Components

### CategoryPicker
A hierarchical, searchable dropdown for selecting transaction categories.

- **File**: `src/components/forms/CategoryPicker.tsx`
- **Usage**:
  ```tsx
  <CategoryPicker
    value={categoryId}
    onChange={(newValue) => setCategoryId(newValue)}
  />
  ```
- **Features**:
  - **Search**: Real-time filtering of categories by name or parent group.
  - **Hierarchy**: Displays category name and parent group (e.g., "Groceries" - "Food & Drink").
  - **Derived State**: Efficiently filters categories during render without redundant state.
  - **Auto-Focus**: Search input focuses automatically when opened.

## Icons
- **Library**: `lucide-react` is used for all icons (e.g., `Trash2`, `Plus`, `Building2`).
