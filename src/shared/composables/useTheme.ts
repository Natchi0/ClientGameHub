import { computed, ref, watch } from 'vue'
import { appConfig } from '@/shared/config'

export type ThemeMode = 'light' | 'dark' | 'system'

function load(): ThemeMode {
  try {
    const v = localStorage.getItem(appConfig.storage.theme)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage bloqueado */
  }
  return 'system'
}

const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => (systemDark.value = e.matches))

const mode = ref<ThemeMode>(load())
const isDark = computed(
  () => mode.value === 'dark' || (mode.value === 'system' && systemDark.value),
)

watch(
  [mode, isDark],
  () => {
    document.documentElement.classList.toggle('dark', isDark.value)
    try {
      localStorage.setItem(appConfig.storage.theme, mode.value)
    } catch {
      /* ignorar */
    }
  },
  { immediate: true },
)

export function useTheme() {
  return {
    mode,
    isDark,
    setMode: (m: ThemeMode) => (mode.value = m),
    toggle: () => (mode.value = isDark.value ? 'light' : 'dark'),
  }
}
