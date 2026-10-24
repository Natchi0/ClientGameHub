import { describe, expect, it } from 'vitest'
import {
  availableSeats,
  buildInviteLink,
  capacityLabel,
  extractJoinCode,
  generatePassword,
  getJoinAvailability,
  isParticipant,
  matchStatusLabel,
  matchVisibilityLabel,
  nextAvailableSeat,
  ownerParticipant,
  playerCount,
} from '../lib/presentation'
import { MatchStatus, MatchVisibility, ParticipantType, type MatchDto } from '../types'

function makeMatch(overrides: Partial<MatchDto> = {}): MatchDto {
  return {
    id: 1,
    gameId: 1,
    ownerId: 10,
    isCustomMatch: true,
    status: MatchStatus.Pending,
    visibility: MatchVisibility.Public,
    joinCode: 'join-code',
    createdAt: '2026-10-20T18:30:00Z',
    endedAt: null,
    participants: [
      {
        id: 10,
        userId: 5,
        nickname: 'Ana',
        avatar: null,
        seat: 1,
        type: ParticipantType.Player,
      },
      {
        id: 11,
        userId: 6,
        nickname: 'Beto',
        avatar: null,
        seat: 2,
        type: ParticipantType.Player,
      },
    ],
    configurations: [],
    ...overrides,
  }
}

describe('match presentation helpers', () => {
  it('describes status and visibility', () => {
    expect(matchStatusLabel(MatchStatus.Pending)).toBe('Esperando jugadores')
    expect(matchStatusLabel(MatchStatus.Started)).toBe('En juego')
    expect(matchStatusLabel(MatchStatus.Canceled)).toBe('Cancelada')
    expect(matchVisibilityLabel(MatchVisibility.Public)).toBe('Pública')
    expect(matchVisibilityLabel(MatchVisibility.Private)).toBe('Privada')
  })

  it('counts players and identifies participants and the owner', () => {
    const match = makeMatch()

    expect(playerCount(match)).toBe(2)
    expect(isParticipant(match, 5)).toBe(true)
    expect(isParticipant(match, 99)).toBe(false)
    expect(isParticipant(match, null)).toBe(false)
    expect(ownerParticipant(match)?.nickname).toBe('Ana')
    expect(ownerParticipant(makeMatch({ ownerId: null }))).toBeNull()
  })

  it('offers the next free seat and excludes occupied ones', () => {
    expect(availableSeats(makeMatch(), 4)).toEqual([3, 4])
    expect(nextAvailableSeat(makeMatch(), 4)).toBe(3)
    expect(availableSeats(makeMatch(), 2)).toEqual([])
  })

  it('blocks joins for participants, full or non-pending matches', () => {
    expect(getJoinAvailability(makeMatch(), 4, 99)).toEqual({ allowed: true, reason: null })
    expect(getJoinAvailability(makeMatch(), 4, 5).allowed).toBe(false)
    expect(getJoinAvailability(makeMatch(), 2, 99).reason).toBe('La partida está completa.')
    expect(getJoinAvailability(makeMatch({ status: MatchStatus.Started }), 4, 99).reason).toBe(
      'En juego',
    )
  })

  it('formats capacity with and without a maximum', () => {
    expect(capacityLabel(makeMatch(), 4)).toBe('2/4 jugadores')
    expect(capacityLabel(makeMatch(), null)).toBe('2 jugadores · sin límite')
  })

  it('extracts a code from a bare value or an invite link', () => {
    expect(extractJoinCode('abc123')).toBe('abc123')
    expect(extractJoinCode('https://gamehub.test/join?code=abc123')).toBe('abc123')
    expect(extractJoinCode('?code=abc123')).toBe('abc123')
    expect(extractJoinCode('   ')).toBe('')
  })

  it('builds an invite link and generates readable passwords', () => {
    expect(buildInviteLink('abc 123', 'https://gamehub.test')).toBe(
      'https://gamehub.test/join?code=abc%20123',
    )
    expect(generatePassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9!"#$%&/?@~¨*_:;,.^.-]{10}$/)
  })
})
