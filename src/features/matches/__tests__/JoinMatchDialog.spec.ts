import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import JoinMatchDialog from '../components/JoinMatchDialog.vue'
import { matchesApi } from '../api/matchesApi'
import type { GameDto } from '@/features/games/types'
import type { MatchDto } from '../types'
import { MatchStatus, MatchVisibility, ParticipantType } from '../types'

vi.mock('../api/matchesApi', () => ({
  matchesApi: { join: vi.fn<(matchId: number, request: unknown) => Promise<MatchDto>>() },
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(message?: string) => void>(),
    error: vi.fn<(message?: string) => void>(),
    info: vi.fn<(message?: string) => void>(),
  },
}))

import { toast } from 'vue-sonner'

const mockedJoin = vi.mocked(matchesApi.join)
const mockedToast = vi.mocked(toast, true)

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

const match: MatchDto = {
  id: 9,
  gameId: 1,
  ownerId: 10,
  isCustomMatch: true,
  status: MatchStatus.Pending,
  visibility: MatchVisibility.Private,
  joinCode: null,
  createdAt: '2026-10-20T18:30:00Z',
  endedAt: null,
  participants: [
    { id: 10, userId: 5, nickname: 'Ana', avatar: null, seat: 1, type: ParticipantType.Player },
    { id: 11, userId: 6, nickname: 'Beto', avatar: null, seat: 2, type: ParticipantType.Player },
  ],
  configurations: [],
}

function mountDialog() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/matches', name: 'Matches', component: { template: '<div />' } },
      { path: '/matches/:matchId(\\d+)', name: 'MatchWaiting', component: { template: '<div />' } },
    ],
  })

  const wrapper = mount(JoinMatchDialog, {
    props: { open: true, match, game },
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
  return { wrapper, router }
}

describe('JoinMatchDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    mockedJoin.mockReset()
    mockedToast.success.mockClear()
    mockedToast.error.mockClear()
    mockedToast.info.mockClear()
  })

  it('se une a una partida privada con contraseña y asiento', async () => {
    mockedJoin.mockResolvedValue({ ...match, joinCode: 'x' } as MatchDto)

    const _wrapper = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()

    const passwordInput = dialogContent!.querySelector('input[type="password"]') as HTMLInputElement
    expect(passwordInput).not.toBeNull()
    passwordInput.value = 'secreto'
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    // El asiento queda preseleccionado al primero disponible (asiento 3).
    const form = dialogContent!.querySelector('form')
    expect(form).not.toBeNull()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).toHaveBeenCalledWith(9, {
      type: ParticipantType.Player,
      seat: 3,
      password: 'secreto',
    })
    expect(toast.success).toHaveBeenCalledWith('Te uniste a la partida.')
  })

  it('muestra el error con un toast cuando no se puede unir', async () => {
    mockedJoin.mockRejectedValue(
      new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        {} as InternalAxiosRequestConfig,
        null,
        { status: 409, data: 'La partida está completa.' } as AxiosResponse,
      ),
    )

    const { wrapper } = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    const passwordInput = dialogContent!.querySelector('input[type="password"]') as HTMLInputElement
    passwordInput.value = 'secreto'
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const form = dialogContent!.querySelector('form')
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith('La partida está completa.')
    // el diálogo queda abierto para que la persona pueda reintentar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((wrapper.vm as any).joinError).toBe('La partida está completa.')
  })

  it('exige contraseña en partidas privadas', async () => {
    const { wrapper } = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    const form = dialogContent!.querySelector('form')
    expect(form).not.toBeNull()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).not.toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((wrapper.vm as any).joinError).toBe('Ingresá la contraseña para entrar.')
  })

  it('si ya participa (409) cierra el diálogo, avisa y lleva a la sala', async () => {
    mockedJoin.mockRejectedValue(
      new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        {} as InternalAxiosRequestConfig,
        null,
        { status: 409, data: 'El usuario ya participa en la partida.' } as AxiosResponse,
      ),
    )

    const { router } = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    const passwordInput = dialogContent!.querySelector('input[type="password"]') as HTMLInputElement
    passwordInput.value = 'secreto'
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const form = dialogContent!.querySelector('form')
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).toHaveBeenCalledTimes(1)
    expect(mockedToast.info).toHaveBeenCalledWith('Ya participás en esta partida.')
    expect(router.currentRoute.value.name).toBe('MatchWaiting')
    expect(router.currentRoute.value.params.matchId).toBe('9')
  })
})
