# Existing Pages

## Auth (`(auth)`)


| Route              | File                                  |
| ------------------ | ------------------------------------- |
| `/login`           | `app/(auth)/login/page.tsx`           |
| `/register`        | `app/(auth)/register/page.tsx`        |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` |
| `/reset-password`  | `app/(auth)/reset-password/page.tsx`  |
| `/verify-otp`      | `app/(auth)/verify-otp/page.tsx`      |
| `/oauth/callback`  | `app/(auth)/oauth/callback/page.tsx`  |


## App (authenticated) (`(app)`)


| Route           | File                 |
| --------------- | -------------------- |
| `/` (Dashboard) | `app/(app)/page.tsx` |


### Master Data


| Route            | File                               |
| ---------------- | ---------------------------------- |
| `/students`      | `app/(app)/students/page.tsx`      |
| `/students/[id]` | `app/(app)/students/[id]/page.tsx` |
| `/tutors`        | `app/(app)/tutors/page.tsx`        |
| `/users`         | `app/(app)/users/page.tsx`         |
| `/categories`    | `app/(app)/categories/page.tsx`    |


### Classes &amp; Sessions


| Route                                            | File                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `/classes`                                       | `app/(app)/classes/page.tsx`                                       |
| `/classes/[id]`                                  | `app/(app)/classes/[id]/page.tsx`                                  |
| `/classes/[id]/curriculum`                       | `app/(app)/classes/[id]/curriculum/page.tsx`                       |
| `/classes/[id]/exercise`                         | `app/(app)/classes/[id]/exercise/page.tsx`                         |
| `/classes/[id]/sessions/[sessionId]`             | `app/(app)/classes/[id]/sessions/[sessionId]/page.tsx`             |
| `/classes/[id]/sessions/[sessionId]/exercise`    | `app/(app)/classes/[id]/sessions/[sessionId]/exercise/page.tsx`    |
| `/classes/[id]/sessions/[sessionId]/submissions` | `app/(app)/classes/[id]/sessions/[sessionId]/submissions/page.tsx` |


### Sessions


| Route            | File                               |
| ---------------- | ---------------------------------- |
| `/sessions`      | `app/(app)/sessions/page.tsx`      |
| `/sessions/[id]` | `app/(app)/sessions/[id]/page.tsx` |


### Curriculum


| Route              | File                                 |
| ------------------ | ------------------------------------ |
| `/curriculum`      | `app/(app)/curriculum/page.tsx`      |
| `/curriculum/[id]` | `app/(app)/curriculum/[id]/page.tsx` |


### Schedule


| Route       | File                          |
| ----------- | ----------------------------- |
| `/schedule` | `app/(app)/schedule/page.tsx` |


### Grades


| Route     | File                        |
| --------- | --------------------------- |
| `/grades` | `app/(app)/grades/page.tsx` |


### Finance


| Route           | File                              |
| --------------- | --------------------------------- |
| `/accounts`     | `app/(app)/accounts/page.tsx`     |
| `/transactions` | `app/(app)/transactions/page.tsx` |
| `/fees`         | `app/(app)/fees/page.tsx`         |
| `/budgets`      | `app/(app)/budgets/page.tsx`      |
| `/investments`  | `app/(app)/investments/page.tsx`  |


### Reports &amp; Analytics


| Route        | File                           |
| ------------ | ------------------------------ |
| `/reports`   | `app/(app)/reports/page.tsx`   |
| `/analytics` | `app/(app)/analytics/page.tsx` |


### Communication


| Route            | File                               |
| ---------------- | ---------------------------------- |
| `/discussions`   | `app/(app)/discussions/page.tsx`   |
| `/notifications` | `app/(app)/notifications/page.tsx` |
| `/ai-chat`       | `app/(app)/ai-chat/page.tsx`       |


### Settings


| Route       | File                          |
| ----------- | ----------------------------- |
| `/settings` | `app/(app)/settings/page.tsx` |


### Monitoring (ADMIN only — `(admin)` route group)


| Route           | File                                         |
| --------------- | -------------------------------------------- |
| `/logger`       | `app/(app)/(admin)/logger/page.tsx`          |
| `/test-monitor` | `app/(app)/(admin)/test-monitor/page.tsx`    |


---

**Total: 36 pages** — Auth: 6 | App: 30

---

# Query Hook Reference

## Hook Signatures (`lib/query.ts`)


| Hook                         | HTTP   | Route Params                        | Body                                 | Query Params                           |
| ---------------------------- | ------ | ----------------------------------- | ------------------------------------ | -------------------------------------- |
| `useGet<T>(key, url, opts?)` | GET    | Embedded in `url` string            | —                                    | `opts.params: Record<string, unknown>` |
| `usePost<T>(url, opts?)`     | POST   | Embedded in `url` string            | `mutation.mutate(payload)`           | —                                      |
| `usePut<T>(url|fn, opts?)`   | PUT    | `fn: (payload) => string` or static | `mutation.mutate(payload)`           | —                                      |
| `usePatch<T>(url|fn, opts?)` | PATCH  | `fn: (payload) => string` or static | `mutation.mutate(payload)`           | —                                      |
| `useDelete<T>(fn, opts?)`    | DELETE | `fn: (id) => string`                | `mutation.mutate(id)` (payload = id) | —                                      |


**Key**: For `usePut`/`usePatch`/`useDelete`, when `url` is a function, it receives the **same payload** sent as body — so you can extract id: `(p) => \`/students/${p.id}`.

## Data Flow

```css
Service Hook → useGet/usePost/... → axiosInstance → API
                    ↓
            unwrapApiData(raw)  ← strips { data: T } envelope
                    ↓
              Component
```

## Common Patterns


| Pattern                  | How                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **List with pagination** | `useGet(key, url, { params: { page, limit }, select: ... })` — query key includes page/filter values          |
| **Detail by ID**         | `useGet(["key", id], \`/url/${id}, { enabled: !!id })`—`enabled` guard prevents fetch when id is undefined    |
| **Create**               | `usePost<T, Payload>(url).mutate(payload, { onSuccess: ... })`                                                |
| **Update**               | `usePut<T, Payload>(p => \`/url/${p.id}).mutate(payload)`                                                     |
| **Delete**               | `useDelete((id) => \`/url/${id}).mutate(id)`                                                                  |
| **Query params**         | `opts.params: { search, classId, limit }` — passed as URL query string                                        |
| **Cache invalidation**   | `queryClient.invalidateQueries({ queryKey: [...] })` after mutations                                          |
| **Error display**        | `getErrorMessage(err, "fallback")` from `@/lib/api-error`                                                     |
| **URL param (page)**     | Next.js 16: `params` is `Promise` — `const { id } = await params` in server component, pass as prop to client |


# Page API Usage Details

## Auth (`(auth)`)


| Route              | Hook | Endpoint                                       | Params / Body                          |
| ------------------ | ---- | ---------------------------------------------- | -------------------------------------- |
| `/login`           | —    | `POST /auth/login`                             | Body: `{ email, password }`            |
| `/register`        | —    | `POST /auth/register`                          | Body: `{ email, password, name, ... }` |
| `/forgot-password` | —    | `POST /auth/forgot-password`                   | Body: `{ email }`                      |
| `/reset-password`  | —    | `POST /auth/reset-password`                    | Body: `{ token, password }`            |
| `/verify-otp`      | —    | `POST /auth/verify-otp`                        | Body: `{ email, otp }`                 |
| `/oauth/callback`  | —    | `GET /auth/oauth/{provider}/callback?code=...` | Query: `code` from URL                 |


## Master Data


| Route            | Hook                          | Endpoint               | Params / Body                                  |
| ---------------- | ----------------------------- | ---------------------- | ---------------------------------------------- |
| `/students`      | `useStudents(params)`         | `GET /students`        | Query: `{ page, limit: 8, search, classCode }` |
|                  | `useDeleteStudent()`          | `DELETE /students/:id` | Body: `id` (string)                            |
| `/students/[id]` | `useStudentDetail(id)`        | `GET /students/:id`    | Route: `:id`                                   |
|                  | `useExercises({ studentId })` | `GET /exercises`       | Query: `{ studentId, limit: 100 }`             |
| `/tutors`        | —                             | `GET /tutors`          | —                                              |
| `/users`         | —                             | `GET /users`           | —                                              |
| `/categories`    | —                             | `GET /categories`      | —                                              |


## Classes &amp; Sessions


| Route                                            | Hook                                                      | Endpoint                    | Params / Body                         |
| ------------------------------------------------ | --------------------------------------------------------- | --------------------------- | ------------------------------------- |
| `/classes`                                       | `useGet(["classes-list"], "/classes")`                    | `GET /classes`              | Query: `{ limit: 100 }`               |
| `/classes/[id]`                                  | `useGet(["class-detail", id], "/classes/:id")`            | `GET /classes/:id`          | Route: `:id`                          |
|                                                  | `useGet(["class-students", id], "/classes/:id/students")` | `GET /classes/:id/students` | Route: `:id`                          |
|                                                  | `useGet(["class-lessons", curriculumId], "/lesson")`      | `GET /lesson`               | Query: `{ curriculumId, limit: 100 }` |
|                                                  | `useGet(["class-sessions", id], "/sessions")`             | `GET /sessions`             | Query: `{ classId, limit: 100 }`      |
|                                                  | `axiosInstance.put("/sessions/:id", body)`                | `PUT /sessions/:id`         | Body: `{ status: "COMPLETED" }`       |
|                                                  | `axiosInstance.delete("/sessions/:id")`                   | `DELETE /sessions/:id`      | Route: `:id`                          |
| `/classes/[id]/curriculum`                       | —                                                         | —                           | —                                     |
| `/classes/[id]/exercise`                         | —                                                         | —                           | —                                     |
| `/classes/[id]/sessions/[sessionId]`             | —                                                         | —                           | Route: `:id`, `:sessionId`            |
| `/classes/[id]/sessions/[sessionId]/exercise`    | —                                                         | —                           | Route: `:id`, `:sessionId`            |
| `/classes/[id]/sessions/[sessionId]/submissions` | —                                                         | —                           | Route: `:id`, `:sessionId`            |


## Sessions


| Route            | Hook                           | Endpoint            | Params / Body            |
| ---------------- | ------------------------------ | ------------------- | ------------------------ |
| `/sessions`      | `useSessions({ page, limit })` | `GET /sessions`     | Query: `{ page, limit }` |
| `/sessions/[id]` | —                              | `GET /sessions/:id` | Route: `:id`             |


## Further pages — add details as they are implemented/found.

## Legend


| Term                                                                                      | Meaning                                            |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `useGet` / `usePost` / ...                                                                | Wrapper from `@/lib/query.ts`                      |
| `queryClient.invalidateQueries(...)`                                                      | TanStack Query cache invalidation                  |
| `unwrapApiData[[ORCA_RICH_MD:e6315e501308054d8ef6d04fe18d6685:inline-html:%3CT%3E]](raw)` | Strips `{ data: T }` envelope (`@/lib/api-unwrap`) |
| `getErrorMessage(err)`                                                                    | Safe error display (`@/lib/api-error`)             |
| `params`                                                                                  | Next.js route params (`Promise` in Next.js 16)     |
| Query string                                                                              | `opts.params` in `useGet`                          |


