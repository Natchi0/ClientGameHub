import 'vue-router'
import type { LayoutName } from './layout'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAccount?: boolean // exige cuenta registrada (no guest)
    guestOnly?: boolean // solo para quien aún no tiene cuenta
    requiredRole?: string
    layout?: LayoutName // layout que envuelve la página
  }
}
