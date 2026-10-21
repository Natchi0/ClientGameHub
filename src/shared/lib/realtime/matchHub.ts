import { appConfig } from '@/shared/config'
import { accessToken } from '@/shared/lib/tokenStorage'
import { MatchHubClient } from './matchHubClient'
import type { JsonValue } from './signalRConnection'

/** Crea una conexión de partida autenticada con el token vigente de la sesión. */
export function createMatchHubClient<TState extends JsonValue = JsonValue>(matchId: number) {
  return new MatchHubClient<TState>({
    hubUrl: appConfig.realtime.matchHubUrl,
    matchId,
    accessTokenFactory: () => accessToken.value ?? '',
  })
}
