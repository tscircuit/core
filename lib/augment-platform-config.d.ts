import type { LocalCacheEngine } from "./local-cache-engine"

declare module "@tscircuit/props" {
  interface PlatformConfig {
    localCacheEngine?: LocalCacheEngine
    pcbDisabled?: boolean
    schematicDisabled?: boolean
    partsEngineDisabled?: boolean
  }
}
