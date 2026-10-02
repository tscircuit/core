import { DogboneAutorouter } from "@tscircuit/dogbone-solver"
import type { SolverEndedEvent } from "lib/events"
import { BusLanesAutorouter } from "./BusLanesAutorouter"
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
  onSolverEnded?: (
    event: Omit<SolverEndedEvent, "type" | "componentName">,
  ) => void
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
  /** Keep completed copper fixed in subsequent routing stages. */
  preserveOutputTraces?: boolean
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
  [
    "dogbone",
    {
      name: "dogbone",
      preserveOutputTraces: true,
      followUpAutorouter: "default",
      cacheable: false,
      getSolverName: () => "DogboneFanoutSolver",
      create: ({
        simpleRouteJson,
        fanoutRoutingLayers,
        onSolverStarted,
        onSolverEnded,
      }) => {
        return new DogboneAutorouter(
          { input: simpleRouteJson, fanoutRoutingLayers },
          { onSolverStarted, onSolverEnded },
        )
      },
    },
  ],
  [
    "bus_lanes",
    {
      name: "bus_lanes",
      cacheable: false,
      getSolverName: () => "BusLanesPipelineSolver",
      create: ({ simpleRouteJson, onSolverStarted }) => {
        onSolverStarted?.({
          solverName: "BusLanesPipelineSolver",
          solverParams: simpleRouteJson,
          solverConstructorArgs: [simpleRouteJson],
        })
        return new BusLanesAutorouter(simpleRouteJson)
      },
    },
  ],
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

  // A custom algorithm returns final traces and may omit a transformed SRJ.
  // Only the built-in preset supplies the problem for its follow-up stage.
  if (strategy.followUpAutorouter && !autorouterConfig.algorithmFn) {
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
