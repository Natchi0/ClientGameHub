# Repository Guidelines

## Project Structure & Module Organization

This is a Vue 3, TypeScript, and Vite client. Keep application wiring in `src/app/`: the root router lives in `src/app/router/`, plugins in `src/app/plugins/`, and `App.vue` is the shell. Organize domain work under `src/features/<feature>/` (for example, `auth/`) using `api/`, `components/`, `pages/`, `stores/`, `routes.ts`, and types or schemas as needed. Put reusable, domain-agnostic code in `src/shared/` (`ui/`, `composables/`, `lib/`, and `types/`). Static assets belong in `src/assets/` or `public/`.

Unit tests are colocated in `src/**/__tests__/`; browser journeys live in `e2e/`.

## Build, Test, and Development Commands

- `npm install` installs dependencies (Node `^22.18.0` or `>=24.12.0`).
- `npm run dev` starts the Vite development server.
- `npm run build` type-checks with `vue-tsc` and creates the production bundle.
- `npm run test:unit` runs Vitest in the jsdom environment.
- `npm run test:e2e` runs Playwright against its managed local server; run `npx playwright install` once for browser binaries.
- `npm run lint` runs ESLint and oxlint with automatic fixes. `npm run format` formats `src/` with Prettier.

## Coding Style & Naming Conventions

Use TypeScript in Vue SFCs and follow Prettier: two-space indentation, no semicolons, single quotes, 100-character lines, and trailing commas. Name Vue components in PascalCase (`BaseInput.vue`, `LoginPage.vue`), composables with a `use` prefix (`useTheme.ts`), and feature folders in lowercase. Keep shared UI generic; do not import feature-specific code into `src/shared/`. Prefix intentionally unused variables or parameters with `_`.
Comments must be purposeful and concise; avoid redundant or obvious comments. Use JSDoc for public APIs, and add `@internal` to private APIs. Avoid `any` and `unknown` types; prefer explicit types or generics. Use `const` for all variables unless reassignment is required. Use `let` only when necessary, and avoid `var`. Use `===` and `!==` for comparisons, and prefer `for...of` over traditional loops. Use `async/await` instead of `.then()` for promises.

## Testing Guidelines

Write focused Vitest specs as `src/<area>/__tests__/<name>.spec.ts`, using Vue Test Utils when rendering components. Add Playwright coverage in `e2e/<journey>.spec.ts` for critical user flows. Run the relevant test suite before opening a PR; no coverage threshold is currently configured.

## Commit & Pull Request Guidelines

Recent history uses short, imperative-style summaries, including Spanish descriptions (for example, `mejorar auth`). Keep commits narrow and descriptive. PRs should explain the change and validation performed, link the relevant issue when available, and include screenshots or recordings for visible UI changes. Call out configuration or API-contract changes explicitly.
