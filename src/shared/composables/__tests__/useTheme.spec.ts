import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

async function loadTheme() {
  vi.resetModules()
  const mod = await import('@/shared/composables/useTheme')
  return mod.useTheme()
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  it('arranca con la paleta verde y el modo del sistema', async () => {
    const { palette, mode } = await loadTheme()

    expect(palette.value).toBe('green')
    expect(mode.value).toBe('system')
    expect(document.documentElement.getAttribute('data-theme')).toBe('green')
  })

  it('guarda la paleta seleccionada y la aplica en el documento', async () => {
    const { setPalette } = await loadTheme()

    setPalette('violet')
    await nextTick()

    expect(localStorage.getItem('theme_palette')).toBe('violet')
    expect(document.documentElement.getAttribute('data-theme')).toBe('violet')
  })

  it('guarda el modo y activa la clase dark', async () => {
    const { setMode } = await loadTheme()

    setMode('dark')
    await nextTick()

    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restaura la paleta y el modo guardados', async () => {
    localStorage.setItem('theme_palette', 'blue')
    localStorage.setItem('theme', 'dark')

    const { palette, mode } = await loadTheme()

    expect(palette.value).toBe('blue')
    expect(mode.value).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('blue')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('ignora valores guardados que no son paletas válidas', async () => {
    localStorage.setItem('theme_palette', 'fucsia')

    const { palette } = await loadTheme()

    expect(palette.value).toBe('green')
  })
})
