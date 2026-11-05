import type {
  NetLabelPlacement,
  SchematicTracePipelineSolver,
} from "@tscircuit/schematic-trace-solver"
import type { AxisDirection } from "./getSide"

const getSolverTraces = (solver: SchematicTracePipelineSolver) =>
  solver.inlineNetLabelSolver?.getOutput().traces ??
  solver.sameNetJunctionAlignmentSolver?.getOutput().traces ??
  solver.netLabelTraceCollisionSolver?.getOutput().traces ??
  solver.traceCleanupSolver?.getOutput().traces ??
  solver.traceLabelOverlapAvoidanceSolver?.getOutput().traces ??
  solver.schematicTraceLinesSolver?.solvedTracePaths ??
  []

export function getEffectiveNetLabelPlacements(
  solver: SchematicTracePipelineSolver,
): {
  netLabelPlacements: NetLabelPlacement[]
  fallbackConnectorEdgesByMspPairId: Map<
    string,
    Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>
  >
} {
  const solverNetLabelPlacements =
    solver.inlineNetLabelSolver?.getOutput().netLabelPlacements ??
    solver.netLabelNetLabelCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelTraceCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelPlacementSolver?.netLabelPlacements ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().netLabelPlacements ??
    []
  const inlineNetLabelPlacements =
    solver.inlineNetLabelSolver?.getOutput().inlineNetLabelPlacements ?? []
  const coveredPinIds = new Set<string>([
    ...solverNetLabelPlacements.flatMap((placement) => placement.pinIds ?? []),
    ...inlineNetLabelPlacements.flatMap((placement) => placement.pinIds ?? []),
  ])

  const fallbackFailedGroupPlacements: NetLabelPlacement[] = []
  const fallbackConnectorEdgesByMspPairId = new Map<
    string,
    Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>
  >()

  const allTraces = getSolverTraces(solver)
  const inputPinIds = new Set(
    solver.inputProblem.chips.flatMap((chip) =>
      chip.pins.map((pin) => pin.pinId),
    ),
  )
  const globalConnMap = solver.mspConnectionPairSolver?.globalConnMap

  for (const failedGroup of solver.netLabelPlacementSolver?.failedGroups ??
    []) {
    const rep = failedGroup.overlappingTraces
    if (!rep || rep.tracePath.length === 0) continue

    const componentPinIds = new Set<string>(rep.pins.map((pin) => pin.pinId))
    let expanded = true
    while (expanded) {
      expanded = false
      for (const trace of allTraces) {
        if (trace.globalConnNetId !== failedGroup.globalConnNetId) continue
        const tracePinIds = trace.pins.map((pin) => pin.pinId)
        if (tracePinIds.some((pinId) => componentPinIds.has(pinId))) {
          for (const pinId of tracePinIds) {
            if (!componentPinIds.has(pinId)) {
              componentPinIds.add(pinId)
              expanded = true
            }
          }
        }
      }
    }

    if ([...componentPinIds].some((pinId) => coveredPinIds.has(pinId))) continue

    const allNetPinIds = (
      globalConnMap?.getIdsConnectedToNet(failedGroup.globalConnNetId) ?? []
    ).filter((id) => inputPinIds.has(id))
    const hasDisconnectedNetIsland = allNetPinIds.some(
      (pinId) => !componentPinIds.has(pinId),
    )
    if (!hasDisconnectedNetIsland) continue

    const firstPin = rep.pins[0]
    const pinFacing = firstPin?._facingDirection
    const ownerChip = firstPin
      ? solver.inputProblem.chips.find((chip) =>
          chip.pins.some((pin) => pin.pinId === firstPin.pinId),
        )
      : undefined
    if (!firstPin || !pinFacing || !ownerChip || rep.pins.length < 2) continue

    const ownerPinById = new Map(
      ownerChip.pins.map((pin) => [pin.pinId, pin] as const),
    )
    const componentPins = [...componentPinIds]
      .map((pinId) => ownerPinById.get(pinId))
      .filter((pin): pin is NonNullable<typeof pin> => Boolean(pin))
    if (
      componentPins.length !== componentPinIds.size ||
      componentPins.some((pin) => pin._facingDirection !== pinFacing)
    ) {
      continue
    }

    const isVerticalSide = pinFacing === "x+" || pinFacing === "x-"
    const coordsAlongSide = componentPins.map((pin) =>
      isVerticalSide ? pin.y : pin.x,
    )
    const minAlongSide = Math.min(...coordsAlongSide)
    const maxAlongSide = Math.max(...coordsAlongSide)
    const hasInterveningPinOnSameSide = ownerChip.pins.some((pin) => {
      if (
        componentPinIds.has(pin.pinId) ||
        pin._facingDirection !== pinFacing
      ) {
        return false
      }
      const sameSideCoord = isVerticalSide
        ? Math.abs(pin.x - firstPin.x) < 1e-4
        : Math.abs(pin.y - firstPin.y) < 1e-4
      if (!sameSideCoord) return false
      const alongCoord = isVerticalSide ? pin.y : pin.x
      return (
        alongCoord > minAlongSide + 1e-4 && alongCoord < maxAlongSide - 1e-4
      )
    })
    if (hasInterveningPinOnSameSide) continue

    const pinIds = rep.pins.map((pin) => pin.pinId)

    const availableOrientations =
      (failedGroup.netId
        ? solver.inputProblem.availableNetLabelOrientations?.[failedGroup.netId]
        : undefined) ?? []
    const orientation: AxisDirection =
      availableOrientations.length === 1
        ? availableOrientations[0]!
        : pinFacing && availableOrientations.includes(pinFacing)
          ? pinFacing
          : (availableOrientations[0] ?? pinFacing ?? "x+")

    const isPinEndpoint = (pt: { x: number; y: number }) =>
      rep.pins.some(
        (pin) => Math.abs(pin.x - pt.x) < 1e-4 && Math.abs(pin.y - pt.y) < 1e-4,
      )
    const segments: Array<{
      a: { x: number; y: number }
      b: { x: number; y: number }
      nonPinVertices: number
      length: number
    }> = []
    for (let i = 0; i < rep.tracePath.length - 1; i++) {
      const a = rep.tracePath[i]!
      const b = rep.tracePath[i + 1]!
      const length = Math.hypot(b.x - a.x, b.y - a.y)
      if (length < 1e-6) continue
      const nonPinVertices =
        (isPinEndpoint(a) ? 0 : 1) + (isPinEndpoint(b) ? 0 : 1)
      segments.push({ a, b, nonPinVertices, length })
    }
    segments.sort(
      (s1, s2) =>
        s2.nonPinVertices - s1.nonPinVertices || s2.length - s1.length,
    )
    const chosenSegment = segments[0]
    let baseAnchorPoint = rep.tracePath[0]!
    if (chosenSegment) {
      const { a, b } = chosenSegment
      if (orientation === "y+") {
        baseAnchorPoint = a.y >= b.y ? { ...a } : { ...b }
      } else if (orientation === "y-") {
        baseAnchorPoint = a.y <= b.y ? { ...a } : { ...b }
      } else if (Math.abs(a.x - b.x) < 1e-4) {
        baseAnchorPoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      } else if (orientation === "x+") {
        baseAnchorPoint = a.x >= b.x ? { ...a } : { ...b }
      } else {
        baseAnchorPoint = a.x <= b.x ? { ...a } : { ...b }
      }
    }

    const netConnection = failedGroup.netId
      ? solver.inputProblem.netConnections.find(
          (nc) => nc.netId === failedGroup.netId,
        )
      : undefined
    const labelWidth = netConnection?.netLabelWidth ?? 0.42
    const labelHeight = netConnection?.netLabelHeight ?? 0.3
    const anchorPoint = { ...baseAnchorPoint }
    const labelReach = Math.max(labelWidth, 0.42)
    const clearanceAfterCrossing = 0.2
    const otherTraces = allTraces.filter(
      (trace) => trace.globalConnNetId !== failedGroup.globalConnNetId,
    )

    let advanced = true
    while (advanced) {
      advanced = false
      for (const trace of otherTraces) {
        for (let i = 0; i < trace.tracePath.length - 1; i++) {
          const p1 = trace.tracePath[i]!
          const p2 = trace.tracePath[i + 1]!
          if (
            (orientation === "y+" || orientation === "y-") &&
            Math.abs(p1.y - p2.y) < 1e-4
          ) {
            const minX = Math.min(p1.x, p2.x) - 1e-4
            const maxX = Math.max(p1.x, p2.x) + 1e-4
            if (anchorPoint.x >= minX && anchorPoint.x <= maxX) {
              if (
                orientation === "y+" &&
                p1.y > baseAnchorPoint.y - 1e-4 &&
                p1.y <= anchorPoint.y + labelReach
              ) {
                const nextY = p1.y + clearanceAfterCrossing
                if (nextY > anchorPoint.y + 1e-4) {
                  anchorPoint.y = nextY
                  advanced = true
                }
              } else if (
                orientation === "y-" &&
                p1.y < baseAnchorPoint.y + 1e-4 &&
                p1.y >= anchorPoint.y - labelReach
              ) {
                const nextY = p1.y - clearanceAfterCrossing
                if (nextY < anchorPoint.y - 1e-4) {
                  anchorPoint.y = nextY
                  advanced = true
                }
              }
            }
          } else if (
            (orientation === "x+" || orientation === "x-") &&
            Math.abs(p1.x - p2.x) < 1e-4
          ) {
            const minY = Math.min(p1.y, p2.y) - 1e-4
            const maxY = Math.max(p1.y, p2.y) + 1e-4
            if (anchorPoint.y >= minY && anchorPoint.y <= maxY) {
              if (
                orientation === "x+" &&
                p1.x > baseAnchorPoint.x - 1e-4 &&
                p1.x <= anchorPoint.x + labelReach
              ) {
                const nextX = p1.x + clearanceAfterCrossing
                if (nextX > anchorPoint.x - 1e-4) {
                  anchorPoint.x = nextX
                  advanced = true
                }
              } else if (
                orientation === "x-" &&
                p1.x < baseAnchorPoint.x + 1e-4 &&
                p1.x >= anchorPoint.x - labelReach
              ) {
                const nextX = p1.x - clearanceAfterCrossing
                if (nextX < anchorPoint.x - 1e-4) {
                  anchorPoint.x = nextX
                  advanced = true
                }
              }
            }
          }
        }
      }
    }

    const mspConnectionPairIds = failedGroup.mspConnectionPairIds ?? [
      rep.mspPairId,
    ]
    const primaryMspPairId = mspConnectionPairIds[0]
    const requiresConnectorAcrossEnclosingTrace =
      Math.hypot(
        anchorPoint.x - baseAnchorPoint.x,
        anchorPoint.y - baseAnchorPoint.y,
      ) > 1e-4
    if (!primaryMspPairId || !requiresConnectorAcrossEnclosingTrace) continue

    const existingEdges =
      fallbackConnectorEdgesByMspPairId.get(primaryMspPairId) ?? []
    existingEdges.push({
      from: { ...baseAnchorPoint },
      to: { ...anchorPoint },
    })
    fallbackConnectorEdgesByMspPairId.set(primaryMspPairId, existingEdges)

    for (const pinId of componentPinIds) {
      coveredPinIds.add(pinId)
    }
    fallbackFailedGroupPlacements.push({
      globalConnNetId: failedGroup.globalConnNetId,
      netId: failedGroup.netId,
      netLabelText: failedGroup.netLabelText,
      pinIds,
      mspConnectionPairIds,
      orientation,
      anchorPoint,
      width: labelWidth,
      height: labelHeight,
      center: anchorPoint,
    })
  }

  return {
    netLabelPlacements: [
      ...solverNetLabelPlacements,
      ...fallbackFailedGroupPlacements,
    ],
    fallbackConnectorEdgesByMspPairId,
  }
}
