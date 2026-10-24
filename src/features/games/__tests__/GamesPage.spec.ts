import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GamesPage from '../pages/GamesPage.vue'
import { gamesApi } from '../api/gamesApi'
import type { GameDto } from '../types'

vi.mock('../api/gamesApi', () => ({
  gamesApi: {
    index: vi.fn<() => Promise<GameDto[]>>(),
    show: vi.fn<(gameId: number) => Promise<GameDto>>(),
  },
}))

const mockedIndex = vi.mocked(gamesApi.index)

const connectFour: GameDto = {
  id: 1,
  name: 'connect-four',
  displayName: '4 en línea',
  slug: 'connect-four',
  description: 'Conecta 4 fichas en línea antes que tu oponente.',
  instructions: 'Elegí una columna para soltar tu ficha.',
  minPlayers: 2,
  maxPlayers: 2,
  maxDuration: '00:15:00',
  version: 1,
  gameModule: 'connect-four',
  hostingMode: 0,
  externalEndpoint: null,
  hidden: false,
  createdAt: '2026-01-01T00:00:00Z',
  configurations: [],
}

const stubs = {
  RouterLink: { template: '<a><slot /></a>' },
}

describe('GamesPage', () => {
  beforeEach(() => {
    mockedIndex.mockReset()
  })

  it('lists the games returned by the API', async () => {
    mockedIndex.mockResolvedValue([connectFour])

    const wrapper = mount(GamesPage, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('4 en línea')
    expect(wrapper.text()).toContain('Conecta 4 fichas')
    expect(mockedIndex).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when there are no games', async () => {
    mockedIndex.mockResolvedValue([])

    const wrapper = mount(GamesPage, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay juegos disponibles')
  })

  it('shows an error and retries the request', async () => {
    mockedIndex.mockRejectedValueOnce(new Error('network down'))

    const wrapper = mount(GamesPage, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo cargar el catálogo')

    mockedIndex.mockResolvedValueOnce([connectFour])
    const retry = wrapper.findAll('button').find((button) => button.text().includes('Reintentar'))
    if (!retry) throw new Error('Retry button was not rendered')
    await retry.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('4 en línea')
  })
})
