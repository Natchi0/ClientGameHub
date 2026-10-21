import {
  SignalRConnection,
  type AccessTokenFactory,
  type JsonValue,
  type RealtimeConnectionStatus,
  type RealtimeEventHandler,
  type RealtimeStatusListener,
} from './signalRConnection'

export interface RealtimeHubClientOptions {
  hubUrl: string
  accessTokenFactory: AccessTokenFactory
}

export class RealtimeHubClient {
  private readonly connection: SignalRConnection

  constructor({ hubUrl, accessTokenFactory }: RealtimeHubClientOptions) {
    this.connection = new SignalRConnection({
      url: hubUrl,
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

  on<TArgs extends readonly JsonValue[]>(
    eventName: string,
    handler: RealtimeEventHandler<TArgs>,
  ): () => void {
    return this.connection.on(eventName, handler)
  }

  onStatusChange(listener: RealtimeStatusListener): () => void {
    return this.connection.onStatusChange(listener)
  }
}
