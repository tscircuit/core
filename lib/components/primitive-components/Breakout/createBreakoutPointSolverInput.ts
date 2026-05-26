import type {
  BreakoutPointSolverInput,
  BreakoutPad,
  BreakoutPort,
  BreakoutTrace,
  PcbLayer,
} from "@tscircuit/breakout-point-solver"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  SourceTrace,
} from "circuit-json"
import type { Breakout } from "./Breakout"

const asPcbLayer = (layer: unknown): PcbLayer | undefined =>
  layer === "top" || layer === "bottom" ? layer : undefined

const isPointInBounds = (
  point: { x: number; y: number },
  bounds: BreakoutPointSolverInput["bounds"],
) =>
  point.x >= bounds.minX &&
  point.x <= bounds.maxX &&
  point.y >= bounds.minY &&
  point.y <= bounds.maxY

const rectIntersectsBounds = (
  rect: {
    center: { x: number; y: number }
    width: number
    height: number
  },
  bounds: BreakoutPointSolverInput["bounds"],
) => {
  const halfWidth = rect.width / 2
  const halfHeight = rect.height / 2
  return (
    rect.center.x + halfWidth >= bounds.minX &&
    rect.center.x - halfWidth <= bounds.maxX &&
    rect.center.y + halfHeight >= bounds.minY &&
    rect.center.y - halfHeight <= bounds.maxY
  )
}

const getPcbPortForSourcePort = (
  db: CircuitJsonUtilObjects,
  sourcePortId: string,
): PcbPort | null => {
  const pcbPort = db.pcb_port.getWhere({ source_port_id: sourcePortId })
  if (!pcbPort || pcbPort.x === undefined || pcbPort.y === undefined) {
    return null
  }
  return pcbPort
}

const getBreakoutPort = (
  db: CircuitJsonUtilObjects,
  sourcePortId: string,
): BreakoutPort | null => {
  const pcbPort = getPcbPortForSourcePort(db, sourcePortId)
  if (!pcbPort) return null
  const sourcePort = db.source_port.get(sourcePortId)
  return {
    sourcePortId,
    position: { x: pcbPort.x, y: pcbPort.y },
    layer: asPcbLayer(pcbPort.layers?.[0]),
    label: sourcePort?.name,
  }
}

const getPadSourcePortIds = (
  db: CircuitJsonUtilObjects,
  pcbPortId: string | undefined,
) => {
  if (!pcbPortId) return undefined
  const pcbPort = db.pcb_port.get(pcbPortId)
  return pcbPort?.source_port_id ? [pcbPort.source_port_id] : undefined
}

const getSmtPadDimensions = (pad: PcbSmtPad) => {
  if (pad.shape === "circle") {
    return {
      center: { x: pad.x, y: pad.y },
      width: pad.radius * 2,
      height: pad.radius * 2,
    }
  }
  if (pad.shape === "polygon") {
    const xs = pad.points.map((point: { x: number }) => point.x)
    const ys = pad.points.map((point: { y: number }) => point.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return {
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      width: maxX - minX,
      height: maxY - minY,
    }
  }
  return {
    center: { x: pad.x, y: pad.y },
    width: pad.width,
    height: pad.height,
  }
}

const getPlatedHoleDimensions = (hole: PcbPlatedHole) => {
  if (hole.shape === "circle") {
    return {
      center: { x: hole.x, y: hole.y },
      width: hole.outer_diameter,
      height: hole.outer_diameter,
    }
  }
  if (
    hole.shape === "circular_hole_with_rect_pad" ||
    hole.shape === "pill_hole_with_rect_pad" ||
    hole.shape === "rotated_pill_hole_with_rect_pad"
  ) {
    return {
      center: { x: hole.x, y: hole.y },
      width: hole.rect_pad_width,
      height: hole.rect_pad_height,
    }
  }
  if (hole.shape === "hole_with_polygon_pad" && hole.pad_outline?.length) {
    const xs = hole.pad_outline.map((point: { x: number }) => hole.x + point.x)
    const ys = hole.pad_outline.map((point: { y: number }) => hole.y + point.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return {
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      width: maxX - minX,
      height: maxY - minY,
    }
  }
  return null
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
        isPointInBounds(port.position, breakoutBounds),
      )
      const outsidePorts = ports.filter(
        (port) => !isPointInBounds(port.position, breakoutBounds),
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
    ...db.pcb_smtpad.list().map((pad): BreakoutPad => {
      const dimensions = getSmtPadDimensions(pad)
      return {
        ...dimensions,
        ccwRotationDegrees:
          "ccw_rotation" in pad ? pad.ccw_rotation : undefined,
        sourcePortIds: getPadSourcePortIds(db, pad.pcb_port_id),
        layer: asPcbLayer(pad.layer),
        label: pad.pcb_smtpad_id,
      }
    }),
    ...db.pcb_plated_hole.list().flatMap((hole): BreakoutPad[] => {
      const dimensions = getPlatedHoleDimensions(hole)
      if (!dimensions) return []
      return [
        {
          ...dimensions,
          ccwRotationDegrees:
            "ccw_rotation" in hole
              ? hole.ccw_rotation
              : "rect_ccw_rotation" in hole
                ? hole.rect_ccw_rotation
                : undefined,
          sourcePortIds: getPadSourcePortIds(db, hole.pcb_port_id),
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
      rectIntersectsBounds(pad, breakoutBounds),
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
