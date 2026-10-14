// Admin > Player > Guest. Mantener sincronizado con las políticas del backend.
const ROLE_RANK: Record<string, number> = { Guest: 0, Player: 1, Admin: 2 }

/** true si alguno de los roles del usuario alcanza al requerido. Rol desconocido => false. */
export function hasRoleAtLeast(userRoles: readonly string[], required: string): boolean {
  const need = ROLE_RANK[required]
  if (need === undefined) return false
  return userRoles.some((r) => (ROLE_RANK[r] ?? -1) >= need)
}
