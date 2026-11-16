import {
  SchematicTracePipelineSolver,
  type InputChip,
  type InputProblem,
} from "@tscircuit/schematic-trace-solver"
import type { Point } from "@tscircuit/math-utils"
import type {
  SchematicComponent,
  SchematicPort,
  SchematicTrace,
} from "circuit-json"
import type { Obstacle } from "lib/utils/autorouting/SimpleRouteJson"
import { convertFacingDirectionToElbowDirection } from "./convertFacingDirectionToElbowDirection"

const samePoint = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6

const isOrthogonalSegment = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) <= 1e-6 || Math.abs(a.y - b.y) <= 1e-6

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
    // Legacy rendering handles crossings, junctions and label fallback.
    const solver = new SchematicTracePipelineSolver(inputProblem)
    solver.solveUntilPhase("traceOverlapShiftSolver")
    const traces =
      solver.unroutedTraceRecoverySolver?.getOutput().allTracesMerged
    const trace = traces?.find(
      (trace) =>
        trace.pins.some((pin) => pin.pinId === start.pinId) &&
        trace.pins.some((pin) => pin.pinId === end.pinId),
    )
    const routedPath = trace?.tracePath
    if (solver.failed || !routedPath || routedPath.length < 2) return null
    const path =
      samePoint(routedPath[0], end) &&
      samePoint(routedPath[routedPath.length - 1], start)
        ? [...routedPath].reverse()
        : routedPath
    // Reject endpoints moved by the solver's pin correction.
    if (!samePoint(path[0], start) || !samePoint(path[path.length - 1], end))
      return null
    if (
      path.some(
        (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
      )
    )
      return null
    for (let pathIndex = 0; pathIndex < path.length - 1; pathIndex++) {
      const from = path[pathIndex]
      const to = path[pathIndex + 1]
      if (!isOrthogonalSegment(from, to)) return null
      edges.push({ from, to })
    }
  }
  return edges.length > 0 ? edges : null
}
