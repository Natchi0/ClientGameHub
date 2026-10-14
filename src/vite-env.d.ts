/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TIMEOUT_MS?: string
  readonly VITE_DEFAULT_LOCALE?: string
  readonly VITE_DEBUG?: string
  readonly VITE_AUTH_TOKEN_REFRESH_MARGIN?: string
}
