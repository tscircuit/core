import {
  SchematicTracePipelineSolver,
  type InputChip,
  type InputProblem,
} from "@tscircuit/schematic-trace-solver"
import type {
  SchematicComponent,
  SchematicPort,
  SchematicTrace,
} from "circuit-json"
import type { Obstacle } from "lib/utils/autorouting/SimpleRouteJson"
import { convertFacingDirectionToElbowDirection } from "./convertFacingDirectionToElbowDirection"

/**
 * Route consecutive terminals in schematic world coordinates (right-handed XY,
 * +X right, +Y up, millimetres). Centers and path vertices are points; pin
 * facing is a direction. Keep the legacy obstacle geometry and trace ordering.
 */
export const routeLegacySchematicTrace = ({
  ports,
  obstacles,
}: {
  ports: Array<{
    schematicPort: SchematicPort
    schematicComponent: SchematicComponent | undefined
  }>
  obstacles: Obstacle[]
}): SchematicTrace["edges"] | null => {
  const chips: InputChip[] = obstacles.map((obstacle, obstacleIndex) => ({
    chipId: `obstacle_${obstacleIndex}`,
    center: { ...obstacle.center },
    width: obstacle.width,
    height: obstacle.height,
    pins: [],
  }))
  const pins = ports.map(({ schematicPort, schematicComponent }, portIndex) => {
    // Component rectangles precede their ports in the legacy obstacle list.
    // Match the actual component center, retaining the legacy symbol shrinkage.
    let chip = schematicComponent
      ? chips.find(
          (candidate) =>
            candidate.center.x === schematicComponent.center.x &&
            candidate.center.y === schematicComponent.center.y,
        )
      : undefined
    if (!chip) {
      chip = {
        chipId: `terminal_${portIndex}`,
        center: { ...schematicPort.center },
        width: 0,
        height: 0,
        pins: [],
      }
      chips.push(chip)
    }
    const pin = {
      pinId: schematicPort.schematic_port_id,
      chipId: chip.chipId,
      ...schematicPort.center,
      _facingDirection: convertFacingDirectionToElbowDirection(
        schematicPort.facing_direction ?? null,
      ),
    }
    chip.pins.push(pin)
    return pin
  })
  const edges: SchematicTrace["edges"] = []
  for (let portIndex = 0; portIndex < pins.length - 1; portIndex++) {
    const start = pins[portIndex]
    const end = pins[portIndex + 1]
    const inputProblem: InputProblem = {
      chips,
      directConnections: [{ pinIds: [start.pinId, end.pinId] }],
      netConnections: [],
      availableNetLabelOrientations: {},
      maxMspPairDistance: Math.hypot(end.x - start.x, end.y - start.y) + 1,
    }
    // Legacy rendering owns crossings/junctions and label fallback. Run the
    // maintained obstacle router and its recovery stage, not label placement.
    const solver = new SchematicTracePipelineSolver(inputProblem)
    solver.solveUntilPhase("traceOverlapShiftSolver")
    const traces =
      solver.unroutedTraceRecoverySolver?.getOutput().allTracesMerged
    const trace = traces?.find(
      (trace) =>
        trace.pins.some((pin) => pin.pinId === start.pinId) &&
        trace.pins.some((pin) => pin.pinId === end.pinId),
    )
    let path = trace?.tracePath
    if (solver.failed || !path || path.length < 2) return null
    const samePoint = (
      a: { x: number; y: number },
      b: { x: number; y: number },
    ) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6
    if (samePoint(path[0], end) && samePoint(path[path.length - 1], start)) {
      path = [...path].reverse()
    }
    // The pipeline may correct pins inside chip bodies. Never silently accept
    // a route whose endpoints no longer coincide with the actual Core ports.
    if (!samePoint(path[0], start) || !samePoint(path[path.length - 1], end))
      return null
    if (
      path.some(
        (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
      )
    )
      return null
    if (
      path.some(
        (point, index) =>
          index > 0 &&
          Math.abs(point.x - path![index - 1].x) > 1e-6 &&
          Math.abs(point.y - path![index - 1].y) > 1e-6,
      )
    )
      return null
    for (let pathIndex = 0; pathIndex < path.length - 1; pathIndex++) {
      edges.push({ from: path[pathIndex], to: path[pathIndex + 1] })
    }
  }
  return edges.length > 0 ? edges : null
}
