import { useLocalStorage } from '@vueuse/core'
import { appConfig } from '@/shared/config'

// ref de vueUse persiste y sincroniza entre pestañas
export const accessToken = useLocalStorage<string | null>(appConfig.storage.token, null, {
  serializer: { read: (v) => v, write: (v) => v ?? '' },
  flush: 'sync',
})
