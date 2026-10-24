import { describe, expect, it } from 'vitest'
import { formatDuration, formatPlayers, getGameVisual, hostingModeLabel } from '../lib/presentation'
import { GameHostingMode } from '../types'

describe('game presentation helpers', () => {
  it('formats player counts for fixed, ranged and open capacity', () => {
    expect(formatPlayers(2, 2)).toBe('2 jugadores')
    expect(formatPlayers(1, 1)).toBe('1 jugador')
    expect(formatPlayers(2, 4)).toBe('2–4 jugadores')
    expect(formatPlayers(2, null)).toBe('2+ jugadores')
  })

  it('formats the backend TimeSpan and falls back safely', () => {
    expect(formatDuration(null)).toBeNull()
    expect(formatDuration('00:15:00')).toBe('15 min')
    expect(formatDuration('01:30:00')).toBe('1 h 30 min')
    expect(formatDuration('1.02:00:00')).toBe('26 h')
    expect(formatDuration('PT45M')).toBe('45 min')
    expect(formatDuration('00:00:00')).toBe('menos de 1 min')
    expect(formatDuration('formato-raro')).toBe('formato-raro')
  })

  it('maps known modules to a visual and falls back for unknown ones', () => {
    expect(getGameVisual({ gameModule: 'connect-four' }).label).toBe('4 en línea')
    expect(getGameVisual({ gameModule: 'chess' }).label).toBe('Ajedrez')
    expect(getGameVisual({ gameModule: 'desconocido' }).label).toBe('Juego')
  })

  it('labels the hosting mode', () => {
    expect(hostingModeLabel(GameHostingMode.InProcess)).toBe('En GameHub')
    expect(hostingModeLabel(GameHostingMode.ExternalService)).toBe('Servicio externo')
  })
})
