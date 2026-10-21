import {
  SignalRConnection,
  type AccessTokenFactory,
  type JsonValue,
  type RealtimeConnectionStatus,
  type RealtimeStatusListener,
} from './signalRConnection'

export interface MatchHubClientOptions {
  hubUrl: string
  matchId: number
  accessTokenFactory: AccessTokenFactory
}

export interface MatchEndedEvent {
  winner: JsonValue
  [key: string]: JsonValue
}

/**
 * Contrato cliente del `MatchHub` de la API.
 * El hub requiere el identificador de partida al conectar y recibe las acciones
 * mediante `SendAction(actionType, payload)`.
 */
export class MatchHubClient<TState extends JsonValue = JsonValue> {
  private readonly connection: SignalRConnection

  constructor({ hubUrl, matchId, accessTokenFactory }: MatchHubClientOptions) {
    if (!Number.isSafeInteger(matchId) || matchId <= 0) {
      throw new RangeError('matchId debe ser un entero positivo.')
    }

    const url = new URL(hubUrl)
    url.searchParams.set('matchId', String(matchId))

    this.connection = new SignalRConnection({
      url: url.toString(),
      accessTokenFactory,
    })
  }

  get status(): RealtimeConnectionStatus {
    return this.connection.status
  }

  connect(): Promise<void> {
    return this.connection.connect()
  }

  disconnect(): Promise<void> {
    return this.connection.disconnect()
  }

  sendAction(actionType: string, payload: JsonValue): Promise<null> {
    return this.connection.invoke('SendAction', actionType, payload)
  }

  onStateUpdated(handler: (state: TState) => void): () => void {
    return this.connection.on<[TState]>('StateUpdated', handler)
  }

  onActionRejected(handler: (reason: string) => void): () => void {
    return this.connection.on<[string]>('ActionRejected', handler)
  }

  onMatchEnded(handler: (event: MatchEndedEvent) => void): () => void {
    return this.connection.on<[MatchEndedEvent]>('MatchEnded', handler)
  }

  onStatusChange(listener: RealtimeStatusListener): () => void {
    return this.connection.onStatusChange(listener)
  }
}
