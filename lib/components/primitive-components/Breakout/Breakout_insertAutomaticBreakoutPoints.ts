import type { AnyCircuitElement, SourceTrace } from "circuit-json"
import {
  getAutomaticBreakoutPointPosition,
  type AutomaticBreakoutBoundary,
  type AutomaticBreakoutPoint,
  type AutomaticBreakoutPointClearanceConstraint,
} from "lib/utils/autorouting/getAutomaticBreakoutPointPosition"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import type { Breakout } from "./Breakout"

const getGeneratedBreakoutPointSpacing = (breakout: Breakout) => {
  const board = breakout.root?.db.pcb_board.list()[0]
  const traceWidth = board?.min_trace_width ?? 0.1
  const traceToPadClearance = board?.min_trace_to_pad_edge_clearance ?? 0
  return traceWidth + traceToPadClearance * 2
}

const getOutsidePortClearance = (breakout: Breakout) => {
  const board = breakout.root?.db.pcb_board.list()[0]
  const traceWidth = board?.min_trace_width ?? 0.1
  const traceToPadClearance = board?.min_trace_to_pad_edge_clearance ?? 0
  const viaPadDiameter = board?.min_via_pad_diameter ?? 0.6
  return Math.max(
    getGeneratedBreakoutPointSpacing(breakout),
    viaPadDiameter * 2 + traceToPadClearance + traceWidth,
  )
}

const getOutsideCopperClearance = (breakout: Breakout) => {
  const board = breakout.root?.db.pcb_board.list()[0]
  const traceWidth = board?.min_trace_width ?? 0.1
  const traceToPadClearance = board?.min_trace_to_pad_edge_clearance ?? 0
  const padToPadClearance = board?.min_pad_edge_to_pad_edge_clearance ?? 0
  const viaPadDiameter = board?.min_via_pad_diameter ?? 0.6
  return (
    Math.max(traceWidth, viaPadDiameter) +
    traceWidth +
    traceToPadClearance +
    padToPadClearance
  )
}

const getBreakoutBoundary = (
  breakout: Breakout,
): AutomaticBreakoutBoundary | null => {
  const { db } = breakout.root!
  if (!breakout.pcb_group_id) return null
  const pcbGroup = db.pcb_group.get(breakout.pcb_group_id)
  if (!pcbGroup?.width || !pcbGroup.height) return null

  const halfWidth = pcbGroup.width / 2
  const halfHeight = pcbGroup.height / 2
  return {
    left: pcbGroup.center.x - halfWidth,
    right: pcbGroup.center.x + halfWidth,
    bottom: pcbGroup.center.y - halfHeight,
    top: pcbGroup.center.y + halfHeight,
  }
}

export const Breakout_insertAutomaticBreakoutPoints = (
  breakout: Breakout,
): void => {
  if (breakout._hasInsertedAutomaticBreakoutPoints) return
  if (breakout.root?.pcbDisabled) return
  if (!breakout.pcb_group_id) return

  const { db } = breakout.root!
  const boundary = getBreakoutBoundary(breakout)
  if (!boundary) return

  const insideSourceComponentIds = new Set(
    breakout
      .getDescendants()
      .map(
        (descendant) =>
          (descendant as { source_component_id?: string }).source_component_id,
      )
      .filter((id): id is string => Boolean(id)),
  )
  if (insideSourceComponentIds.size === 0) return

  const isInsidePort = (sourcePortId: string) => {
    const sourcePort = db.source_port.get(sourcePortId)
    return (
      sourcePort?.source_component_id &&
      insideSourceComponentIds.has(sourcePort.source_component_id)
    )
  }

  const getPcbPortPosition = (
    sourcePortId: string,
  ): AutomaticBreakoutPoint | null => {
    const pcbPort = db.pcb_port.getWhere({ source_port_id: sourcePortId })
    if (!pcbPort || pcbPort.x === undefined || pcbPort.y === undefined) {
      return null
    }
    return { x: pcbPort.x, y: pcbPort.y }
  }

  const getOutsideTargetPosition = (outsideSourcePortIds: string[]) => {
    const outsidePortPositions = outsideSourcePortIds
      .map(getPcbPortPosition)
      .filter(
        (position): position is AutomaticBreakoutPoint => position !== null,
      )
    if (outsidePortPositions.length === 0) return null

    return {
      x:
        outsidePortPositions.reduce((sum, position) => sum + position.x, 0) /
        outsidePortPositions.length,
      y:
        outsidePortPositions.reduce((sum, position) => sum + position.y, 0) /
        outsidePortPositions.length,
    }
  }

  const getPcbPortCopperIds = (sourcePortId: string) => {
    const pcbPort = db.pcb_port.getWhere({ source_port_id: sourcePortId })
    if (!pcbPort) return []

    return [
      db.pcb_smtpad.getWhere({ pcb_port_id: pcbPort.pcb_port_id })
        ?.pcb_smtpad_id,
      db.pcb_plated_hole.getWhere({ pcb_port_id: pcbPort.pcb_port_id })
        ?.pcb_plated_hole_id,
    ].filter((id): id is string => Boolean(id))
  }

  const parentSubcircuitId =
    breakout.parent?.getSubcircuit?.()?.subcircuit_id ?? undefined
  const usedBoundaryPoints: AutomaticBreakoutPoint[] = []
  const generatedBreakoutPointSpacing =
    getGeneratedBreakoutPointSpacing(breakout)
  const outsidePortClearance = getOutsidePortClearance(breakout)
  const outsideCopperClearance = getOutsideCopperClearance(breakout)
  const obstacles = getObstaclesFromCircuitJson(
    db.toArray() as AnyCircuitElement[],
  )

  for (const sourceTrace of db.source_trace.list() as SourceTrace[]) {
    const insideSourcePortIds =
      sourceTrace.connected_source_port_ids.filter(isInsidePort)
    if (insideSourcePortIds.length === 0) continue

    const outsideSourcePortIds = sourceTrace.connected_source_port_ids.filter(
      (sourcePortId) => !isInsidePort(sourcePortId),
    )
    if (outsideSourcePortIds.length === 0) continue

    const outsideTargetPosition = getOutsideTargetPosition(outsideSourcePortIds)
    if (!outsideTargetPosition) continue
    const outsidePortClearanceConstraints = outsideSourcePortIds
      .map(getPcbPortPosition)
      .filter(
        (position): position is AutomaticBreakoutPoint => position !== null,
      )
      .map((position) => ({
        position,
        clearance: outsidePortClearance,
      })) satisfies AutomaticBreakoutPointClearanceConstraint[]
    const outsidePortCopperIds = new Set(
      outsideSourcePortIds.flatMap(getPcbPortCopperIds),
    )
    const outsidePortObstacles = obstacles.filter((obstacle) =>
      obstacle.connectedTo.some((id) => outsidePortCopperIds.has(id)),
    )

    for (const insideSourcePortId of insideSourcePortIds) {
      const insidePortPosition = getPcbPortPosition(insideSourcePortId)
      if (!insidePortPosition) continue

      const boundaryPoint = getAutomaticBreakoutPointPosition({
        insidePortPosition,
        outsideTargetPosition,
        boundary,
        usedBoundaryPoints,
        pointClearanceConstraints: outsidePortClearanceConstraints,
        outsidePortObstacles,
        outsideCopperClearance,
        boundaryPointSpacing: generatedBreakoutPointSpacing,
      })
      if (!boundaryPoint) continue
      usedBoundaryPoints.push(boundaryPoint)

      db.pcb_breakout_point.insert({
        pcb_group_id: breakout.pcb_group_id,
        subcircuit_id: breakout.subcircuit_id ?? undefined,
        source_port_id: insideSourcePortId,
        x: boundaryPoint.x,
        y: boundaryPoint.y,
      })

      for (const outsideSourcePortId of outsideSourcePortIds) {
        db.pcb_breakout_point.insert({
          pcb_group_id: breakout.pcb_group_id,
          subcircuit_id: parentSubcircuitId,
          source_port_id: outsideSourcePortId,
          source_trace_id: sourceTrace.source_trace_id,
          x: boundaryPoint.x,
          y: boundaryPoint.y,
        })
      }
    }
  }

  breakout._hasInsertedAutomaticBreakoutPoints = true
}
