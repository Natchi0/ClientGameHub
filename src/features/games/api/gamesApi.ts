import { http } from '@/shared/lib/http'
import type { PagedResult } from '@/shared/types/pagination'
import type { GameDto } from '../types'

export const gamesApi = {
  async index(): Promise<GameDto[]> {
    // El catálogo actual es chico; pedimos la primera página completa.
    const { data } = await http.get<PagedResult<GameDto>>('/games', {
      params: { pageSize: 100 },
    })
    return data.items
  },

  async show(gameId: number): Promise<GameDto> {
    const { data } = await http.get<GameDto>(`/games/${gameId}`)
    return data
  },
}
