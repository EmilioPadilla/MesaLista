# Frontend Architecture

> **Audience:** Humans onboarding to the web app, and LLMs replicating this app into mobile (Expo / React Native) or refactoring it.
>
> **Read this first.** Every refactor PR and every new feature should match the shape described here. If something in the codebase doesn't match yet, it's legacy waiting to be migrated — not a counter-example to follow.

---

## 1. Mental model in one paragraph

The app is a **single React 19 + Vite SPA** that talks to a co-located Express backend over a REST API. Code is organized in two axes: **vertical slices** (features — what the user sees) and **horizontal layers** (services, hooks, types — the platform-neutral spine). Features own UI; the spine owns "how we talk to the backend and reason about its data." The spine is **portable**; the features are **web-only**. A mobile (RN) port reuses the spine and rewrites the features.

---

## 2. Layering

```
┌──────────────────────────────────────────────────────────────────────┐
│  src/app/             Shell: routes, layouts, providers, navigation  │  web-only
├──────────────────────────────────────────────────────────────────────┤
│  src/features/<name>/ Vertical slices: pages + UI + feature-hooks    │  web-only
├──────────────────────────────────────────────────────────────────────┤
│  src/components/      Reusable UI                                     │  web-only
│    ├─ core/           Design-system primitives (Button, Input, …)    │
│    └─ shared/         Cross-feature composites (rare; prove it)      │
├──────────────────────────────────────────────────────────────────────┤
│  src/hooks/           Global domain hooks (one per domain)           │  PORTABLE
│  src/services/        REST clients (one per domain) + client.ts      │  PORTABLE*
│  src/utils/           Pure, framework-free helpers                   │  PORTABLE
│  src/contexts/        Cross-cutting React context (auth, notif, …)   │  web-only
│  types/               Shared types (api requests / domain models)    │  PORTABLE
└──────────────────────────────────────────────────────────────────────┘
```

\* `services/` is portable in **shape** — for mobile, only `client.ts` is rewritten (axios → a fetch wrapper that uses RN secure storage instead of cookies). Every other service file lifts as-is.

**Allowed import direction is downward only.**

```
app → features → components → hooks → services → types
                                  ↘  utils ↗
```

- `services/` MAY import from `types/`, `utils/`.
- `hooks/` MAY import from `services/`, `types/`, `utils/`.
- `components/core/` MAY NOT import from `features/`, `hooks/`, `services/`. It is the design system.
- `features/` MAY import from anything below it.
- Nothing imports from `app/`.

---

## 3. Canonical feature shape

**Every feature looks exactly like this.** No exceptions without a written reason in the feature's `README.md`.

```
src/features/<featureName>/
├── pages/                  # Route-level screens. One file per route.
│   ├── <PageName>.tsx
│   └── <PageName>.test.tsx    # Tests colocate next to source.
├── components/             # Feature-local UI. Not reusable outside the feature.
│   ├── <Component>.tsx
│   └── <Component>.test.tsx   # Tests colocate next to source.
├── hooks/                  # Feature-local hooks. Compose global hooks (src/hooks/*).
│   ├── use<Thing>.ts
│   └── use<Thing>.test.ts     # Tests colocate next to source.
├── utils/                  # Pure helpers, no React.
│   ├── <helper>.ts
│   └── <helper>.test.ts       # Tests colocate next to source.
├── types.ts                # Feature-local types. (Domain types stay in /types.)
└── index.ts                # PUBLIC API. The only file external code may import from.
```

**Tests live next to the code they test, and import siblings directly** (`./Component`), not through the barrel. The barrel is for *external* consumers; tests are internal.

**Rules:**
- If a feature has no `pages/`, the feature is not user-facing on its own — it's a sub-feature consumed by another feature's pages. Document why in its `index.ts`.
- If a feature only has one or two files, you may inline them (skip the sub-folders) **but `index.ts` is still required**.
- `index.ts` re-exports only what's intentionally public. Components/hooks/utils that aren't in `index.ts` are private.
- **Forbidden cross-feature imports of internals.** `features/A/...` may not import `features/B/components/X.tsx`. It may only import `features/B` (resolved via `B/index.ts`).

### Example: how a feature *should* look

```ts
// src/features/giftLists/index.ts
export { GiftListsPage } from './pages/GiftListsPage';
export { GiftListCard } from './components/GiftListCard';
// Internal: InvitationButton, hooks, utils — NOT re-exported.
```

```ts
// src/features/giftLists/hooks/useReorderGiftsOptimistic.ts
// Feature-local hook composing the global useReorderGifts mutation
// with feature-specific UI state (drag preview, toast).
```

---

## 4. The horizontal spine (the portable parts)

These four directories define the **contract with the backend**. They are platform-neutral and form the basis of the future mobile app.

### 4.1 `types/` — the wire and domain shapes

- `types/api/<domain>.ts` — request/response DTOs (e.g. `CreateGiftListRequest`).
- `types/models/<domain>.ts` — domain models as returned by the backend (e.g. `GiftListWithGifts`).
- `types/index.ts` — barrel; common cross-cutting types (`errors.ts`, `clauses.ts`).

**Rule:** Types here may not import from anywhere except other `types/` files. No React, no axios, no antd.

### 4.2 `src/services/` — REST clients, one per domain

```
services/
├── client.ts              # The single HTTP client (axios + interceptors).
├── endpoints.ts           # All URL builders. TODO: shard per-domain (Phase 4).
└── <domain>.service.ts    # CRUD functions for one domain. Stateless object literal.
```

**Conventions** (every service file looks like [src/services/giftList.service.ts](src/services/giftList.service.ts)):
- Export a single `const <domain>Service = { … }` object with named methods.
- Methods return `Promise<DomainModel>` — never the raw `AxiosResponse`. Always `return response.data`.
- All URLs come from `endpoints.ts`. Never inline a URL string.
- Public endpoints (no auth) pass `{ skipAuth: true } as CustomAxiosRequestConfig`.
- **No React, no hooks, no global state.** A service file is fully testable in Node.

### 4.3 `src/hooks/` — one hook file per domain, mirroring services 1:1

```
hooks/
├── queryKeys.ts           # All React Query keys. Single source of truth.
├── use<Domain>.ts         # Hooks for one domain. Mirrors <domain>.service.ts.
└── …
```

**Conventions** (see [src/hooks/useGiftList.ts](src/hooks/useGiftList.ts)):
- One file per service. Filename `useDomain.ts`, exports multiple named hooks: `useThing`, `useThingById`, `useCreateThing`, `useUpdateThing`, `useDeleteThing`.
- Queries: `useQuery({ queryKey: [queryKeys.x, …deps], queryFn: () => service.method(…), enabled: !!requiredDep })`.
- Mutations: `useMutation({ mutationFn: service.method, onSuccess: invalidate relevant keys })`.
- All `queryKey` strings live in `queryKeys.ts`. Never inline a string.
- **Forbidden:** importing antd, react-router, or any web-only API in this layer. These hooks must run unchanged on React Native.

### 4.4 `src/utils/` — framework-free helpers

Date formatting, currency parsing, slug generation, etc. If a util uses `window`, `document`, `localStorage`, or DOM types, it does not belong here — it belongs in the feature using it.

---

## 5. The web-only shell

### 5.1 `src/app/`

```
app/
├── App.tsx                  # Root: providers, router, theme. (Currently src/App.tsx — move in Phase 2.)
├── providers/               # All context providers composed here.
├── routes/                  # Route definitions only.
│   ├── index.tsx            # The <Routes> tree.
│   └── layouts/             # <PublicLayout>, <DashboardLayout>, etc.
└── modules/
    └── navigation/          # TopNav, Footer, sidebar.
```

**Rule:** A `routes/` file imports a page from its feature (`features/<x>/index.ts → <X>Page`) and wraps it in a layout. It contains **no business logic**.

Today's [src/App.tsx](src/App.tsx) inlines `<TopNav /><TopNavWrapper>{page}</TopNavWrapper>` repeatedly per route. That becomes one `<PublicLayout>` element used as a layout route.

### 5.2 `src/components/`

```
components/
├── core/        Design-system primitives. Button, Input, Dialog, Select, Checkbox, …
└── shared/      Cross-feature composites — VERY rare. If only one feature uses it,
                 it belongs in that feature.
```

Today's `components/shared/GiftCard.tsx` and `GiftsList.tsx` are gift-domain code mis-shelved here. Phase 4 moves them into the relevant feature.

### 5.3 `src/contexts/`

App-wide React context (auth user, notifications, theme). One file per context, each exporting the provider and a `use<Name>()` hook.

---

## 6. Naming, paths, and imports

| Thing | Convention | Example |
|---|---|---|
| Component file | `PascalCase.tsx` | `GiftListCard.tsx` |
| Hook file | `useThing.ts` | `useGiftList.ts` |
| Service file | `<domain>.service.ts` | `giftList.service.ts` |
| Util file | `camelCase.ts` | `purchasedGiftsExport.ts` |
| Page file | `<Name>Page.tsx` (in `pages/`) | `GiftListsPage.tsx` |
| Folder | `camelCase` for features, `kebab` never | `manageRegistry/` |
| Test file | `<file>.test.ts(x)` colocated next to source | `useGiftList.test.ts` |

### Import-path rules

**Use one alias style per kind:**
- `src/...` for everything in `src/` → `import { X } from 'src/features/giftLists'`
- `types/...` for everything in `types/` → `import type { Gift } from 'types/models/gift'`
- **No relative paths that cross a layer.** `../../../components/core/Button` is banned; use `src/components/core/Button`. Relative paths are only OK *within a single folder* (`./SubComponent`).
- **No bare aliases** (`routes/Login`, `components/ProtectedRoute`). Today's [src/App.tsx](src/App.tsx) mixes three alias styles in one file — pick `src/...` and stick to it.

---

## 7. The platform-neutral boundary (mobile-LLM contract)

**This is the single most important section for the future Expo replication.**

When the mobile LLM begins, it will:

1. **Lift unchanged**, byte-for-byte, into `mobile/`:
   - `types/` (whole tree)
   - `src/utils/` (everything that doesn't touch `window`/DOM — most of it)
   - `src/hooks/` (everything except hooks that import web-only modules)
   - `src/services/*.service.ts` (every per-domain service file)

2. **Rewrite once** with an RN-equivalent:
   - `src/services/client.ts` — swap axios for `fetch`; swap cookie auth for `expo-secure-store` token.
   - `src/contexts/` — same contract, RN-flavored providers.

3. **Rebuild per-platform** (the LLM uses the web feature as a *spec*, not a source):
   - `src/features/<name>/pages/` → `mobile/features/<name>/screens/`
   - `src/features/<name>/components/` → RN equivalents using `react-native` primitives or NativeWind
   - Feature `hooks/`, `utils/`, `types.ts` → **lift as-is** (they are platform-neutral by rule)
   - `src/app/` → fully replaced by RN navigation (`expo-router`)
   - `src/components/core/` → fully replaced by RN/NativeWind primitives with identical prop APIs

**Enforcement** (Phase 2+):
- ESLint rule `no-restricted-imports` in `src/hooks/`, `src/services/`, `src/utils/`, and feature `hooks/`+`utils/`+`types.ts` to ban: `react-router-dom`, `antd`, `@ant-design/*`, `window`, `document`, `localStorage`.
- Anything in those folders that *currently* imports web-only modules either (a) gets refactored or (b) gets moved into the feature's `components/` (web-only) with a comment.

**Conceptual map for the mobile LLM:**

| Web concept | Mobile concept | Strategy |
|---|---|---|
| `BrowserRouter` + `<Routes>` | `expo-router` file-based routes | Rewrite; same URLs become same screen paths |
| antd `<Modal>` | RN `<Modal>` or bottom sheet | Per-component rewrite, same props |
| `components/core/Button` | RN `Pressable` + NativeWind | Same prop API |
| `useGiftListsByUser` | (unchanged) | Lift |
| `giftListService.createGiftList` | (unchanged) | Lift |
| `types/models/giftList` | (unchanged) | Lift |
| Cookie-based auth | Secure token in header | Rewrite `client.ts` only |

---

## 8. Concrete fixes the current code needs (target end state)

The doc above is the **target**. Here's the gap between target and reality, in priority order:

### High priority — blocks LLM replicability

1. **Make `src/features/rsvp/` match the canonical shape.**
   Today: nine sibling sub-folders, one per modal (`AddInviteeModal/AddInviteeModal.tsx`). Target: `rsvp/components/{AddInviteeModal,BulkDeleteModal,…}.tsx`, plus `pages/ManageRsvpPage.tsx`.

2. **Add `index.ts` to every feature** as the public API barrel. Lint-fence: outside code may only import from `features/<x>` (the folder), not `features/<x>/components/...`.

3. **Standardize feature internal layout.**
   - `buyRegistry/`, `manageRegistry/` → already close; add `pages/` and `index.ts`.
   - `giftLists/` → flat → add `components/`, `index.ts`.
   - `invitations/`, `predesignedLists/`, `settings/`, `admin/*` → audit each.

4. **Pick one alias style.** Today [src/App.tsx](src/App.tsx) imports as `routes/Login`, `components/ProtectedRoute`, `src/app/routes/...`, and `./app/routes/...` — all in one file. Standardize on `src/...` and update `tsconfig.json` paths.

### Medium priority — improves maintainability

5. **Shard [src/services/endpoints.ts](src/services/endpoints.ts) (981 lines)** into per-domain files colocated with each service:
   `services/giftList.endpoints.ts`, `services/payment.endpoints.ts`, etc. Re-export from a slim `endpoints.ts` if needed for back-compat during migration.

6. **Move domain code out of `components/shared/`.**
   `GiftCard.tsx`, `GiftsList.tsx` → into the right feature (likely `buyRegistry` or `giftLists`).
   Keep `shared/` empty by default. Adding to it requires justification.

7. **Extract layouts from `App.tsx`.**
   `<TopNav /><TopNavWrapper>{children}</TopNavWrapper>` is repeated ~10 times. Replace with a `<PublicLayout>` layout route.

### Low priority — defer until mobile work starts

8. **Promote the portable spine to a workspace package** (`packages/shared`) consumed by both web and the future Expo app. Do this only when the RN skeleton exists — premature monorepo tooling is more pain than payoff.

---

## 9. How to add a new feature (the recipe)

1. `mkdir src/features/<name>/{pages,components,hooks,utils}`
2. Add `src/features/<name>/index.ts` (start empty; export as needed).
3. If the feature has a new backend domain:
   - Add types in `types/api/<name>.ts` and `types/models/<name>.ts`.
   - Add `src/services/<name>.service.ts` and `<name>.endpoints.ts`.
   - Add `src/hooks/use<Name>.ts` mirroring the service 1:1.
   - Add the relevant key strings to `src/hooks/queryKeys.ts`.
4. Build the feature's UI in `pages/` + `components/`, composing the global hooks.
5. Add the page to `src/app/routes/index.tsx` wrapped in the appropriate layout.
6. Re-export the page (and any components other features need) from `features/<name>/index.ts`.

## 10. Definition of done for a refactor PR (Phases 2+)

- [ ] No behavior change (eyeball + existing tests pass).
- [ ] Feature matches Section 3 canonical shape.
- [ ] `index.ts` exists and re-exports only what's intentionally public.
- [ ] No web-only imports (`antd`, `react-router`, `window`) inside `hooks/`, `utils/`, `types.ts`.
- [ ] All imports use `src/...` or `types/...` alias (no `../../../`).
- [ ] All API URLs come from an `endpoints` file (none inlined).
- [ ] All React Query keys come from `queryKeys.ts` (none inlined).
- [ ] No new files in `components/shared/` without explicit justification.
