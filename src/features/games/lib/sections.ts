import type { Component } from 'vue'
import type { GameDto } from '../types'

export interface GameExtraSection {
  id: string
  label: string
  component: Component
}

/**
 * Punto de extensión para juegos con secciones propias.
 * Se registran por `gameModule` y se suman a las pestañas comunes de la vista.
 */
const GAME_SECTIONS: Record<string, GameExtraSection[]> = {}

export function getExtraSections(game: GameDto | null): GameExtraSection[] {
  if (!game) return []
  return GAME_SECTIONS[game.gameModule] ?? []
}
