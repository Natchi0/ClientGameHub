import { beforeEach, describe, expect, it, vi } from 'vitest'

const signalRMocks = vi.hoisted(() => {
  const connection = {
    state: 'Disconnected',
    start: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    stop: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    invoke: vi.fn<(...args: never[]) => Promise<void>>().mockResolvedValue(undefined),
    on: vi.fn<(...args: never[]) => void>(),
    off: vi.fn<(...args: never[]) => void>(),
    onclose: vi.fn<(...args: never[]) => void>(),
    onreconnecting: vi.fn<(...args: never[]) => void>(),
    onreconnected: vi.fn<(...args: never[]) => void>(),
  }
  const withUrl = vi.fn<(...args: never[]) => void>()

  class HubConnectionBuilderMock {
    withUrl(...args: [string, { accessTokenFactory: () => string | Promise<string> }]) {
      withUrl(...args)
      return this
    }

    configureLogging() {
      return this
    }

    withAutomaticReconnect() {
      return { build: () => connection }
    }
  }

  return { connection, withUrl, HubConnectionBuilderMock }
})

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: signalRMocks.HubConnectionBuilderMock,
  HubConnectionState: {
    Connected: 'Connected',
    Connecting: 'Connecting',
    Disconnected: 'Disconnected',
    Reconnecting: 'Reconnecting',
  },
  LogLevel: { Warning: 3 },
}))

import { MatchHubClient } from '../matchHubClient'

describe('MatchHubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signalRMocks.connection.state = 'Disconnected'
  })

  it('connects with its match ID and current access token', async () => {
    const client = new MatchHubClient({
      hubUrl: 'http://localhost:5045/hubs/game',
      matchId: 42,
      accessTokenFactory: () => 'current-token',
    })

    await client.connect()

    expect(signalRMocks.withUrl).toHaveBeenCalledWith(
      'http://localhost:5045/hubs/game?matchId=42',
      expect.objectContaining({ accessTokenFactory: expect.any(Function) }),
    )
    expect(signalRMocks.connection.start).toHaveBeenCalledOnce()
  })

  it('sends a typed game action through SendAction', async () => {
    const client = new MatchHubClient<{ board: number[][] }>({
      hubUrl: 'http://localhost:5045/hubs/game',
      matchId: 42,
      accessTokenFactory: () => 'current-token',
    })

    await client.sendAction('PlacePiece', { column: 3 })

    expect(signalRMocks.connection.invoke).toHaveBeenCalledWith('SendAction', 'PlacePiece', {
      column: 3,
    })
  })

  it('exposes ActionRejected as a dedicated subscription', () => {
    const client = new MatchHubClient({
      hubUrl: 'http://localhost:5045/hubs/game',
      matchId: 42,
      accessTokenFactory: () => 'current-token',
    })
    const onRejected = vi.fn<(reason: string) => void>()

    client.onActionRejected(onRejected)

    expect(signalRMocks.connection.on).toHaveBeenCalledWith('ActionRejected', onRejected)
  })
})
