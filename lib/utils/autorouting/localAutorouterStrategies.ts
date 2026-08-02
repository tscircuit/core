import type {
  AutorouterProp,
  AutoroutingPhaseProps,
  PlatformConfig,
} from "@tscircuit/props"
import {
  type AutorouterOptions,
  TscircuitAutorouter,
} from "./CapacityMeshAutorouter"
import { FanoutAutorouter, type FanoutAutorouterMode } from "./FanoutAutorouter"
import type { GenericLocalAutorouter } from "./GenericLocalAutorouter"
import type { SimpleRouteBounds, SimpleRouteJson } from "./SimpleRouteJson"
import {
  type NormalizedAutorouterConfig,
  getPresetAutoroutingConfig,
} from "./getPresetAutoroutingConfig"

export interface LocalAutorouterStrategyContext {
  simpleRouteJson: SimpleRouteJson
  commonAutorouterOptions: AutorouterOptions
  busFanoutDirections?: AutoroutingPhaseProps["busFanoutDirections"]
  fanoutBoundary?: SimpleRouteBounds
  fanoutBoundaryPadding?: AutoroutingPhaseProps["fanoutBoundaryPadding"]
  fanoutRoutingLayers?: string[]
}

export interface LocalAutorouterStrategy {
  cacheable: boolean
  followUpAutorouter?: AutorouterProp
  create: (context: LocalAutorouterStrategyContext) => GenericLocalAutorouter
}

export interface LocalAutoroutingStage {
  autorouterConfig: NormalizedAutorouterConfig
  strategy: LocalAutorouterStrategy
  usesPreviousStageOutput: boolean
}

const defaultLocalAutorouterStrategy: LocalAutorouterStrategy = {
  cacheable: true,
  create: ({ simpleRouteJson, commonAutorouterOptions }) =>
    new TscircuitAutorouter(simpleRouteJson, commonAutorouterOptions),
}

const createFanoutAutorouterStrategy = (
  mode: FanoutAutorouterMode,
): LocalAutorouterStrategy => ({
  cacheable: false,
  followUpAutorouter: "default",
  create: ({
    simpleRouteJson,
    busFanoutDirections,
    fanoutBoundary,
    fanoutBoundaryPadding,
    fanoutRoutingLayers,
  }) =>
    new FanoutAutorouter(simpleRouteJson, {
      mode,
      busFanoutDirections,
      fanoutBoundary,
      fanoutBoundaryPadding,
      fanoutRoutingLayers,
    }),
})

const localAutorouterStrategies = new Map<string, LocalAutorouterStrategy>([
  [
    "single_layer_fanout",
    createFanoutAutorouterStrategy("single_layer_fanout"),
  ],
  ["fanout", createFanoutAutorouterStrategy("fanout")],
])

export const getLocalAutorouterStrategy = (
  preset: NormalizedAutorouterConfig["preset"],
): LocalAutorouterStrategy =>
  localAutorouterStrategies.get(preset ?? "") ?? defaultLocalAutorouterStrategy

export const getLocalAutoroutingStages = (
  autorouterConfig: NormalizedAutorouterConfig,
  platformConfig?: PlatformConfig,
): LocalAutoroutingStage[] => {
  const strategy = getLocalAutorouterStrategy(autorouterConfig.preset)
  const stages: LocalAutoroutingStage[] = [
    {
      autorouterConfig,
      strategy,
      usesPreviousStageOutput: false,
    },
  ]

  if (strategy.followUpAutorouter) {
    const followUpAutorouterConfig = getPresetAutoroutingConfig(
      strategy.followUpAutorouter,
      platformConfig,
    )
    stages.push({
      autorouterConfig: followUpAutorouterConfig,
      strategy: getLocalAutorouterStrategy(followUpAutorouterConfig.preset),
      usesPreviousStageOutput: true,
    })
  }

  return stages
}
