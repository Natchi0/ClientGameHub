import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting'

export type AccessTokenFactory = () => string | Promise<string>

export interface SignalRConnectionOptions {
  url: string
  accessTokenFactory: AccessTokenFactory
  reconnectDelays?: number[]
}

export type RealtimeStatusListener = (status: RealtimeConnectionStatus) => void
export type RealtimeEventHandler<TArgs extends readonly JsonValue[]> = (...args: TArgs) => void
export type JsonValue =
  boolean | null | number | string | JsonValue[] | { [key: string]: JsonValue }

/**
 * Encapsula el ciclo de vida y las suscripciones de una conexión SignalR.
 * Los hubs de dominio deben exponer una API tipada sobre esta clase en vez de
 * invocar métodos o eventos SignalR directamente desde los componentes.
 */
export class SignalRConnection {
  private readonly connection: HubConnection
  private readonly statusListeners = new Set<RealtimeStatusListener>()
  private connecting: Promise<void> | null = null

  constructor({ url, accessTokenFactory, reconnectDelays }: SignalRConnectionOptions) {
    const builder = new HubConnectionBuilder()
      .withUrl(url, { accessTokenFactory })
      .configureLogging(LogLevel.Warning)

    this.connection = reconnectDelays
      ? builder.withAutomaticReconnect(reconnectDelays).build()
      : builder.withAutomaticReconnect().build()

    this.connection.onreconnecting(() => this.emitStatus('reconnecting'))
    this.connection.onreconnected(() => this.emitStatus('connected'))
    this.connection.onclose(() => this.emitStatus('disconnected'))
  }

  get status(): RealtimeConnectionStatus {
    switch (this.connection.state) {
      case HubConnectionState.Connected:
        return 'connected'
      case HubConnectionState.Connecting:
        return 'connecting'
      case HubConnectionState.Reconnecting:
        return 'reconnecting'
      default:
        return 'disconnected'
    }
  }

  async connect(): Promise<void> {
    if (this.status === 'connected') return
    if (this.connecting) return this.connecting

    this.emitStatus('connecting')
    this.connecting = this.connection
      .start()
      .then(() => this.emitStatus('connected'))
      .finally(() => {
        this.connecting = null
      })
    return this.connecting
  }

  async disconnect(): Promise<void> {
    if (this.status === 'disconnected') return
    await this.connection.stop()
  }

  async invoke<TResult extends JsonValue = null>(
    methodName: string,
    ...args: JsonValue[]
  ): Promise<TResult> {
    return this.connection.invoke<TResult>(methodName, ...args)
  }

  on<TArgs extends readonly JsonValue[]>(
    eventName: string,
    handler: RealtimeEventHandler<TArgs>,
  ): () => void {
    this.connection.on(eventName, handler)
    return () => this.connection.off(eventName, handler)
  }

  onStatusChange(listener: RealtimeStatusListener): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  private emitStatus(status: RealtimeConnectionStatus) {
    for (const listener of this.statusListeners) listener(status)
  }
}
