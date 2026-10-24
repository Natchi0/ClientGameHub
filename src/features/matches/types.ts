// El backend serializa los enums como números (System.Text.Json por defecto).
const MatchStatus = {
  Pending: 0,
  Started: 1,
  Finished: 2,
  Canceled: 3,
} as const

type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus]

const MatchVisibility = {
  Public: 0,
  Private: 1,
  FriendsOnly: 2,
} as const

type MatchVisibility = (typeof MatchVisibility)[keyof typeof MatchVisibility]

const ParticipantType = {
  Player: 0,
  Spectator: 1,
} as const

type ParticipantType = (typeof ParticipantType)[keyof typeof ParticipantType]

interface MatchParticipantDto {
  id: number
  userId: number
  nickname: string
  avatar: string | null
  seat: number | null
  type: ParticipantType
}

interface MatchConfigurationDto {
  id: number
  gameConfigurationId: number
  configId: number
  name: string
  value: string
}

interface MatchDto {
  id: number
  gameId: number
  /** Id del participante que creó la partida, no el userId. */
  ownerId: number | null
  isCustomMatch: boolean
  status: MatchStatus
  visibility: MatchVisibility
  /** Sólo llega a participantes y admins. */
  joinCode: string | null
  createdAt: string
  endedAt: string | null
  participants: MatchParticipantDto[]
  configurations: MatchConfigurationDto[]
}

interface MatchListQuery {
  gameId?: number
  status?: MatchStatus
  visibility?: MatchVisibility
  participantUserId?: number
  createdFrom?: string
  createdTo?: string
  search?: string
  page?: number
  pageSize?: number
  sort?: string
}

interface MatchConfigurationRequest {
  gameConfigurationId: number
  value: string
}

interface CreateCustomMatchRequest {
  gameId: number
  visibility: MatchVisibility
  password?: string | null
  seat?: number | null
  configurations?: MatchConfigurationRequest[]
}

interface JoinMatchRequest {
  joinCode?: string | null
  password?: string | null
  seat?: number | null
  type: ParticipantType
}

export { MatchStatus, MatchVisibility, ParticipantType }
export type {
  CreateCustomMatchRequest,
  JoinMatchRequest,
  MatchConfigurationDto,
  MatchConfigurationRequest,
  MatchDto,
  MatchListQuery,
  MatchParticipantDto,
}
