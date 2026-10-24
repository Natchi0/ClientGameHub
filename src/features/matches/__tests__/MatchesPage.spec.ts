import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MatchesPage from '../pages/MatchesPage.vue'
import CreateMatchDialog from '../components/CreateMatchDialog.vue'
import { matchesApi } from '../api/matchesApi'
import { gamesApi } from '@/features/games/api/gamesApi'
import type { PagedResult } from '@/shared/types/pagination'
import type { GameDto } from '@/features/games/types'
import type { MatchDto } from '../types'
import { MatchStatus, MatchVisibility, ParticipantType } from '../types'

vi.mock('../api/matchesApi', () => ({
  matchesApi: {
    index: vi.fn<() => Promise<PagedResult<MatchDto>>>(),
    show: vi.fn<(matchId: number) => Promise<MatchDto>>(),
    createCustom: vi.fn<(request: unknown) => Promise<MatchDto>>(),
    join: vi.fn<(matchId: number, request: unknown) => Promise<MatchDto>>(),
    joinByCode: vi.fn<(joinCode: string, request: unknown) => Promise<MatchDto>>(),
    leave: vi.fn<(matchId: number) => Promise<MatchDto>>(),
  },
}))
vi.mock('@/features/games/api/gamesApi', () => ({
  gamesApi: {
    index: vi.fn<() => Promise<unknown[]>>(),
  },
}))

const mockedIndex = vi.mocked(matchesApi.index)
const mockedGamesIndex = vi.mocked(gamesApi.index)
const mockedJoin = vi.mocked(matchesApi.join)
const mockedCreateCustom = vi.mocked(matchesApi.createCustom)

function makeGame(id: number, overrides: Partial<GameDto> = {}): GameDto {
  return {
    id,
    name: `game-${id}`,
    displayName: `Juego ${id}`,
    slug: `game-${id}`,
    description: '',
    instructions: '',
    maxDuration: null,
    version: 1,
    minPlayers: 2,
    maxPlayers: 4,
    gameModule: 'c4',
    hostingMode: 0,
    externalEndpoint: null,
    hidden: false,
    createdAt: '2026-01-01',
    configurations: [],
    ...overrides,
  }
}

const pendingMatch: MatchDto = {
  id: 7,
  gameId: 1,
  ownerId: 10,
  isCustomMatch: true,
  status: MatchStatus.Pending,
  visibility: MatchVisibility.Public,
  joinCode: 'abc123',
  createdAt: '2026-10-20T18:30:00Z',
  endedAt: null,
  participants: [
    { id: 10, userId: 5, nickname: 'Ana', avatar: null, seat: 1, type: ParticipantType.Player },
  ],
  configurations: [],
}

const result: PagedResult<MatchDto> = {
  items: [pendingMatch],
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
}

function makeRouter(_query: Record<string, string | string[]> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/matches', name: 'Matches', component: { template: '<div />' } },
      { path: '/matches/:matchId(\\d+)', name: 'MatchWaiting', component: { template: '<div />' } },
    ],
  })
  return router
}

async function mountPage(query: Record<string, string | string[]> = {}) {
  const router = makeRouter(query)
  await router.push({ path: '/matches', query })
  await router.isReady()

  const wrapper = mount(MatchesPage, {
    global: { plugins: [router, createPinia()] },
    attachTo: document.body,
  })
  await flushPromises()

  return { wrapper, router }
}

describe('MatchesPage', () => {
  // Los diálogos se teletransportan a document.body; limpiarlo entre pruebas evita
  // que contenido de pruebas previas interfiera con los selectores del DOM.
  afterEach(() => {
    document.body.innerHTML = ''
  })

  beforeEach(() => {
    mockedIndex.mockReset()
    mockedGamesIndex.mockReset()
    mockedJoin.mockReset()
    mockedCreateCustom.mockReset()
    mockedGamesIndex.mockResolvedValue([])
    mockedIndex.mockResolvedValue(result)
  })

  it('renderiza el listado y llama a la API con los filtros por defecto', async () => {
    const { wrapper } = await mountPage()

    expect(mockedIndex).toHaveBeenCalledWith({
      gameId: undefined,
      status: MatchStatus.Pending,
      visibility: MatchVisibility.Public,
      search: undefined,
      page: 1,
      pageSize: 20,
      sort: '-createdAt',
    })
    expect(wrapper.text()).toContain('Partidas')
    expect(wrapper.text()).toContain('#7')
    expect(wrapper.text()).toContain('Ana')
    expect(wrapper.text()).not.toContain('No se encontraron partidas')
  })

  it('el catálogo de juegos se pide una sola vez aunque la página y el listado lo necesiten', async () => {
    await mountPage()

    expect(mockedGamesIndex).toHaveBeenCalledTimes(1)
  })

  it('el botón Actualizar vuelve a pedir el listado desde la primera página', async () => {
    mockedIndex.mockResolvedValue({ ...result, totalCount: 30, totalPages: 3 })
    const { wrapper } = await mountPage()
    await flushPromises()

    const siguiente = wrapper.findAll('button').find((button) => button.text() === 'Siguiente')
    await siguiente!.trigger('click')
    await flushPromises()
    expect(mockedIndex).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))

    const actualizar = () =>
      wrapper.findAll('button').find((button) => button.text() === 'Actualizar')
    expect(actualizar()).toBeDefined()
    await actualizar()!.trigger('click')
    await flushPromises()

    expect(mockedIndex).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, status: MatchStatus.Pending }),
    )
  })

  it('deshabilita el botón de unirse cuando el cupo de la partida está lleno', async () => {
    mockedGamesIndex.mockResolvedValue([makeGame(1, { displayName: '4 en línea', maxPlayers: 4 })])
    mockedIndex.mockResolvedValue({
      ...result,
      items: [
        {
          ...pendingMatch,
          id: 9,
          gameId: 1,
          participants: Array.from({ length: 4 }, (_, index) => ({
            id: 100 + index,
            userId: 42 + index,
            nickname: `Jugador${index}`,
            avatar: null,
            seat: index + 1,
            type: ParticipantType.Player,
          })),
        },
      ],
    })
    const { wrapper } = await mountPage({ gameId: '1' })
    await flushPromises()

    const rowButtons = wrapper
      .findAll('table tbody tr td button')
      .filter(
        (button) =>
          button.text() === 'Unirse' || button.text().includes('La partida está completa'),
      )
    expect(rowButtons).toHaveLength(1)
    const fullButton = rowButtons[0]
    expect(fullButton).toBeDefined()
    expect(fullButton!.text()).toContain('La partida está completa')
    expect(fullButton!.attributes('disabled')).toBeDefined()
  })

  it('preseleciona el juego cuando se llega desde una ficha de juego (?gameId)', async () => {
    mockedGamesIndex.mockResolvedValue([
      {
        id: 3,
        name: 'otro',
        displayName: 'Otro juego',
        slug: 'otro',
        description: 'd',
        instructions: 'i',
        minPlayers: 2,
        maxPlayers: 4,
        maxDuration: null,
        version: 1,
        gameModule: 'otro',
        hostingMode: 0,
        externalEndpoint: null,
        hidden: false,
        createdAt: '2026-01-01',
        configurations: [],
      },
      {
        id: 1,
        name: 'c4',
        displayName: '4 en línea',
        slug: 'c4',
        description: 'd',
        instructions: 'i',
        minPlayers: 2,
        maxPlayers: 4,
        maxDuration: null,
        version: 1,
        gameModule: 'c4',
        hostingMode: 0,
        externalEndpoint: null,
        hidden: false,
        createdAt: '2026-01-01',
        configurations: [],
      },
    ])
    const { wrapper } = await mountPage({ gameId: '1' })

    await flushPromises()
    expect(wrapper.text()).toContain('#7')
  })

  it('muestra el estado vacío cuando no hay partidas', async () => {
    mockedIndex.mockResolvedValue({ ...result, items: [], totalCount: 0 })
    const { wrapper } = await mountPage()

    expect(wrapper.text()).toContain('No se encontraron partidas')
  })

  it('muestra y oculta los filtros con el botón Filtros', async () => {
    const { wrapper } = await mountPage()

    expect(wrapper.text()).not.toContain('Ordenar por')
    expect(wrapper.find('#matches-filters').exists()).toBe(false)

    const filtros = () =>
      wrapper.findAll('button').find((button) => button.text().includes('Filtros'))
    expect(filtros()).toBeDefined()
    expect(filtros()!.attributes('aria-expanded')).toBe('false')

    await filtros()!.trigger('click')
    await flushPromises()

    expect(wrapper.find('#matches-filters').exists()).toBe(true)
    expect(wrapper.text()).toContain('Visibilidad')
    expect(filtros()!.attributes('aria-expanded')).toBe('true')

    await filtros()!.trigger('click')
    await flushPromises()
    expect(wrapper.find('#matches-filters').exists()).toBe(false)
  })

  it('al ordenar desde el encabezado vuelve a la primera página', async () => {
    mockedIndex.mockResolvedValue({ ...result, totalCount: 30, totalPages: 3 })
    const { wrapper } = await mountPage()

    const siguiente = wrapper.findAll('button').find((button) => button.text() === 'Siguiente')
    expect(siguiente).toBeDefined()
    await siguiente!.trigger('click')
    await flushPromises()
    expect(mockedIndex).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))

    const headerJuego = wrapper.findAll('thead th').find((th) => th.text() === 'Juego')
    expect(headerJuego).toBeDefined()
    await headerJuego!.find('button').trigger('click')
    await flushPromises()

    expect(mockedIndex).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, sort: 'gameId' }),
    )
  })

  it('muestra el tamaño de página y la paginación debajo de la tabla', async () => {
    mockedIndex.mockResolvedValue({ ...result, totalCount: 30, totalPages: 3 })
    const { wrapper } = await mountPage()
    const html = wrapper.html()

    const tableAt = html.indexOf('data-slot="table"')
    const pageSizeAt = html.indexOf('por página')
    const paginationAt = html.indexOf('Siguiente')

    expect(tableAt).toBeGreaterThan(-1)
    expect(pageSizeAt).toBeGreaterThan(tableAt)
    expect(paginationAt).toBeGreaterThan(tableAt)
    // ...pero no arriba (el buscador y el botón de filtros sí lo están).
    expect(html.indexOf('Filtros')).toBeLessThan(tableAt)
  })

  it('abre el diálogo de creación al hacer clic en Crear partida', async () => {
    const { wrapper } = await mountPage()

    const crear = wrapper.findAll('button').find((button) => button.text() === 'Crear partida')
    expect(crear).toBeDefined()
    await crear!.trigger('click')
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    expect(dialogContent!.textContent).toContain('Crear partida')
  })

  it('al unirse correctamente navega a la sala de espera', async () => {
    mockedGamesIndex.mockResolvedValue([makeGame(1, { maxPlayers: 4 })])
    mockedJoin.mockResolvedValue({
      ...pendingMatch,
      participants: [
        ...pendingMatch.participants,
        { id: 11, userId: 6, nickname: 'Beto', avatar: null, seat: 2, type: ParticipantType.Player },
      ],
    })
    const { wrapper, router } = await mountPage()
    await flushPromises()

    const unirse = () =>
      wrapper.findAll('table tbody tr td button').find((button) => button.text() === 'Unirse')
    expect(unirse()).toBeDefined()
    await unirse()!.trigger('click')
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()

    const form = dialogContent!.querySelector('form')
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ type: ParticipantType.Player, seat: 2, password: null }),
    )
    expect(router.currentRoute.value.name).toBe('MatchWaiting')
    expect(router.currentRoute.value.params.matchId).toBe('7')
  })

  it('al crear una partida correctamente navega a la sala de espera', async () => {
    mockedCreateCustom.mockResolvedValue(pendingMatch)
    const { wrapper, router } = await mountPage()
    await flushPromises()

    const crear = wrapper.findAll('button').find((button) => button.text() === 'Crear partida')
    expect(crear).toBeDefined()
    await crear!.trigger('click')
    await flushPromises()

    // Los selects de reka-ui no son fiables en jsdom; se asignan los valores al modelo directo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = (wrapper.findComponent(CreateMatchDialog).vm as any)
    vm.values.gameId = 1
    vm.values.seat = 1
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    const form = dialogContent!.querySelector('form')
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedCreateCustom).toHaveBeenCalledWith({
      gameId: 1,
      visibility: MatchVisibility.Public,
      password: null,
      seat: 1,
      configurations: [],
    })
    expect(router.currentRoute.value.name).toBe('MatchWaiting')
    expect(router.currentRoute.value.params.matchId).toBe('7')
  })
})
