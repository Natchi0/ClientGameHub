import { markRaw, type Component } from 'vue'
import { Crown, Gamepad2, Grid3x3 } from '@lucide/vue'
import { GameHostingMode, type GameDto } from '../types'

interface GameVisual {
  icon: Component
  tone: string
  label: string
}

const DEFAULT_VISUAL: GameVisual = {
  icon: markRaw(Gamepad2),
  tone: 'bg-primary/15 text-primary',
  label: 'Juego',
}

// La API todavía no expone imágenes: cada módulo se identifica con un ícono y un tono.
const VISUALS: Record<string, GameVisual> = {
  'connect-four': {
    icon: markRaw(Grid3x3),
    tone: 'bg-accent text-accent-foreground',
    label: '4 en línea',
  },
  chess: {
    icon: markRaw(Crown),
    tone: 'bg-secondary text-secondary-foreground',
    label: 'Ajedrez',
  },
}

export function getGameVisual(game: Pick<GameDto, 'gameModule'>): GameVisual {
  return VISUALS[game.gameModule] ?? DEFAULT_VISUAL
}

/** "2 jugadores", "2–4 jugadores", "2+ jugadores". */
export function formatPlayers(minPlayers: number, maxPlayers: number | null): string {
  if (maxPlayers === null) return `${minPlayers}+ jugadores`
  if (maxPlayers === minPlayers)
    return `${minPlayers} ${minPlayers === 1 ? 'jugador' : 'jugadores'}`
  return `${minPlayers}–${maxPlayers} jugadores`
}

const TIMESPAN_PATTERN = /^(?:-)?(?:(\d+)\.)?(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/
const ISO_DURATION_PATTERN = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/

/**
 * Convierte el `TimeSpan` del backend (p. ej. "00:15:00") en una etiqueta breve.
 * Devuelve null cuando no hay duración y el texto original si el formato es desconocido.
 */
export function formatDuration(value: string | null): string | null {
  if (!value) return null

  const timeSpan = TIMESPAN_PATTERN.exec(value.trim())
  if (timeSpan) {
    const days = Number(timeSpan[1] ?? 0)
    const hours = Number(timeSpan[2]) + days * 24
    const minutes = Number(timeSpan[3])
    return formatHoursMinutes(hours, minutes)
  }

  const iso = ISO_DURATION_PATTERN.exec(value.trim())
  if (iso) {
    const days = Number(iso[1] ?? 0)
    const hours = Number(iso[2] ?? 0) + days * 24
    return formatHoursMinutes(hours, Number(iso[3] ?? 0))
  }

  return value
}

function formatHoursMinutes(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return 'menos de 1 min'
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function hostingModeLabel(mode: GameHostingMode): string {
  return mode === GameHostingMode.ExternalService ? 'Servicio externo' : 'En GameHub'
}
