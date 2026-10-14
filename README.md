# ClientGameHub

This template should help get you started developing with Vue 3 in Vite.

https://vueschool.io/articles/vuejs-tutorials/how-to-structure-a-large-scale-vue-js-application/

```
src/
├── app/                  # app-level wiring only
│   ├── router/           # root router; imports each feature's routes
│   ├── plugins/          # pinia, i18n, third-party setup
│   └── App.vue
├── shared/               # cross-feature and domain-agnostic
│   ├── ui/               # BaseButton.vue, BaseModal.vue (the design system)
│   ├── composables/      # useBreakpoint, useClipboard
│   ├── lib/              # http client, date/format helpers
│   └── types/
├── features/             # the heart of the app: one folder per domain
│   ├── auth/
│   │   ├── components/    # LoginForm.vue and other auth-only components
│   │   ├── composables/   # useAuth
│   │   ├── stores/        # auth store (Pinia)
│   │   ├── api/           # auth requests
│   │   ├── pages/         # LoginPage.vue and other route-level views
│   │   ├── routes.ts      # this feature's routes, merged in app/router
│   │   └── types.ts
│   ├── billing/          # same shape as auth/
│   └── dashboard/        # same shape as auth/
├── assets/
└── main.ts
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
