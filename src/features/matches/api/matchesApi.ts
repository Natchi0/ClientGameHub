import { http } from '@/shared/lib/http'
import type { PagedResult } from '@/shared/types/pagination'
import type { CreateCustomMatchRequest, JoinMatchRequest, MatchDto, MatchListQuery } from '../types'

export const matchesApi = {
  async index(query: MatchListQuery = {}): Promise<PagedResult<MatchDto>> {
    const { data } = await http.get<PagedResult<MatchDto>>('/matches', { params: query })
    return data
  },

  async show(matchId: number): Promise<MatchDto> {
    const { data } = await http.get<MatchDto>(`/matches/${matchId}`)
    return data
  },

  async createCustom(request: CreateCustomMatchRequest): Promise<MatchDto> {
    const { data } = await http.post<MatchDto>('/matches/custom', request)
    return data
  },

  async join(matchId: number, request: JoinMatchRequest): Promise<MatchDto> {
    const { data } = await http.post<MatchDto>(`/matches/${matchId}/join`, request)
    return data
  },

  async joinByCode(joinCode: string, request: JoinMatchRequest): Promise<MatchDto> {
    const { data } = await http.post<MatchDto>(
      `/matches/join-by-code/${encodeURIComponent(joinCode)}`,
      request,
    )
    return data
  },

  async leave(matchId: number): Promise<MatchDto> {
    const { data } = await http.delete<MatchDto>(`/matches/${matchId}/leave`)
    return data
  },
}
