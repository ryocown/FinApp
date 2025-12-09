# Import Workflow UI

## Overview
The import feature allows users to upload transaction history directly from the browser. It is designed to be "Premium" and confidence-inspiring, providing detailed feedback at every step.

## Import Modal UX (`ImportModal.tsx`)

The modal guides the user through distinct states:

### 1. File Selection
- **UI**: Large drag-and-drop zone.
- **Constraint**: Accepts `.csv` files only.
- **Feedback**: Visual highlight on drag over.

### 2. Parsing State
- **UI**: Loading skeleton or spinner.
- **Action**: Asynchronous client-side parsing using shared `StatementImporter` classes.

### 3. Preview State (Critical for Trust)
Before committing data, the user sees a summary of what *will* happen.
- **Summary Card**:
  - **Date Range**: e.g., "Jan 1, 2024 - Jan 31, 2024"
  - **Total Transactions**: Count of parsed rows.
  - **Net Amount**: Sum of all amounts (useful for quick sanity check).
- **Data Table**:
  - Shows the first 10-20 rows.
  - **Styling**: Positive amounts in green, negative in standard text.
- **Validation**:
  - Warnings for suspicious dates (e.g., far future, very old).

### 4. Uploading State
- **UI**: Progress bar showing percentage completion.
- **Logic**: Transactions are sent in batches (e.g., 200 items) to ensure reliability and progress tracking.

### 5. Result State
- **UI**: Success icon (optional confetti).
- **Stats**:
  - "45 Imported"
  - "5 Duplicates Skipped" (Feedback from server `duplicateCount`)
- **Actions**: "Upload Another" or "Done".

## Add Institute Flow
To support the import factory logic, the "Add Institute" flow is constrained.

- **Component**: `CreateInstituteModal.tsx`
- **Change**: "Institute Name" is now a `<select>` dropdown populated by the `SupportedInstitute` enum.
- **UI Enhancement**: Added an `Info` icon with a hover tooltip explaining the restriction ("We currently only support institutes with verified importers...").
- **Rationale**: Prevents users from creating institutes that the system doesn't know how to import from.

## Technical Implementation Details

### Browser Compatibility
- **Library**: `csv-parse` is used for parsing CSVs.
- **Polyfill Requirement**: `csv-parse` relies on the Node.js `Buffer` API, which is not available in the browser by default.
- **Solution**:
  - Installed `buffer` package.
  - Created `src/polyfills.ts` to assign `globalThis.Buffer = Buffer`.
  - Imported `polyfills.ts` at the very top of `src/main.tsx` (before `App` import) to ensure it runs before any module evaluation.
  
### UI Implementation Notes
- **Tooltip Overflow**: The `CreateInstituteModal` container must NOT have `overflow-hidden` set, otherwise the "Info" tooltip will be clipped. The tooltip is positioned absolutely relative to the icon but needs to float outside the modal boundaries.
