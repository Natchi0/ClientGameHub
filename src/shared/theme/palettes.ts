export type ThemePalette = 'green' | 'blue' | 'orange' | 'violet'

export interface ThemePaletteMeta {
  value: ThemePalette
  label: string
  /** Colores representativos para la vista previa (fondo, superficie, primario, acento). */
  swatch: [string, string, string, string]
}

export const THEME_PALETTES: readonly ThemePaletteMeta[] = [
  {
    value: 'green',
    label: 'Verde',
    swatch: ['#f3f5f1', '#e9eee7', '#0c6d55', '#d9f4b3'],
  },
  {
    value: 'blue',
    label: 'Celeste/Azul',
    swatch: ['#f4f7fb', '#e8eff9', '#2563eb', '#bfdbfe'],
  },
  {
    value: 'orange',
    label: 'Amarillo/Naranja',
    swatch: ['#f9f7f2', '#f5efe6', '#d97706', '#fed7aa'],
  },
  {
    value: 'violet',
    label: 'Violeta',
    swatch: ['#f7f6fb', '#f0edfa', '#7c3aed', '#ddd6fe'],
  },
]

export const DEFAULT_THEME_PALETTE: ThemePalette = 'green'

export function isThemePalette(value: unknown): value is ThemePalette {
  return THEME_PALETTES.some((p) => p.value === value)
}
