import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { realtimeClient } from '@/shared/composables/useRealtimeConnection'
import type { JsonValue, RealtimeConnectionStatus } from '@/shared/lib/realtime/signalRConnection'
import type { RealtimeHubClient } from '@/shared/lib/realtime/realtimeHubClient'
import { useMatchLobby } from '../composables/useMatchLobby'

let handlers: Record<string, () => void> = {}
let statusListener: ((status: RealtimeConnectionStatus) => void) | null = null

const client = {
  connect: vi.fn<() => Promise<void>>(),
  invoke: vi.fn<(methodName: string, ...args: JsonValue[]) => Promise<JsonValue>>(),
  on: vi.fn<(eventName: string, handler: () => void) => () => void>(),
  onStatusChange: vi.fn<(listener: (status: RealtimeConnectionStatus) => void) => () => void>(),
} as unknown as RealtimeHubClient

const connect = vi.mocked(client.connect)
const invoke = vi.mocked(client.invoke)
const on = vi.mocked(client.on)
const onStatusChange = vi.mocked(client.onStatusChange)

function mountLobby(matchId = ref<number | null>(42), enabled = ref(true)) {
  const onChanged = vi.fn<() => void>()
  const Harness = defineComponent({
    setup() {
      useMatchLobby(
        () => matchId.value,
        () => enabled.value,
        onChanged,
      )
      return () => null
    },
  })

  const wrapper = mount(Harness)
  return { wrapper, onChanged, matchId, enabled }
}

describe('useMatchLobby', () => {
  beforeEach(() => {
    handlers = {}
    statusListener = null
    connect.mockReset().mockResolvedValue(undefined)
    invoke.mockReset().mockResolvedValue(null)
    on.mockReset().mockImplementation((eventName, handler) => {
      handlers[eventName] = handler
      return vi.fn<() => void>()
    })
    onStatusChange.mockReset().mockImplementation((listener) => {
      statusListener = listener
      return vi.fn<() => void>()
    })
    realtimeClient.value = client
  })

  it('joins the match group, reacts to events and leaves on unmount', async () => {
    const { wrapper, onChanged, matchId } = mountLobby()
    await flushPromises()

    expect(connect).toHaveBeenCalled()
    expect(invoke).toHaveBeenCalledWith('JoinMatchGroup', 42)

    handlers.MatchUpdated?.()
    expect(onChanged).toHaveBeenCalledTimes(1)

    matchId.value = 43
    await nextTick()
    await flushPromises()

    expect(invoke).toHaveBeenCalledWith('LeaveMatchGroup', 42)
    expect(invoke).toHaveBeenCalledWith('JoinMatchGroup', 43)

    wrapper.unmount()
    expect(invoke).toHaveBeenCalledWith('LeaveMatchGroup', 43)
  })

  it('rejoins and re-queries after a reconnect', async () => {
    const { onChanged } = mountLobby()
    await flushPromises()

    invoke.mockClear()
    statusListener?.('disconnected')
    statusListener?.('connected')
    await flushPromises()

    expect(invoke).toHaveBeenCalledWith('JoinMatchGroup', 42)
    expect(onChanged).toHaveBeenCalledTimes(1)
  })
})
