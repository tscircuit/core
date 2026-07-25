import type { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"

const MAX_LONG_DISTANCE_DETOUR_RATIO = 1.5
const LENGTH_EPSILON = 1e-6

type SolvedSchematicTracePath = {
  pins: Array<{ pinId: string; x: number; y: number }>
  tracePath: Array<{ x: number; y: number }>
}

const getPinPairKey = (pinIds: string[]) => [...pinIds].sort().join("::")

const getOrthogonalPathLength = (points: Array<{ x: number; y: number }>) => {
  let length = 0
  for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
    const point = points[pointIndex]!
    const nextPoint = points[pointIndex + 1]!
    length += Math.abs(nextPoint.x - point.x) + Math.abs(nextPoint.y - point.y)
  }
  return length
}

/**
 * LongDistancePairSolver may recover an unnamed direct connection that the
 * primary routing pass intentionally excluded because its endpoints exceed
 * maxMspPairDistance. Keep a reasonably direct recovered route, but reject a
 * large detour so core can render its endpoints with readable fallback labels.
 */
const isExcessiveLongDistanceDetour = (
  trace: SolvedSchematicTracePath,
  maxMspPairDistance: number | undefined,
  anonymousDirectConnectionPinPairKeys: Set<string>,
) => {
  if (maxMspPairDistance === undefined || trace.pins.length !== 2) return false
  if (
    !anonymousDirectConnectionPinPairKeys.has(
      getPinPairKey(trace.pins.map((pin) => pin.pinId)),
    )
  ) {
    return false
  }

  const [firstPin, secondPin] = trace.pins
  const directDistance = Math.hypot(
    secondPin.x - firstPin.x,
    secondPin.y - firstPin.y,
  )
  if (directDistance <= maxMspPairDistance + LENGTH_EPSILON) return false

  const minimumOrthogonalLength =
    Math.abs(secondPin.x - firstPin.x) + Math.abs(secondPin.y - firstPin.y)
  if (minimumOrthogonalLength <= LENGTH_EPSILON) return false

  const routedLength = getOrthogonalPathLength(trace.tracePath)
  return (
    routedLength >
    minimumOrthogonalLength * MAX_LONG_DISTANCE_DETOUR_RATIO + LENGTH_EPSILON
  )
}

export const getTracesFromSolverOutput = (
  solver: SchematicTracePipelineSolver,
) => {
  const traces =
    solver.netLabelTraceCollisionSolver?.getOutput().traces ??
    solver.traceCleanupSolver?.getOutput().traces ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().traces ??
    solver.schematicTraceLinesSolver?.solvedTracePaths ??
    []
  const anonymousDirectConnectionPinPairKeys = new Set(
    solver.inputProblem.directConnections
      .filter((connection) => connection.netId?.startsWith("."))
      .map((connection) =>
        getPinPairKey(connection.pinIds.map((pinId) => String(pinId))),
      ),
  )

  return traces.filter(
    (trace) =>
      !isExcessiveLongDistanceDetour(
        trace,
        solver.inputProblem.maxMspPairDistance,
        anonymousDirectConnectionPinPairKeys,
      ),
  )
}
