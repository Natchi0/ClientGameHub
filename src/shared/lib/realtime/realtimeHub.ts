
import { appConfig } from '@/shared/config'
import { accessToken } from '@/shared/lib/tokenStorage'
import { RealtimeHubClient } from './realtimeHubClient'

export function createRealtimeHubClient() {
  return new RealtimeHubClient({
    hubUrl: appConfig.realtime.realtimeHubUrl,
    // Se lee el token actual en cada conexión o reconexión.
    accessTokenFactory: () => accessToken.value ?? '',
  })
}
