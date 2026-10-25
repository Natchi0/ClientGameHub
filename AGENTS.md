# AGENTS.md — Repository Guide & Project Context

> For deeper product details see `PRODUCT.md` (product), `DESIGN.md` (visual system), `TODO.md` (backlog), and `docs/decisions/` (ADRs).

## 1. What This Project Is

**ClientGameHub** is the frontend ("GameHub"), a Vue 3 + TypeScript + Vite web client for an
online games platform. It lets people create an account (or join as a guest), browse a game
catalogue, create/join matches (manual matchmaking), and wait in a real-time match lobby.
In the future it will also host live gameplay and a quick matchmaking queue.

- **Backend**: an external .NET API (`http://localhost:5045/api` by default) with JWT + an HttpOnly
  refresh cookie (very long duration), plus SignalR for real time. It is found in (/home/nacho/dev/GameHub/src/GameHub.Api).
- **Product principles**: keep the next social/play action within reach; make game info scannable,
  not decorative; carry a quiet game-culture energy; treat responsive behavior and theme support as
  first-class product behavior; ship accessible UI (semantic controls, visible focus, contrast,
  reflowing layouts).

## 2. Stack

| Area      | Technology                                                                               |
| --------- | ---------------------------------------------------------------------------------------- |
| Framework | Vue 3.5 (Composition API, `<script setup>`), vue-router 5, Pinia 4                       |
| Language  | TypeScript 6 strict, no `any`/`unknown`                                                  |
| Build     | Vite 8, alias `@` → `src/`                                                               |
| Styles    | Tailwind CSS 4 (`@tailwindcss/vite`), tw-animate-css                                     |
| UI        | shadcn-vue (reka-ui + cva) in `src/shared/ui/components/*`                               |
| Data      | Axios (single client in `src/shared/lib/http.ts`), zod 4 schemas                         |
| Real time | `@microsoft/signalr`                                                                     |
| Misc      | @vueuse/core (e.g. `useLocalStorage`), lucide (icons), vue-sonner (toasts)               |
| Tests     | Vitest 4 (jsdom, colocated in `src/**/__tests__/*.spec.ts`), Playwright (`e2e/`)         |
| Tooling   | ESLint + oxlint (`npm run lint`), Prettier (`npm run format`), vue-tsc (`npm run build`) |

Node required: `^22.18.0 || >=24.12.0`.

## 3. Architecture

```
src/
├── app/                    # Application wiring only
│   ├── router/index.ts     # Root router: session/role guard, spreads each feature's routes
│   ├── layouts/            # DefaultLayout, AuthLayout; resolved from route.meta.layout
│   │   └── components/     # AppHeader (64px nav), ThemeMenu, UserChip, AuthActions
│   ├── plugins/zod.ts      # Zod setup
│   └── App.vue             # Shell: dynamic layout + Toaster + global RealtimeHub connection
├── shared/                 # Generic, domain-agnostic — must NOT import feature code
│   ├── config/             # appConfig: reads and validates VITE_* vars with fallbacks
│   ├── lib/
│   │   ├── http.ts         # Axios: base URL, timeout, Bearer token, 401 refresh with Web Locks
│   │   ├── tokenStorage.ts # accessToken: localStorage-backed ref synced across tabs
│   │   ├── jwt.ts          # decodeJwt (access-token claims)
│   │   ├── apiError.ts     # API error helpers
│   │   ├── avatarUrl.ts    # avatar URL resolution
│   │   ├── utils.ts        # cn() for conditional class names
│   │   └── realtime/       # ✦ see section 6: SignalRConnection + domain hub clients
│   ├── composables/        # useTheme, useZodForm, useRealtimeConnection
│   ├── theme/palettes.ts   # Palettes: green (default), blue, orange, violet × light/dark
│   ├── types/              # pagination (PagedResult), layout, router.d.ts (typed meta)
│   └── ui/                 # BaseInput, UserAvatar, HoverLabelLink + shadcn components
│                           #   (button, input, dialog, select, table, data-table, sonner)
├── features/               # One folder per domain — the heart of the app
│   ├── auth/               # Login, Register, Profile; authStore, roles, zod schemas
│   ├── games/              # Catalogue + detail; gamesApi, GamesPage, GameInfoPage
│   ├── matches/            # List/create/join/waiting room; matchesApi, useMatchLobby, dialogs
│   └── dashboard/          # Illustrative dashboard (sample data)
│                           # Each feature: api/, components/, composables/, stores/, pages/,
│                           #   routes.ts, types.ts / schemas.ts
├── assets/                 # logo.svg, main.css (Tailwind tokens/themes)
├── views/NotFoundPage.vue  # 404 (transversal, lives outside features)
└── main.ts                 # createApp + Pinia + router + zod + isRegistered watcher
```

**Structural rules:**

- Each feature defines `routes.ts`, spread into the root router. Route-level pages go in `pages/`,
  feature-only components in `components/`, HTTP calls in `api/`, state in `stores/`.
- `src/shared/` must stay generic: never import feature-specific code into it, and it must not know
  about concrete games or game states (ADR-001).
- Static assets belong in `src/assets/` or `public/`.
- Unit tests are colocated in `src/**/__tests__/`; browser journeys live in `e2e/`.

## 4. Routes & Navigation Guard

| Route                                          | Feature   | Meta                     |
| ---------------------------------------------- | --------- | ------------------------ |
| `/dashboard`                                   | dashboard | default layout           |
| `/login`, `/register`                          | auth      | `guestOnly`, auth layout |
| `/profile`                                     | auth      | default layout           |
| `/games`, `/games/:gameId(\\d+)`               | games     | default layout           |
| `/matches`, `/matches/:matchId(\\d+)`, `/join` | matches   | default layout           |
| `/*`                                           | 404 page  | —                        |

**`beforeEach` guard (`src/app/router/index.ts`):**

1. `await auth.ensureSession()` → refresh via the HttpOnly cookie or, on 401, create a guest
   (`POST /auth/anonymous`). Network errors do **not** create a guest.
2. `requiresAccount` → if the user has no registered account, redirect to Login with `redirect`.
3. `guestOnly` → send registered users home.
4. `requiredRole` → `auth.hasRole(role)`; roles are hierarchical Admin > Player > Guest
   (`src/features/auth/roles.ts`), evaluated against the JWT `roles` claim.

`afterEach` sets `document.title` from `meta.title`. In `main.ts`, a watcher on `auth.isRegistered`
redirects to Login if the session degrades while navigating (e.g. mid-match registration loss).

## 5. Authentication (Guest & Account Flow)

**The app always runs with a session.** A _guest_ is a real `User` without an `Account` (so no
email) and with the `Guest` role.

**User/Account domain model:**

- A `User` represents a single unique identity: it has a unique nickname, an avatar, and roles.
- An `Account` represents a registered user's credential (email + password) and can be linked to
  an existing `User` (e.g. a guest who registers later).
- A user has 0 or 1 `Account`, but an `Account` always belongs to exactly one `User`. The `User` is
  what everything in the system relates to; the `Account` is the authentication that lets the user
  log back in.
- A guest is a `User` without an `Account`. A guest can register, creating an `Account` linked to
  the same `User`, and thereby becomes a `Player`.
- The main Guest vs Player difference: a Player has an `Account`, so they can sign in from other
  devices and keep their progress; a Guest can only play during the current session, and guest
  accounts get deleted if access is lost or they stay inactive for too long.

- `authStore` (Pinia, setup-style) is the heart of auth:
  - `claims` = the decoded JWT of the access token (`isGuest`, `sub`, `roles`, `exp`).
  - `hasSession` / `isGuest` / `isRegistered` derive from claims, **not** from the raw token.
  - `user` = the `/auth/me` profile (`UserDto`: id, email|null, nickname, avatar, roles). A watcher
    invalidates it whenever `sub` changes (login, logout, another tab, session loss).
- **Tokens**: the access token lives in localStorage (a vueuse ref synced across tabs) + an HttpOnly
  refresh cookie. `http.ts` retries once after a 401 via `refreshSession()` (single in-flight
  promise per tab, Web Locks across tabs — the cookie rotates on every refresh). Login, refresh,
  anonymous, and logout endpoints are excluded from the retry.
- **Flows**: `login`/`register` swap the token and (re)load `/me`. Registering
  (`POST /auth/register`) links an `Account` to the **same** user, replaces `Guest` with `Player`,
  swaps the token, and refetches `/me`. `logout` clears the session and starts a fresh guest.
- Always read profile data from `auth.user` (`/auth/me`), never from the token (token holds only
  session claims).
- Use `requiresAccount` for account-only routes (guests are redirected to Login) and `guestOnly` to
  send registered users home.

## 6. Real Time (SignalR) — ADR-001

The backend exposes two hubs; URLs come from `appConfig.realtime` (defaults `/hubs/game` and
`/hubs/realtime`). `src/shared/lib/realtime/` splits concerns in two layers:

1. **Transport layer** — `SignalRConnection`: reusable wrapper that configures the current token
   (reactive factory), the connection lifecycle, automatic reconnection, and subscriptions
   (`on()` returns an unsubscribe function). Reconnection only covers established connections; an
   initial `connect()` failure propagates to the caller, which may show an error or allow a retry.
   SignalR may send the token as `access_token` in the query string over WebSockets (official
   client behavior).
2. **Domain clients** on top of it:
   - `RealtimeHubClient` (general): events `NotificationReceived`, `ConnectedUsersCountUpdated`;
     waiting-room groups via `JoinMatchGroup(matchId)` / `LeaveMatchGroup`. The global connection
     is managed by `useRealtimeConnection()` in `App.vue` (reconnects whenever the identity `sub`
     changes; exposes the `realtimeClient` ref and `connectedUsersCount`). Components subscribe via
     `realtimeClient` and remove subscriptions on unmount.
   - `MatchHubClient<TState>` (`createMatchHubClient(matchId)`): one connection **per match**
     (`?matchId=` in the connection URL; it authenticates the participant). Commands go through
     `sendAction(actionType, payload)`; updates arrive on `StateUpdated`, rejections on
     `ActionRejected`, and end-of-match on `MatchEnded`. Consumers MUST keep the unsubscribe
     closers and call `disconnect()` when leaving the match. Each game types its own state when
     consuming — `shared` must never model concrete game states.
   - `useMatchLobby` (matches feature): joins the waiting room to the match's group on RealtimeHub
     only when the user is already a participant (the hub aborts the connection otherwise);
     listens to `MatchUpdated`, `MatchStarted`, `MatchCanceled`, and keeps working with the reload
     button if the subscription fails.

### Alternatives (rejected, from ADR-001)

- Using `HubConnection` directly in each component: duplicates URL/token/lifecycle handling and
  allows arbitrary method names that don't reflect the backend contract.
- A global singleton for all matches: one connection carries one `matchId`; reusing it across
  routes leaves stale subscriptions or match context.
- Modelling each game's state in the shared layer: `shared` must not know concrete games; the
  `StateUpdated` payload is generic and each feature types it on consumption.

## 7. Backend Contract (Key Points)

- **Enums are serialized as numbers** (System.Text.Json default): mirror them in each feature as
  typed `const` maps (e.g. `MatchStatus { Pending: 0, ... }`). Never send strings by mistake.
- **REST via axios, baseURL `VITE_API_BASE_URL`**:
  - Auth: `POST /auth/login`, `/auth/register`, `/auth/anonymous`, `/auth/refresh`, `/auth/logout`,
    `GET /auth/me`, update nickname, upload avatar.
  - Games: `GET /games` (paginated; the catalogue is small → `pageSize: 100`), `GET /games/:id`.
    `GameDto` includes optional configurations (types Boolean/Integer/String/Select with options).
  - Matches: `GET /matches` (query: gameId, status, visibility, participantUserId, date range,
    search, page/sort), `POST /matches/custom`, `POST /matches/:id/join`,
    `POST /matches/join-by-code/:code`, `DELETE /matches/:id/leave`, `GET /matches/:id`.
    `MatchDto`: status (Pending/Started/Finished/Canceled), visibility
    (Public/Private/FriendsOnly), `joinCode` only reaches participants and admins, `ownerId` is the
    participant id (not the userId), participants carry `seat` and `type` (Player/Spectator).
    Private matches require a password to join.
- Pagination follows `PagedResult` (`src/shared/types/pagination.ts`).
- Do not rely exclusively on frontend validations — permissions and rules hold in the backend
  (e.g. the `JoinCode` is not exposed to non-participants; private matches ask for a password).

## 8. Environment Configuration

`.env` (see `.env.example`), read and validated in `src/shared/config/index.ts`:

```
VITE_API_BASE_URL=http://localhost:5045/api   # base for HTTP and hub URLs
VITE_MATCH_HUB_URL=/hubs/game                 # relative to the API base
VITE_REALTIME_HUB_URL=/hubs/realtime
VITE_AUTH_TOKEN_REFRESH_MARGIN=30000          # ms before expiry to force a refresh
VITE_API_TIMEOUT_MS=15000
VITE_APP_NAME=GameHub / VITE_APP_DESCRIPTION
VITE_DEFAULT_LOCALE=es                        # 'es' | 'en'
VITE_DEBUG=false
```

## 9. Design System (Summary of DESIGN.md)

- **Look**: a compact, contemporary game room; an operational product UI — neither a game-launcher
  fantasy nor a generic SaaS dashboard. Avoid gradients, uniform tile grids, decorative glass, and
  fake game-console UI.
- **Typography**: Red Hat Display (headings) + DM Sans (reading/controls). **Palette**: moss green
  - near-black; lime = high-attention action/online signal; coral = social/caution states.
    Four user-selectable palettes × light/dark (`useTheme` + `shared/theme/palettes.ts`), exposed as
    color swatches. Light mode is a soft warm white, not a washed-out dark mode.
- **Layout**: a 64px top navigation persists across product routes and collapses to a menu on small
  screens; every route is wrapped by the layout resolved from `meta.layout` (`src/app/layouts`) —
  the header/chrome lives there so pages never do. Content width capped at `max-w-7xl`; compact
  12px corners; responsive padding 16px/24px. Dashboard flow: next-play context → catalogue →
  community/friends. Forms use a split composition on wide screens and collapse on mobile.
- **Components**: prefer installed shadcn-vue components (`Button`, `Input`, `Dialog`, `Select`,
  `Table`, `DataTable`, `Sonner`) and semantic token variants before adding local styles. Lucide
  icons only where they add meaning; icon-only controls need an accessible label. Forms pair
  visible labels with inputs, validation text, and `aria-invalid` (use `useZodForm` with each
  feature's zod schemas). Toasts via vue-sonner (`Toaster` in App.vue). Use `cn()` for conditional
  classes; no inline styles.
- **Accessibility is first-class**: preserve every action at mobile widths, visible focus rings,
  semantic headings/buttons/links, and contrast-aware tokens in both themes. Theme switching
  (palette + light/dark behind one appearance button) stays visible and is persisted.

## 10. Build, Test, and Development Commands

- `npm install` installs dependencies (Node `^22.18.0` or `>=24.12.0`).
- `npm run dev` starts the Vite development server.
- `npm run build` type-checks with `vue-tsc` and creates the production bundle.
- `npm run test:unit` runs Vitest in the jsdom environment.
- `npm run test:e2e` runs Playwright against its managed local server; run `npx playwright install`
  once for browser binaries.
- `npm run lint` runs ESLint and oxlint with automatic fixes. `npm run format` formats `src/` with
  Prettier.

## 11. Coding Style & Naming Conventions

- Prettier: two-space indentation, **no semicolons**, single quotes, 100-character lines, trailing
  commas.
- Use TypeScript in Vue SFCs. `const` for all variables unless reassignment is required; use `let`
  only when necessary and never `var`. Use `===`/`!==`. Prefer `for...of` over traditional loops.
  Use `async/await` instead of `.then()` for promises.
- No `any` or `unknown`: prefer explicit types or generics. Prefix intentionally unused variables
  or parameters with `_`.
- Vue components in PascalCase (`BaseInput.vue`, `LoginPage.vue`), composables with a `use` prefix
  (`useTheme.ts`, `useMatchLobby.ts`), feature folders in lowercase.
- Comments must be purposeful and concise; avoid redundant or obvious comments — explain the
  "why". Use JSDoc for public APIs and `@internal` for private APIs.
- Keep shared UI generic; never import feature-specific code into `src/shared/`.
- The app uses shadcn components and Tailwind CSS. Before creating a new component from scratch,
  check if a suitable one can be installed with `npx shadcn-vue add <component>` (or use the
  shadcn-vue skill).

## 12. Testing Guidelines

- **Unit** (`npm run test:unit`): Vitest + jsdom + Vue Test Utils, colocated as
  `src/<area>/__tests__/<name>.spec.ts`. Current coverage covers each feature's pages, match
  dialogs, `useMatchLobby`, zod schemas, `useTheme`, `DataTable`, `matchHubClient`, `avatarUrl`,
  and layouts.
- **E2E** (`npm run test:e2e`): Playwright against its local server (`playwright.config.ts`);
  requires `npx playwright install` once and a prior `npm run build` on CI. Note: a full visual
  journey is still pending because the environment's Chromium lacked `libnspr4`/`libnss3`.
- Write focused specs using Vue Test Utils when rendering components. Add Playwright coverage in
  `e2e/<journey>.spec.ts` for critical user flows.
- Run the relevant test suite before opening a PR; no coverage threshold is currently configured.

## 13. Where to Look First (Mental Map)

- Session/auth: `src/features/auth/stores/authStore.ts` ← the heart; guard in
  `src/app/router/index.ts`.
- HTTP/refresh: `src/shared/lib/http.ts`; cross-tab token: `shared/lib/tokenStorage.ts`.
- Config: `src/shared/config/index.ts`.
- Real time: `src/shared/lib/realtime/` (+ ADR in `docs/decisions/001-signalr-realtime-client.md`);
  global connection in `src/shared/composables/useRealtimeConnection.ts`; waiting room in
  `src/features/matches/composables/useMatchLobby.ts`.
- Data contracts: `src/features/{games,matches}/types.ts` and `*/api/*Api.ts`.
