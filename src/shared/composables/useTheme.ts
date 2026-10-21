import { computed, ref, watch } from 'vue'
import { appConfig } from '@/shared/config'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemePalette = 'green' | 'blue' | 'orange' | 'violet'

function loadMode(): ThemeMode {
  try {
    const v = localStorage.getItem(appConfig.storage.theme)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage bloqueado */
  }
  return 'system'
}

function loadPalette(): ThemePalette {
  try {
    const v = localStorage.getItem(appConfig.storage.themePalette)
    if (v === 'green' || v === 'blue' || v === 'orange' || v === 'violet') return v
  } catch {
    /* storage bloqueado */
  }
  return 'green'
}

const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => (systemDark.value = e.matches))

const mode = ref<ThemeMode>(loadMode())
const palette = ref<ThemePalette>(loadPalette())
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

watch(
  palette,
  (p) => {
    const el = document.documentElement
    if (p === 'green') {
      el.removeAttribute('data-theme')
    } else {
      el.setAttribute('data-theme', p)
    }
    try {
      localStorage.setItem(appConfig.storage.themePalette, p)
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
    palette,
    setMode: (m: ThemeMode) => (mode.value = m),
    setPalette: (p: ThemePalette) => (palette.value = p),
    toggle: () => (mode.value = isDark.value ? 'light' : 'dark'),
  }
}
