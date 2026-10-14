import { useLocalStorage } from '@vueuse/core'
import { appConfig } from '@/shared/config'

export const accessToken = useLocalStorage<string | null>(appConfig.storage.token, null, {
  serializer: { read: (v) => v, write: (v) => v ?? '' },
})
