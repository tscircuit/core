import { PostProcessingSolver } from "@tscircuit/length-matching-solver"
import type { PcbTrace } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getExistingSimplifiedPcbTracesForReroute } from "../primitive-components/Group/region-replacement"
import type { Board } from "./Board"

export const Board_doDifferentialPairSolver = (board: Board) => {
  if (
    board.root?.pcbDisabled ||
    board.root?.pcbRoutingDisabled ||
    board.getInheritedProperty("routingDisabled") ||
    board._hasIncompleteAsyncEffectsInSubtreeForPhase("PcbTraceRender")
  )
    return

  const { db } = board.root!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: db.toArray().filter((element) => element.type !== "pcb_trace"),
    subcircuitComponent: board,
  })
  const differentialPairs = simpleRouteJson.differentialPairs
  if (!differentialPairs?.length) return

  const connectionNames = new Set(
    differentialPairs.flatMap((pair) => pair.connectionNames),
  )
  const traces = getExistingSimplifiedPcbTracesForReroute(board).flatMap(
    (trace) =>
      trace.connection_name && connectionNames.has(trace.connection_name)
        ? [{ ...trace, connection_name: trace.connection_name }]
        : [],
  )
  if (traces.length !== connectionNames.size) return

  const solver = new PostProcessingSolver({
    traces,
    differentialPairs,
    obstacles: simpleRouteJson.obstacles,
    bounds: simpleRouteJson.bounds,
    layerCount: simpleRouteJson.layerCount,
    routingGrid: {
      innerGridStep: 1,
      outerGridStep: 4,
      outerPerimeterWidth: 4,
    },
  })
  try {
    solver.solve()
  } catch {
    return
  }

  board._asyncAutoroutingResult = {
    output_pcb_traces: solver.getOutput().traces as PcbTrace[],
  }
  board._updatePcbTraceRenderFromPcbTraces()
  board._asyncAutoroutingResult = null
}
