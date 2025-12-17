# Layout Implementation

This document details the core application layout (App Shell), focusing on the fixed sidebar and scrollable main content area.

## App Shell Structure

The application uses a fixed sidebar layout where the navigation remains visible while the main content scrolls independently.

### 1. Sidebar (`Sidebar.tsx`)
The sidebar is fixed to the left side of the viewport to ensure it never scrolls out of view.

- **Positioning**: `fixed left-0 top-0 h-screen`
- **Z-Index**: `z-40` (ensures it stays above main content if needed, though currently side-by-side)
- **Width**: 
  - Expanded: `w-64` (256px)
  - Collapsed: `w-16` (64px)
- **Styling**: Dark background (`bg-[#18181b]`) with a right border (`border-zinc-800`).

<aside className={`${isOpen ? 'w-64' : 'w-16'} bg-[#18181b] border-r border-zinc-800 transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-40`}>
  {/* Content */}
</aside>
```

#### Nested Navigation
The sidebar supports nested navigation lists, specifically for the **Accounts** section, utilizing a **Split Button** pattern.
-   **Structure**: `Accounts (Split Button) -> Institute (Collapsible) -> Account (Link)`
-   **Interaction**:
    -   **Main Button**: Clicking the "Accounts" label/icon navigates directly to the Accounts page (`/accounts`).
    -   **Toggle Button**: Clicking the chevron icon toggles the visibility of the nested institute list without navigating.
-   **Animation**: Uses CSS Grid (`grid-template-rows` transition from `0fr` to `1fr`) for smooth height animation of the nested lists.
-   **Styling**: Includes rotating chevrons, hover slide-in effects for accounts, and active state indicators.


### 2. Main Content Area (`App.tsx`)
The main content area adjusts its left margin based on the sidebar's state to prevent overlap.

- **Margin**: 
  - Sidebar Open: `ml-64`
  - Sidebar Closed: `ml-16`
- **Transition**: `transition-all duration-300` matches the sidebar's animation for a smooth effect.
- **Flexibility**: `flex-1` to take up remaining width.

```tsx
<main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
  <Routes>
    {/* Page Routes */}
  </Routes>
</main>
```

## Layout Behavior

- **Scrolling**: The `<body>` or root element scrolls naturally. Since the sidebar is `fixed`, it stays in place while the `main` content scrolls.
- **Responsiveness**: The current implementation assumes a desktop-first approach with a collapsible sidebar. (Future: Mobile drawer implementation).
