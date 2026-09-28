# CLAUDE.md — My Finance Tracker (Tutor Pro)

## Project Overview

Personal finance + tutoring management web application.
Frontend: **Next.js 16 (App Router)** + **React 19** + **TypeScript**.
Backend API: separate repository, default at `http://localhost:8888`.

## Tech Stack

| Layer             | Technology                             |
| ----------------- | -------------------------------------- |
| Framework         | Next.js 16 (App Router)                |
| UI Library        | React 19                               |
| Language          | TypeScript (strict mode)               |
| Styling           | Tailwind CSS v4                        |
| Component Library | shadcn/ui (Radix UI)                   |
| State (client)    | Redux Toolkit + Redux Persist          |
| State (server)    | TanStack React Query v5                |
| HTTP Client       | Axios (with interceptors)              |
| Forms             | React Hook Form + Zod v4 validation    |
| Notifications     | Sonner (toast)                         |
| Icons             | Lucide React                           |
| Package Manager   | Bun                                    |
| Testing           | Vitest + React Testing Library + jsdom |
| Linting           | ESLint (eslint-config-next)            |

## Commands

```bash
bun start:dev          # Start Next.js dev server
bun run build          # Production build
bun run start          # Start production server
bun run lint           # Run ESLint
bun run test           # Run tests (vitest run)
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage (Istanbul)
```

## Project Structure

```
app/
├── layout.tsx              # Root layout (fonts, providers, Toaster)
├── globals.css             # Global styles + Tailwind
├── (app)/                  # Authenticated route group
│   ├── layout.tsx          # App layout (sidebar, auth guard)
│   ├── root.layout.tsx     # Root app layout component
│   ├── page.tsx            # Dashboard home
│   ├── accounts/page.tsx   # Accounts / wallets
│   ├── analytics/page.tsx  # Analytics
│   ├── budgets/page.tsx    # Budgets
│   ├── categories/page.tsx # Categories
│   ├── classes/
│   │   ├── page.tsx        # Class list
│   │   └── [id]/
│   │       ├── page.tsx         # Class detail
│   │       └── curriculum/page.tsx  # Curriculum
│   ├── discussions/page.tsx  # Parent discussions
│   ├── investments/page.tsx  # Investments
│   ├── students/page.tsx     # Students (with CRUD + pagination)
│   └── transactions/page.tsx # Transactions
├── (auth)/                 # Public auth route group
│   ├── auth.layout.tsx     # Auth layout (centered card)
│   ├── layout.tsx          # Auth root layout
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── verify-otp/page.tsx
│   └── oauth/callback/page.tsx  # OAuth callback (Google/Facebook)
components/
├── ui/                     # Base UI primitives (shadcn/ui)
│   ├── button.ui.tsx       # Button with CVA variants + loading + asChild
│   ├── card.ui.tsx
│   ├── dialog.ui.tsx
│   ├── field.ui.tsx
│   ├── input.ui.tsx
│   ├── label.ui.tsx
│   ├── menu-popover.ui.tsx
│   ├── otp-input.ui.tsx
│   ├── select.ui.tsx
│   ├── separator.ui.tsx
│   ├── sidebar.ui.tsx
│   └── index.ts
├── providers/              # Context providers
│   ├── query.provider.tsx       # TanStack Query
│   ├── redux.provider.tsx       # Redux store
│   ├── theme.provider.tsx       # Dark/light theme
│   ├── auth.provider.tsx        # Auth context
│   ├── auth-guard.tsx           # Auth guard (redirect unauthenticated)
│   └── color-theme.provider.tsx # Color theme (oklch presets)
├── auth/                   # Auth-related components
├── accounts/               # Accounts / wallet management
├── analytics/              # Analytics charts
├── budgets/                # Budget management
├── categories/             # Category management
├── classes/                # Class management
├── discussions/            # Discussion threads
├── investments/            # Investment tracking
├── students/               # Student management (add/edit/delete dialogs)
├── transactions/           # Transaction management
├── dashboard/              # Dashboard components
├── layout/                 # Layout components (sidebar, header)
└── theme/                  # Theme picker dialog
hooks/                      # Custom React hooks
├── useAuth.hook.ts          # Auth state hook
├── useCurrentUserId.ts      # Get current user ID from Redux
├── useForgotPassword.hook.ts
├── useOtp.hook.ts
├── useQuery.hook.ts         # Shared query hook wrapper
└── use-mobile.ts
lib/
├── axios.ts                # Axios instance, interceptors, error handling
├── api-error.ts            # ApiError class + getErrorMessage()
├── api-unwrap.ts           # unwrapApiData() helper
├── auth-refresh.ts         # Token refresh logic
├── auth-redirect.ts        # Auth redirect helpers
├── auth-storage.ts         # Token storage helpers
├── color-themes.ts         # Color theme definitions + CSS var application
├── form-error.ts           # Form error handling
├── oauth.ts                # startGoogleOAuth() / startFacebookOAuth()
├── query.ts                # Query/mutation hooks (see below)
├── refresh-access-token.ts # Access token refresh
├── utils.ts                # cn() and general utilities
└── store/
    ├── store.ts            # Redux store config
    ├── hooks.ts            # Typed Redux hooks (useAppSelector, useAppDispatch)
    ├── persist-storage.ts  # Redux Persist storage config
    └── slices/
        └── auth.slice.ts   # Auth state slice (accessToken, refreshToken, user)
types/
├── index.ts                # Re-exports
├── error.types.ts          # ApiError, ApiErrorResponse types
└── student.types.ts        # Student, ApiStudent, StudentsApiPayload, UpdateStudentPayload
test/
├── setup.ts                # Vitest setup (jest-dom matchers)
├── app/                    # Tests for app routes
├── components/             # Tests for components
├── hooks/                  # Tests for hooks
├── lib/                    # Tests for lib utilities
└── unit/                   # Additional unit tests
```

## Code Conventions

### File Naming

- **UI components**: `{name}.ui.tsx` (e.g., `button.ui.tsx`, `card.ui.tsx`)
- **Feature components**: `{name}.tsx` or `{name}.component.tsx`
- **Hooks**: `use{Name}.hook.ts` (e.g., `useAuth.hook.ts`)
- **Types**: `{name}.types.ts`
- **Redux slices**: `{name}.slice.ts`

### Path Alias

- `@/*` maps to the project root (e.g., `@/components/...`, `@/lib/...`)

### Provider Hierarchy (root layout)

```
QueryProvider → ReduxProvider → ThemeProvider → AuthProvider → {children}
```

`ColorThemeProvider` is applied inside `ThemeProvider` to inject CSS vars per theme.

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility from `@/lib/utils` (clsx + tailwind-merge) for conditional classes
- Theme: dark mode support via CSS class strategy (`html.dark`)
- Color themes: 9 presets (claude, twitter, violet-bloom, supabase, tangerine, darkmatter, doom-64, modern-minimal, t3-chat) defined in `lib/color-themes.ts` using oklch values

### State Management

- **Client state** (auth, UI): Redux Toolkit with Redux Persist
- **Server state**: TanStack React Query (fetching, caching, mutations)
- Use typed hooks from `@/lib/store/hooks` (`useAppSelector`, `useAppDispatch`)

### API Communication

- All API calls go through `axiosInstance` from `@/lib/axios`
- Base URL configured via `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:8888`)
- JWT Bearer token attached automatically via request interceptor
- 401 responses trigger automatic token refresh via response interceptor
- If refresh fails, user is redirected to `/login`
- API errors wrapped in `ApiError` class with `message`, `statusCode`, and `data`; use `getErrorMessage()` to extract safe display strings
- Auth endpoints (login, register, forgot-password, reset-password) skip 401 refresh
- OAuth: Google and Facebook via `startGoogleOAuth()` / `startFacebookOAuth()` in `lib/oauth.ts`; callback handled at `(auth)/oauth/callback/page.tsx`

### Query / Mutation Helpers (`lib/query.ts`)

Prefer these wrappers over raw `useQuery` / `useMutation`:

```ts
useGet<TRaw, TData>(queryKey, url, options?)    // GET + useQuery
usePost<TData, TPayload>(url, options?)          // POST + useMutation
usePut<TData, TPayload>(url | fn, options?)      // PUT; url can be (payload) => string
useDelete<TData, TPayload>(url | fn, options?)   // DELETE; url can be (payload) => string
```

Raw helpers also available: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`.
Legacy aliases: `useApiQuery` = `useGet`, `useApiMutation` = `usePost`.

### Button Component (`components/ui/button.ui.tsx`)

Uses CVA variants. Key props:

- `variant`: `default | outline | secondary | ghost | destructive | link`
- `size`: `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`
- `loading`: boolean — disables button and sets `aria-busy`
- `asChild`: boolean — renders as `Slot.Root` (Radix UI)

### Forms & Validation

- Use React Hook Form for form state management
- Use Zod v4 schemas for validation
- Use `@hookform/resolvers` for Zod integration
- Form errors handled via `@/lib/form-error` utilities

### Testing

- Test files live in `test/` directory mirroring source structure
- Test file naming: `*.test.ts` or `*.test.tsx`
- Test framework: Vitest with jsdom environment
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for user interactions
- Custom matchers from `@testing-library/jest-dom/vitest`
- Coverage: Istanbul provider, covering `app/`, `components/`, `lib/`

## Environment Variables

| Variable              | Description          | Default                 |
| --------------------- | -------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (gateway) | `http://localhost:8888` |
| `NEXT_PUBLIC_THIRD_SERVICE_URL` | THIRD_SERVICE base URL — sockets aren't proxied through the gateway, so the `/logs` realtime feed (`hooks/useLogSocket.hook.ts`) connects here directly | `http://localhost:4000` |

## Git Remote

```
origin: https://gitlab.com/finance_tracker_phandanghai/my-finance-tracker.git
```

## Project Rules

Quy ước code FE và tích hợp API (FE ↔ BE) sống trong `.claude/rules/*.md` (nguồn duy nhất — sửa quy
ước thì sửa ở đó, không chép lại vào file này):

- `structure-naming.md` — đặt tên file, path alias, cấu trúc route, testing.
- `fe-rbac-role-guarding.md` — phân quyền route theo role (ADMIN/TUTOR/STUDENT/PARENT).
- `ui-components.md` — primitives `components/ui/*` (Button, Dialog/ConfirmDialog, DataTable,
  Pagination...), quy tắc không dùng thẻ HTML thô, style/Tailwind.
- `i18n-copy.md` — UI copy (vi + en) qua dictionary `lib/i18n/*.dictionary.ts` + hook `use{Name}Copy`.
- `state-and-forms.md` — Redux/Redux Persist, TanStack Query, React Hook Form + Zod v4.
- `api-integration.md` — hợp đồng gọi API với BE (wrapper `useGet`/`usePost`/`usePut`/`useDelete`,
  bóc response, phân trang, 401/refresh, lỗi, endpoint catalog).

## Configuration

| File | Purpose |
|------|---------|
| `opencode.json` | Project permissions — deny Write on `.env*`, allow bun commands, eslint --fix |
| `CLAUDE.md` (this file) | Agent instructions — inlined rules, conventions, API integration |
| `.claude/skills/` | Reusable skill definitions (generate-page, generate-query-hook) |

> Note: opencode does not support event hooks (PreToolUse/PostToolUse/Stop). Guard-env is replaced by `permissions.deny` in `opencode.json`. Format via `bun run lint` / `bunx eslint --fix` (manual or pre-commit). Knowledge review is covered by this file.

> Ghi chú: FE là một trong hai repo con của `D:\projects` (hệ giáo dục/gia sư). Tên "My Finance
> Tracker" ở trên là di sản cũ — domain thực tế là lớp học/gia sư. Xem `../CLAUDE.md` (folder chung).

## Key Files to Know

- `lib/axios.ts` — Central HTTP client with auth interceptors
- `lib/query.ts` — `useGet` / `usePost` / `usePut` / `useDelete` hooks
- `lib/store/store.ts` — Redux store configuration
- `lib/store/slices/auth.slice.ts` — Auth state (accessToken, refreshToken, user)
- `lib/store/hooks.ts` — Typed Redux hooks
- `lib/color-themes.ts` — Color theme definitions and CSS var injection
- `lib/oauth.ts` — OAuth redirect helpers
- `components/providers/` — All context providers
- `components/ui/button.ui.tsx` — Button with CVA variants, loading state, asChild
- `components/ui/input.ui.tsx` — Input (invalid/outlinedSlot props)
- `components/ui/label.ui.tsx` — Label (Radix LabelPrimitive)
- `components/ui/select.ui.tsx` — Select (custom dropdown, not native)
- `components/ui/table.ui.tsx` — Table/TableHeader/TableBody/TableRow/TableHead/TableCell
- `components/ui/data-table.ui.tsx` — DataTable (column config + auto empty/loading/error)
- `components/ui/dialog-form.ui.tsx` — Dialog (overlay + card, portal, fixed header/footer)
- `components/ui/pagination.ui.tsx` — Pagination (page, totalPages, onPageChange)
- `components/ui/usage-guide.ui.tsx` — UsageGuides (auto toggle via Zustand)
- `app/layout.tsx` — Root layout with provider tree
- `types/error.types.ts` — API error type definitions
- `types/student.types.ts` — Student domain types
