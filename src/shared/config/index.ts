const clean = (v: string | undefined) => (v?.trim() ? v.trim() : undefined) // "" cuenta como ausente

const str = (v: string | undefined, fallback: string) => clean(v) ?? fallback

const num = (v: string | undefined, fallback: number) => {
  const n = Number(clean(v))
  return clean(v) !== undefined && Number.isFinite(n) ? n : fallback
}

const bool = (v: string | undefined, fallback: boolean) => {
  const s = clean(v)?.toLowerCase()
  return s === 'true' || s === '1' ? true : s === 'false' || s === '0' ? false : fallback
}

function oneOf<T extends string>(v: string | undefined, allowed: readonly T[], fallback: T): T {
  const s = clean(v)
  return allowed.includes(s as T) ? (s as T) : fallback
}

const env = import.meta.env
const apiBaseUrl = str(env.VITE_API_BASE_URL, 'http://localhost:5045/api')

export const appConfig = {
  app: {
    name: str(env.VITE_APP_NAME, 'GameHub'),
    description: str(env.VITE_APP_DESCRIPTION, 'Plataforma de juegos online'),
  },
  api: {
    baseUrl: apiBaseUrl,
    timeoutMs: num(env.VITE_API_TIMEOUT_MS, 15000),
  },
  realtime: {
    matchHubUrl: str(
      new URL(env.VITE_MATCH_HUB_URL, apiBaseUrl).toString(),
      new URL('/hubs/game', apiBaseUrl).toString(),
    ),
    realtimeHubUrl: str(
      new URL(env.VITE_REALTIME_HUB_URL, apiBaseUrl).toString(),
      new URL('/hubs/realtime', apiBaseUrl).toString(),
    ),
  },
  auth: {
    tokenRefreshMargin: num(env.VITE_AUTH_TOKEN_REFRESH_MARGIN, 30000),
  },
  i18n: {
    defaultLocale: oneOf(env.VITE_DEFAULT_LOCALE, ['es', 'en'] as const, 'es'),
  },
  features: {
    debug: bool(env.VITE_DEBUG, false),
  },
  storage: {
    // constantes fijas, no vienen de .env
    token: 'auth_token',
    theme: 'theme',
  },
} as const
