import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { RootCircuit } from "lib/RootCircuit"
import type { SolverName } from "lib/solvers"
import type { AnyCircuitElement } from "circuit-json"
import type {
  AutoroutingStartEvent,
  AutoroutingEndEvent,
  AutoroutingErrorEvent,
  SolverStartedEvent,
  SolverEndedEvent,
} from "lib/events"
import type { BusLanesSolverStarted } from "lib/utils/autorouting/BusLanesAutorouter"
import { H3RoutingPhaseIntentBoard, type NativeH3Source } from "./board"

export interface H3RoutingStage {
  start: AutoroutingStartEvent
  end?: AutoroutingEndEvent
  error?: AutoroutingErrorEvent
  observedBusInput?: BusLanesSolverStarted["solverParams"]
  announcedConstructorInputMatches?: boolean
  solverEnded?: SolverEndedEvent
  /** Actual constructor/end observations during this routing phase; no geometry. */
  solverEvents?: Pick<
    SolverStartedEvent | SolverEndedEvent,
    "type" | "solverName" | "componentName"
  >[]
}

export const NATIVE_H3_FIXTURE_SHA256 =
  "5eb3790b04c95ea93001e979bc8d4823b43573532d899a94588a946a5176a209"

export const loadNativeH3Source = (): NativeH3Source => {
  const fixtureBytes = readFileSync(
    new URL("./source.json.gz", import.meta.url),
  )
  if (
    createHash("sha256").update(fixtureBytes).digest("hex") !==
    NATIVE_H3_FIXTURE_SHA256
  ) {
    throw new Error("The pinned native H3 source fixture has changed")
  }
  return JSON.parse(gunzipSync(fixtureBytes).toString("utf8"))
}

/** Physical native geometry in board-world mm, +X right, +Y up, +Z above.
 * Capture only immutable substrate/components/pads/holes, before routing starts.
 */
export const getNativeH3Geometry = (circuitJson: AnyCircuitElement[]) =>
  circuitJson.filter((element) =>
    [
      "pcb_board",
      "pcb_component",
      "pcb_smtpad",
      "pcb_plated_hole",
      "pcb_hole",
    ].includes(element.type),
  )

/** Run the same native TSX through its real bus/bus/auto_local adapters.
 * Every SRJ is a snapshot of board-world points in mm, +X right, +Y up.
 * No callback replaces routing and no captured result is fed back to a router.
 */
export const runNativeH3Routing = async (circuit: RootCircuit) => {
  const source = loadNativeH3Source()
  const stages: H3RoutingStage[] = []
  const solverNames: SolverName[] = []
  let activeStage: H3RoutingStage | undefined
  let initialGeometry: AnyCircuitElement[] = []
  let initialCircuitJson: AnyCircuitElement[] = []
  const started = performance.now()
  circuit.on("autorouting:start", (event) => {
    if (stages.length === 0) {
      initialCircuitJson = structuredClone(circuit.getCircuitJson())
      initialGeometry = structuredClone(getNativeH3Geometry(initialCircuitJson))
    }
    if (activeStage)
      throw new Error(
        "H3 routing phase started before its previous phase ended",
      )
    activeStage = { start: structuredClone(event), solverEvents: [] }
    stages.push(activeStage)
  })
  circuit.on("solver:started", (event) => {
    solverNames.push(event.solverName)
    if (!activeStage) {
      // The native board performs real layout before its three routing phases.
      // Retain it in the complete timeline; do not filter unknown solvers away.
      if (event.solverName !== "LayoutPipelineSolver" || stages.length !== 0)
        throw new Error("H3 solver started outside its routing phase")
      return
    }
    const solverEvents = (activeStage.solverEvents ??= [])
    solverEvents.push({
      type: event.type,
      solverName: event.solverName,
      componentName: event.componentName,
    })
    if (event.solverName !== "BusLanesPipelineSolver") return
    activeStage.observedBusInput = structuredClone(event.solverParams)
    activeStage.announcedConstructorInputMatches =
      JSON.stringify(event.solverConstructorArgs[0]) ===
      JSON.stringify(event.solverParams)
  })
  circuit.on("solver:ended", (event) => {
    if (!activeStage) {
      if (event.solverName !== "LayoutPipelineSolver" || stages.length !== 0)
        throw new Error("H3 solver ended outside its routing phase")
      return
    }
    const solverEvents = (activeStage.solverEvents ??= [])
    solverEvents.push({
      type: event.type,
      solverName: event.solverName,
      componentName: event.componentName,
    })
    if (event.solverName === "BusLanesPipelineSolver")
      activeStage.solverEnded = structuredClone(event)
  })
  circuit.on("autorouting:end", (event) => {
    if (!activeStage) throw new Error("H3 routing ended without a phase start")
    activeStage.end = structuredClone(event)
    activeStage = undefined
  })
  circuit.on("autorouting:error", (event) => {
    if (!activeStage) throw new Error("H3 routing failed without a phase start")
    activeStage.error = structuredClone(event)
    activeStage = undefined
  })
  circuit.add(<H3RoutingPhaseIntentBoard source={source} />)
  let renderError: string | undefined
  try {
    await circuit.renderUntilSettled()
  } catch (error) {
    renderError = error instanceof Error ? error.message : String(error)
  }
  return {
    circuit,
    source,
    stages,
    solverNames,
    initialGeometry,
    initialCircuitJson,
    circuitJson: circuit.getCircuitJson(),
    renderMs: performance.now() - started,
    renderError,
  }
}
