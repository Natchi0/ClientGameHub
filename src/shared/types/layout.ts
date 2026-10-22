/**
 * Contrato de layouts de la aplicación.
 *
 * Cada layout envuelve el contenido de la ruta y centraliza la navegación y el chrome general.
 * Para sumar uno nuevo (por ejemplo, uno de administración o con sidebar) hay que:
 * 1. crear el componente en `src/app/layouts/`,
 * 2. registrarlo en `src/app/layouts/index.ts`,
 * 3. agregarlo acá y referenciarlo desde `meta.layout` en la ruta.
 */
export type LayoutName = 'default' | 'auth'

export const DEFAULT_LAYOUT_NAME: LayoutName = 'default'

export function isLayoutName(value: unknown): value is LayoutName {
  return value === 'default' || value === 'auth'
}
