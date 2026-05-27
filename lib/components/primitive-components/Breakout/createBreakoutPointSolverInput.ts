import type {
  BreakoutPointSolverInput,
  BreakoutPad,
  BreakoutPort,
  BreakoutTrace,
  PcbLayer,
} from "@tscircuit/breakout-point-solver"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceTrace } from "circuit-json"
import {
  doBoundsOverlap,
  getBoundFromCenteredRect,
  isPointInsideBounds,
} from "@tscircuit/math-utils"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import type { Breakout } from "./Breakout"

const asPcbLayer = (layer: unknown): PcbLayer | undefined => {
  if (layer === "top" || layer === "bottom") return layer
  return undefined
}

const getBreakoutPort = (
  db: CircuitJsonUtilObjects,
  sourcePortId: string,
): BreakoutPort | null => {
  const pcbPort = db.pcb_port.getWhere({ source_port_id: sourcePortId })
  if (!pcbPort || pcbPort.x === undefined || pcbPort.y === undefined) {
    return null
  }
  const sourcePort = db.source_port.get(sourcePortId)
  return {
    sourcePortId,
    position: { x: pcbPort.x, y: pcbPort.y },
    layer: asPcbLayer(pcbPort.layers?.[0]),
    label: sourcePort?.name,
  }
}

const getSourcePortIdsForPcbPort = (
  db: CircuitJsonUtilObjects,
  pcbPortId: string,
) => {
  const pcbPort = db.pcb_port.get(pcbPortId)
  if (!pcbPort?.source_port_id) return undefined
  return [pcbPort.source_port_id]
}

export const createBreakoutPointSolverInput = (
  breakout: Breakout,
): BreakoutPointSolverInput | null => {
  if (!breakout.root || !breakout.pcb_group_id) return null

  const { db } = breakout.root
  const pcbGroup = db.pcb_group.get(breakout.pcb_group_id)
  if (!pcbGroup?.width || !pcbGroup.height) return null

  const groupBounds = {
    minX: pcbGroup.center.x - pcbGroup.width / 2,
    maxX: pcbGroup.center.x + pcbGroup.width / 2,
    minY: pcbGroup.center.y - pcbGroup.height / 2,
    maxY: pcbGroup.center.y + pcbGroup.height / 2,
  }
  const breakoutBounds = groupBounds

  const traces = db.source_trace
    .list()
    .map((trace: SourceTrace) => {
      const ports = trace.connected_source_port_ids
        .map((sourcePortId: string) => getBreakoutPort(db, sourcePortId))
        .filter((port): port is BreakoutPort => Boolean(port))
      const insidePorts = ports.filter((port) =>
        isPointInsideBounds(port.position, breakoutBounds),
      )
      const outsidePorts = ports.filter(
        (port) => !isPointInsideBounds(port.position, breakoutBounds),
      )
      if (insidePorts.length === 0 || outsidePorts.length === 0) return null
      return {
        sourceTraceId: trace.source_trace_id,
        insidePorts,
        outsidePorts,
      }
    })
    .filter((trace: BreakoutTrace | null): trace is BreakoutTrace =>
      Boolean(trace),
    )

  const pads = [
    ...db.pcb_smtpad.list().flatMap((pad): BreakoutPad[] => {
      const [obstacle] = getObstaclesFromCircuitJson([pad])
      if (!obstacle) return []
      let ccwRotationDegrees: number | undefined
      if (obstacle.ccwRotationDegrees !== undefined) {
        ccwRotationDegrees = obstacle.ccwRotationDegrees
      }
      let sourcePortIds: string[] | undefined
      if (pad.pcb_port_id) {
        sourcePortIds = getSourcePortIdsForPcbPort(db, pad.pcb_port_id)
      }
      return [
        {
          center: obstacle.center,
          width: obstacle.width,
          height: obstacle.height,
          ccwRotationDegrees,
          sourcePortIds,
          layer: asPcbLayer(pad.layer),
          label: pad.pcb_smtpad_id,
        },
      ]
    }),
    ...db.pcb_plated_hole.list().flatMap((hole): BreakoutPad[] => {
      const [obstacle] = getObstaclesFromCircuitJson([hole])
      if (!obstacle) return []
      let ccwRotationDegrees: number | undefined
      if (obstacle.ccwRotationDegrees !== undefined) {
        ccwRotationDegrees = obstacle.ccwRotationDegrees
      }
      let sourcePortIds: string[] | undefined
      if (hole.pcb_port_id) {
        sourcePortIds = getSourcePortIdsForPcbPort(db, hole.pcb_port_id)
      }
      return [
        {
          center: obstacle.center,
          width: obstacle.width,
          height: obstacle.height,
          ccwRotationDegrees,
          sourcePortIds,
          label: hole.pcb_plated_hole_id,
        },
      ]
    }),
  ].filter(
    (pad) =>
      Number.isFinite(pad.center.x) &&
      Number.isFinite(pad.center.y) &&
      Number.isFinite(pad.width) &&
      Number.isFinite(pad.height) &&
      doBoundsOverlap(getBoundFromCenteredRect(pad), breakoutBounds),
  )

  const usedBoundaryPoints = db.pcb_breakout_point
    .list()
    .filter((point) => point.pcb_group_id === breakout.pcb_group_id)
    .map((point) => ({ x: point.x, y: point.y }))

  return {
    bounds: breakoutBounds,
    traces,
    pads,
    usedBoundaryPoints,
    boundaryPointSpacing: 0.5,
  }
}
