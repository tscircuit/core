import type {
  AutorouterProp,
  AutoroutingPhaseProps,
  PlatformConfig,
} from "@tscircuit/props"
import type { SolverName } from "lib/solvers"
import {
  type AutorouterOptions,
  TscircuitAutorouter,
  getAutorouterSolverName,
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
  fanoutBounds?: SimpleRouteBounds
  fanoutRoutingLayers?: string[]
  allowBlindAndBuriedVias?: boolean
  componentNamesById?: ReadonlyMap<string, string>
  onSolverStarted?: (details: {
    solverName: SolverName
    solverParams: unknown
    solverConstructorArgs: readonly unknown[]
  }) => void
}

export interface LocalAutorouterStrategy {
  name: string
  cacheable: boolean
  followUpAutorouter?: AutorouterProp
  getSolverName: (options: AutorouterOptions) => SolverName
  create: (context: LocalAutorouterStrategyContext) => GenericLocalAutorouter
}

export interface LocalAutoroutingStage {
  autorouterConfig: NormalizedAutorouterConfig
  strategy: LocalAutorouterStrategy
  usesPreviousStageOutput: boolean
}

const createTscircuitAutorouterStrategy = (
  name: string,
  strategyOptions: Pick<AutorouterOptions, "useTraceSimplificationSolver">,
): LocalAutorouterStrategy => ({
  name,
  cacheable: true,
  getSolverName: (options) =>
    getAutorouterSolverName({ ...options, ...strategyOptions }),
  create: ({ simpleRouteJson, commonAutorouterOptions, onSolverStarted }) =>
    new TscircuitAutorouter(simpleRouteJson, {
      ...commonAutorouterOptions,
      ...strategyOptions,
      onSolverStarted: (details) =>
        onSolverStarted?.({
          ...details,
          solverConstructorArgs: [details.solverParams],
        }),
    }),
})

const defaultLocalAutorouterStrategy = createTscircuitAutorouterStrategy(
  "tscircuit",
  {},
)
const simplificationLocalAutorouterStrategy = createTscircuitAutorouterStrategy(
  "tscircuit_simplify",
  { useTraceSimplificationSolver: true },
)

const createFanoutAutorouterStrategy = (
  mode: FanoutAutorouterMode,
): LocalAutorouterStrategy => ({
  name: mode,
  cacheable: false,
  followUpAutorouter: "default",
  getSolverName: () => "FanoutSolver",
  create: ({
    simpleRouteJson,
    busFanoutDirections,
    fanoutBounds,
    fanoutRoutingLayers,
    allowBlindAndBuriedVias,
    componentNamesById,
    onSolverStarted,
  }) =>
    new FanoutAutorouter(simpleRouteJson, {
      mode,
      busFanoutDirections,
      fanoutBounds,
      fanoutRoutingLayers,
      allowBlindAndBuriedVias,
      componentNamesById,
      onSolverStarted,
    }),
})

const localAutorouterStrategies = new Map<string, LocalAutorouterStrategy>([
  [
    "single_layer_fanout",
    createFanoutAutorouterStrategy("single_layer_fanout"),
  ],
  ["fanout", createFanoutAutorouterStrategy("fanout")],
  ["simplify", simplificationLocalAutorouterStrategy],
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
