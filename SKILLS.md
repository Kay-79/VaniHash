---
description: Comprehensive guide to the frontend architecture, coding standards, and best practices for the VaniHash project.
---

# VaniHash Frontend Skills & Standards

This document serves as the **SINGLE SOURCE OF TRUTH** for all AI models and developers working on the `VaniHash/web` frontend. **ALWAYS** refer to this file before writing any code.

## 1. Tech Stack

-   **Framework:** Next.js 16 (App Router)
-   **Library:** React 19
-   **Language:** TypeScript 5 (Strict Mode)
-   **Styling:** Tailwind CSS 4 (with CSS Variables & Oklch colors)
-   **State Management:** React Context + TanStack Query (v5)
-   **Blockchain Interaction:** `@mysten/dapp-kit`, `@mysten/sui`
-   **Icons:** `lucide-react`
-   **UI Primitives:** Radix UI (`@radix-ui/*`)
-   **Utilities:** `clsx`, `tailwind-merge`, `sonner` (Toast)

## 2. Project Structure

All source code resides in `src/`. Follow this directory structure strictly:

-   `src/app/` -> App Router pages, layouts, providers, `globals.css`.
-   `src/components/ui/` -> Reusable, generic UI components (Buttons, Dialogs, Inputs). **Keep these pure.**
-   `src/components/[feature]/` -> Feature-specific components (e.g., `marketplace`, `miner`, `layout`).
-   `src/hooks/` -> Custom React hooks (e.g., `useMarketplace.ts`, `useMining.ts`).
-   `src/lib/` -> Library configurations and core utilities (e.g., `utils.ts` for `cn`).
-   `src/types/` -> Shared TypeScript interfaces and types.
-   `src/utils/` -> Helper functions (formatters, parsers).
-   `src/constants/` -> Constant values (chain config, address constants).

## 3. Coding Standards

### Naming Conventions
-   **Components:** `PascalCase` (e.g., `WalletConnect.tsx`, `MiningCard.tsx`).
-   **Hooks:** `camelCase` starting with `use` (e.g., `useMarketplace.ts`).
-   **Functions/Variables:** `camelCase` (e.g., `shortenAddress`, `isLoading`).
-   **Types/Interfaces:** `PascalCase` (e.g., `ListingItem`, `AccountProps`).
-   **Constants:** `UPPER_SNAKE_CASE` (e.g., `PACKAGE_ID`, `MAX_RETRIES`).

### Component Patterns
-   **Functional Components ONLY.** Do not use Class components.
-   **Named Exports:** Always use named exports (e.g., `export function MyComponent() {}`).
-   **Props:** Use TypeScript interfaces for props, destructure immediately.
    ```tsx
    interface MyComponentProps {
        title: string;
        isActive?: boolean;
    }
    export function MyComponent({ title, isActive = false }: MyComponentProps) { ... }
    ```

### Data Fetching & Blockchain
-   **Sui Integration:** structure interaction within custom hooks in `src/hooks/`.
-   **Reading Data:** Use `useSuiClientQuery` from `@mysten/dapp-kit` or `useQuery` from `@tanstack/react-query`.
-   **Writing Data:** Use `useSignAndExecuteTransaction` or `useSignTransaction` inside your custom hooks.
-   **Error Handling:** Always handle `onError` and `onSuccess` callbacks in mutations.

### Styling (Tailwind CSS 4)
-   **Utility-First:** Use Tailwind utility classes primarily.
-   **Class Merging:** Always use the `cn()` utility (from `src/lib/utils.ts`) when accepting `className` props or conditional styling.
    ```tsx
    <div className={cn("p-4 bg-white", className, isActive && "bg-blue-500")}>
    ```
-   **Design Tokens:** Use CSS variables defined in `src/app/globals.css` (e.g., `bg-background`, `text-primary`). Do not hardcode hex values if a variable exists.
-   **Icons:** Use `lucide-react` icons.

## 4. TypeScript Usage

-   **Strictness:** Strictly typed. No `any` unless absolutely necessary (and commented with reasoning).
-   **Types vs Interfaces:** Prefer `interface` for object shapes and component props. Use `type` for unions, intersections, or primitives.
-   **Imports:** Use path aliases `@/*` for all local imports (e.g., `import { Button } from '@/components/ui/Button'`).

## 5. UI/UX Consistency

-   **Theme:** Respect the Oklch color palette in `globals.css`.
-   **Dark Mode:** Ensure compatibility with dark mode (using `dark:` prefix or CSS variables that adapt).
-   **Responsiveness:** Mobile-first approach.
-   **Feedback:** Use `sonner` for toast notifications on success/error actions.

## 6. Git & Commit Rules

-   **Conventional Commits:** Follow standard format:
    -   `feat: add mining dashboard`
    -   `fix: resolve wallet connection timeout`
    -   `refactor: clean up marketplace hook`
    -   `style: update button padding`
    -   `chore: bump dependencies`
-   **Granularity:** Small, atomic commits.

---

**Final Check:** Before submitting any code, verify it compiles (`npm run build` or `tsc`), lints (`npm run lint`), and follows the patterns above.
