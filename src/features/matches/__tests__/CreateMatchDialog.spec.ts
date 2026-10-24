import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CreateMatchDialog from '../components/CreateMatchDialog.vue'
import { matchesApi } from '../api/matchesApi'
import { gamesApi } from '@/features/games/api/gamesApi'
import type { GameDto } from '@/features/games/types'
import type { MatchDto } from '../types'
import { MatchStatus, MatchVisibility } from '../types'

vi.mock('../api/matchesApi', () => ({
  matchesApi: { createCustom: vi.fn<(request: unknown) => Promise<MatchDto>>() },
}))
vi.mock('@/features/games/api/gamesApi', () => ({
  gamesApi: { index: vi.fn<() => Promise<GameDto[]>>() },
}))

const mockedCreateCustom = vi.mocked(matchesApi.createCustom)
const mockedGamesIndex = vi.mocked(gamesApi.index)

const game: GameDto = {
  id: 1,
  name: 'connect-four',
  displayName: '4 en línea',
  slug: 'connect-four',
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
}

function mountDialog() {
  const wrapper = mount(CreateMatchDialog, {
    props: { open: true },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
  return wrapper
}

describe('CreateMatchDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    mockedCreateCustom.mockReset()
    mockedGamesIndex.mockReset()
  })

  it('carga los juegos al abrirse', async () => {
    mockedGamesIndex.mockResolvedValue([game])
    mountDialog()
    await flushPromises()
    expect(mockedGamesIndex).toHaveBeenCalledTimes(1)
  })

  it('crea una partida pública y emite created', async () => {
    mockedGamesIndex.mockResolvedValue([game])
    mockedCreateCustom.mockResolvedValue({
      id: 7,
      gameId: 1,
      ownerId: 10,
      isCustomMatch: true,
      status: MatchStatus.Pending,
      visibility: MatchVisibility.Public,
      joinCode: null,
      createdAt: '2026-10-20T18:30:00Z',
      endedAt: null,
      participants: [],
      configurations: [],
    } as MatchDto)

    const wrapper = mountDialog()
    await flushPromises()

    // Los select de reka-ui no abren de forma fiable en jsdom; se asignan los valores al modelo directamente.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = wrapper.vm as any
    vm.gameId = 1
    vm.seat = 1
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    // jsdom no envía el submit al hacer clic en el botón; se dispara directamente sobre el formulario.
    const form = dialogContent!.querySelector('form')
    expect(form).not.toBeNull()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedCreateCustom).toHaveBeenCalledWith({
      gameId: 1,
      visibility: MatchVisibility.Public,
      password: null,
      seat: 1,
      configurations: [],
    })
  })

  it('muestra un error de validación si no se elige juego ni asiento', async () => {
    mockedGamesIndex.mockResolvedValue([game])
    const wrapper = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    const form = dialogContent!.querySelector('form')
    expect(form).not.toBeNull()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedCreateCustom).not.toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((wrapper.vm as any).fieldErrors.game).toBe('Elegí un juego.')
    expect(dialogContent!.textContent).toContain('Elegí un juego.')
  })
})
