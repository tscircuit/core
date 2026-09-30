import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import type { DogboneFanoutSolverInput } from "lib/utils/autorouting/DogboneFanoutSolver"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import type { Breakout } from "./Breakout"

/** Prepare connectivity for local pad-to-via escapes in right-handed board-world mm (+X right,
 * +Y up, +Z above). All coordinates are points. Uses emitted pad geometry, so
 * footprint rotation/reflection is already applied by core's layout transforms.
 * Provisional handoffs stay at source pads until the routing phase solves. */
export function prepareDogboneFanout(
  breakout: Breakout,
): DogboneFanoutSolverInput {
  const points = breakout.children.filter(
    (child): child is AutoplacedBreakoutPoint =>
      child instanceof AutoplacedBreakoutPoint,
  )
  const { db } = breakout.root!
  const scope = breakout.getSubcircuit()
  const traceWidth = Number(
    breakout.getInheritedProperty("minTraceWidth") ?? 0.15,
  )
  const clearance = Number(
    breakout.getInheritedProperty("minTraceToPadEdgeClearance") ?? 0.1,
  )
  const viaDiameter = Number(
    breakout.getInheritedProperty("minViaPadDiameter") ?? 0.6,
  )
  const holeDiameter = Number(
    breakout.getInheritedProperty("minViaHoleDiameter") ?? 0.3,
  )
  const viaClearance = Number(
    breakout.getInheritedProperty("minViaEdgeToPadEdgeClearance") ?? clearance,
  )
  const boardEdgeClearance = Number(
    breakout.getInheritedProperty("minBoardEdgeClearance") ?? clearance,
  )
  const holeClearance = Number(
    breakout.getInheritedProperty("minViaHoleEdgeToViaHoleEdgeClearance") ??
      clearance,
  )
  const { simpleRouteJson: input } = getSimpleRouteJsonFromCircuitJson({
    db,
    subcircuit_id: scope.subcircuit_id,
    subcircuitComponent: scope,
    minTraceWidth: traceWidth,
  })
  // Provisional handoffs establish phase connectivity; no sites are solved here.
  const layers = getViaBoardLayers(input.layerCount)
  for (const point of points) {
    const port = db.pcb_port.get(point.matchedPort!.pcb_port_id!)!
    const layer =
      (breakout._parsedProps.fanoutRoutingLayers ?? layers).find(
        (layer) => !port.layers.includes(layer),
      ) ?? port.layers[0]!
    point._applySolvedBreakoutPoint({
      sourceTraceId: point.matchedSourceTraceId!,
      layer,
      position: port,
    })
  }
  return {
    input,
    sources: points.map((point) => ({
      port: db.pcb_port.get(point.matchedPort!.pcb_port_id!)!,
      sourceTraceId: point.matchedSourceTraceId!,
    })),
    fanoutRoutingLayers: breakout._parsedProps.fanoutRoutingLayers,
    traceWidth,
    clearance,
    viaDiameter,
    holeDiameter,
    viaClearance,
    boardEdgeClearance,
    holeClearance,
  }
}
