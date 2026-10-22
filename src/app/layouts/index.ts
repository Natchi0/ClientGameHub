import type { Component } from 'vue'
import { DEFAULT_LAYOUT_NAME, isLayoutName, type LayoutName } from '@/shared/types/layout'
import AuthLayout from './AuthLayout.vue'
import DefaultLayout from './DefaultLayout.vue'

/**
 * Registro de layouts disponibles.
 *
 * Es el punto de extensión para reemplazar la navegación por otro layout
 * (administración, sidebar, etc.) sin tocar `App.vue`: alcanza con registrar el
 * componente acá y pedirlo desde `meta.layout` de la ruta.
 */
const layouts: Record<LayoutName, Component> = {
  default: DefaultLayout,
  auth: AuthLayout,
}

export function resolveLayout(name?: string): Component {
  if (isLayoutName(name)) return layouts[name]
  return layouts[DEFAULT_LAYOUT_NAME]
}

export { AuthLayout, DefaultLayout }
export type { LayoutName }
