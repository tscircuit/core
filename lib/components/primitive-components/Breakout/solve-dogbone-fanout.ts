import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { DogboneFanoutSolver } from "lib/utils/autorouting/DogboneFanoutSolver"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import type { Breakout } from "./Breakout"

/** Solve local pad-to-via escapes in right-handed board-world mm (+X right,
 * +Y up, +Z above). All coordinates are points. Uses emitted pad geometry, so
 * footprint rotation/reflection is already applied by core's layout transforms.
 * Handoff points are committed only after the complete assignment is valid. */
export function solveDogboneFanout(breakout: Breakout): SimplifiedPcbTrace[] {
  const points = breakout.children.filter(
    (child): child is AutoplacedBreakoutPoint =>
      child instanceof AutoplacedBreakoutPoint,
  )
  if (!points.length) return []
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
  const solver = new DogboneFanoutSolver({
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
  })
  const root = breakout.root!
  const componentName = breakout.getString()
  root.emit("solver:started", {
    type: "solver:started",
    solverName: "DogboneFanoutSolver",
    solverParams: solver.params,
    solverConstructorArgs: solver.getConstructorParams(),
    componentName,
  })
  while (!solver.solved && !solver.failed) {
    solver.step()
    root.emit("autorouting:progress", {
      type: "autorouting:progress",
      solverName: "DogboneFanoutSolver",
      subcircuit_id: scope.subcircuit_id!,
      componentDisplayName: componentName,
      phaseName: `dogbone:${solver.phase}`,
      progress: solver.progress,
      debugGraphics: solver.visualize(),
    })
  }
  root.emit("solver:ended", {
    type: "solver:ended",
    solverName: "DogboneFanoutSolver",
    componentName,
    solved: solver.solved,
    failed: solver.failed,
    iterations: solver.iterations,
    error: solver.error,
  })
  if (solver.failed) throw new Error(solver.error ?? "Dogbone fanout failed")
  const traces = solver.getOutput()
  for (const [index, point] of points.entries()) {
    const exit = traces[index]!.route.at(-1)!
    if (exit.route_type !== "wire")
      throw new Error("Dogbone handoff must be a wire endpoint")
    point._applySolvedBreakoutPoint({
      sourceTraceId: point.matchedSourceTraceId!,
      layer: exit.layer,
      position: exit,
    })
  }
  return traces
}
