import {
  type AutorouterOptions,
  TscircuitAutorouter,
} from "./CapacityMeshAutorouter"
import type { GenericLocalAutorouter } from "./GenericLocalAutorouter"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "./getPresetAutoroutingConfig"

export interface LocalAutorouterStrategyContext {
  simpleRouteJson: SimpleRouteJson
  commonAutorouterOptions: AutorouterOptions
}

export interface LocalAutorouterStrategy {
  cacheable: boolean
  create: (context: LocalAutorouterStrategyContext) => GenericLocalAutorouter
}

const defaultLocalAutorouterStrategy: LocalAutorouterStrategy = {
  cacheable: true,
  create: ({ simpleRouteJson, commonAutorouterOptions }) =>
    new TscircuitAutorouter(simpleRouteJson, commonAutorouterOptions),
}

const localAutorouterStrategies = new Map<string, LocalAutorouterStrategy>()

export const getLocalAutorouterStrategy = (
  preset: NormalizedAutorouterConfig["preset"],
): LocalAutorouterStrategy =>
  localAutorouterStrategies.get(preset ?? "") ?? defaultLocalAutorouterStrategy
