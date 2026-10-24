// El backend serializa los enums como números (System.Text.Json por defecto).
const GameHostingMode = {
  InProcess: 0,
  ExternalService: 1,
} as const

type GameHostingMode = (typeof GameHostingMode)[keyof typeof GameHostingMode]

const ConfigurationDataType = {
  Boolean: 0,
  Integer: 1,
  String: 2,
  Select: 3,
} as const

type ConfigurationDataType = (typeof ConfigurationDataType)[keyof typeof ConfigurationDataType]

interface ConfigurationOptionDto {
  id: number
  name: string
  displayName: string
  description: string | null
}

interface GameConfigurationDto {
  id: number
  configId: number
  name: string
  displayName: string
  description: string | null
  required: boolean
  defaultValue: string | null
  dataType: ConfigurationDataType
  options: ConfigurationOptionDto[]
}

interface GameDto {
  id: number
  name: string
  displayName: string
  slug: string
  description: string
  instructions: string
  minPlayers: number
  maxPlayers: number | null
  /** TimeSpan serializado por el backend, por ejemplo "00:15:00". */
  maxDuration: string | null
  version: number
  gameModule: string
  hostingMode: GameHostingMode
  externalEndpoint: string | null
  hidden: boolean
  createdAt: string
  configurations: GameConfigurationDto[]
}

export { ConfigurationDataType, GameHostingMode }
export type { ConfigurationOptionDto, GameConfigurationDto, GameDto }
