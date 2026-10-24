import {
  MatchStatus,
  MatchVisibility,
  ParticipantType,
  type MatchDto,
  type MatchParticipantDto,
} from '../types'

/**
 * `Game.MaxPlayers` puede ser null. Mientras se define el inicio manual,
 * la UI ofrece hasta 8 asientos y siempre deja lugar para un jugador más.
 */
const FALLBACK_SEAT_LIMIT = 8

export function matchStatusLabel(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.Pending:
      return 'Esperando jugadores'
    case MatchStatus.Started:
      return 'En juego'
    case MatchStatus.Finished:
      return 'Finalizada'
    case MatchStatus.Canceled:
      return 'Cancelada'
    default:
      return 'Desconocido'
  }
}

export function matchVisibilityLabel(visibility: MatchVisibility): string {
  switch (visibility) {
    case MatchVisibility.Public:
      return 'Pública'
    case MatchVisibility.Private:
      return 'Privada'
    case MatchVisibility.FriendsOnly:
      return 'Solo amigos'
    default:
      return 'Desconocida'
  }
}

export function isPrivateMatch(match: Pick<MatchDto, 'visibility'>): boolean {
  return match.visibility === MatchVisibility.Private
}

export function playerCount(match: Pick<MatchDto, 'participants'>): number {
  return match.participants.filter((participant) => participant.type === ParticipantType.Player)
    .length
}

export function isParticipant(
  match: Pick<MatchDto, 'participants'>,
  userId: number | null,
): boolean {
  return userId !== null && match.participants.some((participant) => participant.userId === userId)
}

export function ownerParticipant(
  match: Pick<MatchDto, 'ownerId' | 'participants'>,
): MatchParticipantDto | null {
  if (match.ownerId === null) return null
  return match.participants.find((participant) => participant.id === match.ownerId) ?? null
}

/** Asientos de jugadores ocupados (los espectadores no cuentan). */
export function occupiedPlayerSeats(match: Pick<MatchDto, 'participants'>): Set<number> {
  return new Set(
    match.participants
      .filter(
        (participant) => participant.type === ParticipantType.Player && participant.seat !== null,
      )
      .map((participant) => participant.seat as number),
  )
}

export function seatLimit(maxPlayers: number | null, players: number): number {
  if (maxPlayers !== null) return maxPlayers
  return Math.max(FALLBACK_SEAT_LIMIT, players + 1)
}

export function availableSeats(
  match: Pick<MatchDto, 'participants'>,
  maxPlayers: number | null,
): number[] {
  const occupied = occupiedPlayerSeats(match)
  const limit = seatLimit(maxPlayers, playerCount(match))
  const seats: number[] = []

  for (let seat = 1; seat <= limit; seat++) {
    if (!occupied.has(seat)) seats.push(seat)
  }

  return seats
}

export function nextAvailableSeat(
  match: Pick<MatchDto, 'participants'>,
  maxPlayers: number | null,
): number | null {
  return availableSeats(match, maxPlayers)[0] ?? null
}

export interface JoinAvailability {
  allowed: boolean
  reason: string | null
}

export function getJoinAvailability(
  match: Pick<MatchDto, 'participants' | 'status'>,
  maxPlayers: number | null,
  userId: number | null,
): JoinAvailability {
  if (isParticipant(match, userId)) return { allowed: false, reason: 'Ya estás en la partida.' }
  if (match.status !== MatchStatus.Pending)
    return { allowed: false, reason: matchStatusLabel(match.status) }
  if (maxPlayers !== null && playerCount(match) >= maxPlayers)
    return { allowed: false, reason: 'La partida está completa.' }
  if (availableSeats(match, maxPlayers).length === 0)
    return { allowed: false, reason: 'No quedan asientos disponibles.' }

  return { allowed: true, reason: null }
}

export function capacityLabel(
  match: Pick<MatchDto, 'participants'>,
  maxPlayers: number | null,
): string {
  const players = playerCount(match)
  return maxPlayers === null
    ? `${players} jugadores · sin límite`
    : `${players}/${maxPlayers} jugadores`
}

export function formatMatchDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function buildInviteLink(joinCode: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/join?code=${encodeURIComponent(joinCode)}`
}

/** Acepta un código suelto o un link de invitación completo. */
export function extractJoinCode(value: string): string {
  const text = value.trim()
  if (!text) return ''

  try {
    const url = new URL(text)
    const code = url.searchParams.get('code')
    if (code) return code.trim()
  } catch {
    // No es una URL absoluta: seguimos con el texto.
  }

  if (text.includes('code=')) {
    const queryStart = text.indexOf('?')
    const params = new URLSearchParams(queryStart >= 0 ? text.slice(queryStart) : text)
    const code = params.get('code')
    if (code) return code.trim()
  }

  return text
}

/** Password aleatoria para compartir*/
export function generatePassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!"#$%&/?@~^¨*_:;,.'
  const cryptoApi = globalThis.crypto

  if (cryptoApi?.getRandomValues) {
    const values = cryptoApi.getRandomValues(new Uint32Array(length))
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
  }

  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    '',
  )
}
