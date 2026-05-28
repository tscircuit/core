import type { BreakoutPointSolverInput } from "@tscircuit/breakout-point-solver"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbPort } from "circuit-json"
import type { Breakout } from "./Breakout"

type BreakoutPcbLayer = "top" | "bottom"

const toBreakoutPcbLayer = (
  layer: string | undefined,
): BreakoutPcbLayer | undefined => {
  if (layer === "top" || layer === "bottom") return layer
  return undefined
}

const getPcbPortPad = (db: CircuitJsonUtilObjects, pcbPortId: string) => {
  return (
    db.pcb_smtpad.getWhere({ pcb_port_id: pcbPortId }) ??
    db.pcb_plated_hole.getWhere({ pcb_port_id: pcbPortId })
  )
}

const getPortSize = (
  db: CircuitJsonUtilObjects,
  pcbPort: PcbPort,
): { width?: number; height?: number; ccwRotationDegrees?: number } => {
  const pad = getPcbPortPad(db, pcbPort.pcb_port_id) as any
  if (!pad) return {}
  if (pad.shape === "circle") {
    return { width: pad.radius * 2, height: pad.radius * 2 }
  }
  if (pad.shape === "pill" || pad.shape === "rotated_pill") {
    return {
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    }
  }
  if (pad.shape === "rect" || pad.shape === "rotated_rect") {
    return {
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    }
  }
  return {}
}

const getPortLabel = (db: CircuitJsonUtilObjects, sourcePortId?: string) => {
  if (!sourcePortId) return undefined
  const sourcePort = db.source_port.get(sourcePortId)
  const sourceComponent = sourcePort?.source_component_id
    ? db.source_component.get(sourcePort.source_component_id)
    : undefined
  if (!sourcePort) return undefined
  return sourceComponent?.name
    ? `${sourceComponent.name}.${sourcePort.name}`
    : sourcePort.name
}

const toBreakoutPort = (db: CircuitJsonUtilObjects, pcbPort: PcbPort) => ({
  sourcePortId: pcbPort.source_port_id!,
  position: { x: pcbPort.x!, y: pcbPort.y! },
  ...getPortSize(db, pcbPort),
  layer: toBreakoutPcbLayer(pcbPort.layers?.[0]) ?? "top",
  label: getPortLabel(db, pcbPort.source_port_id),
})

const getPadDimensions = (pad: any) => {
  if (pad.shape === "circle") {
    return {
      width: pad.radius * 2,
      height: pad.radius * 2,
    }
  }
  if (pad.shape === "rect" || pad.shape === "rotated_rect") {
    return {
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    }
  }
  if (pad.shape === "pill" || pad.shape === "rotated_pill") {
    return {
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    }
  }
  if (pad.shape === "oval" || pad.shape === "circular_hole_with_rect_pad") {
    return {
      width: pad.outer_width ?? pad.width ?? pad.outer_diameter,
      height: pad.outer_height ?? pad.height ?? pad.outer_diameter,
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
  if (!pcbGroup || !pcbGroup.width || !pcbGroup.height) return null

  const sourcePortIdToPcbPort = new Map<string, PcbPort>()
  for (const pcbPort of db.pcb_port.list()) {
    if (!pcbPort.source_port_id) continue
    sourcePortIdToPcbPort.set(pcbPort.source_port_id, pcbPort)
  }

  const traces: BreakoutPointSolverInput["traces"] = []
  for (const sourceTrace of db.source_trace.list()) {
    const pcbPorts = sourceTrace.connected_source_port_ids
      .map((sourcePortId) => sourcePortIdToPcbPort.get(sourcePortId))
      .filter((port): port is PcbPort => Boolean(port))

    const insidePorts = pcbPorts.filter(
      (port) => port.pcb_group_id === breakout.pcb_group_id,
    )
    const outsidePorts = pcbPorts.filter(
      (port) => port.pcb_group_id !== breakout.pcb_group_id,
    )

    if (insidePorts.length === 0 || outsidePorts.length === 0) continue

    traces.push({
      sourceTraceId: sourceTrace.source_trace_id,
      insidePorts: insidePorts.map((port) => toBreakoutPort(db, port)),
      outsidePorts: outsidePorts.map((port) => toBreakoutPort(db, port)),
    })
  }

  if (traces.length === 0) return null

  const pads: BreakoutPointSolverInput["pads"] = []
  for (const pad of [
    ...db.pcb_smtpad.list(),
    ...db.pcb_plated_hole.list(),
  ] as any[]) {
    const dimensions = getPadDimensions(pad)
    if (!dimensions?.width || !dimensions?.height) continue
    const pcbPort = pad.pcb_port_id ? db.pcb_port.get(pad.pcb_port_id) : null
    pads.push({
      center: { x: pad.x, y: pad.y },
      width: dimensions.width,
      height: dimensions.height,
      ccwRotationDegrees: dimensions.ccwRotationDegrees,
      layer: toBreakoutPcbLayer(pad.layer) ?? "top",
      sourcePortIds: pcbPort?.source_port_id ? [pcbPort.source_port_id] : [],
      label: getPortLabel(db, pcbPort?.source_port_id),
    })
  }

  const components = db.pcb_component
    .list()
    .filter((component) => component.width && component.height)
    .map((component) => ({
      center: component.center,
      width: component.width,
      height: component.height,
      ccwRotationDegrees: component.rotation,
      layer: toBreakoutPcbLayer(component.layer),
      label: component.pcb_component_id,
    }))

  const usedBoundaryPoints = db.pcb_breakout_point
    .list()
    .filter((point) => point.pcb_group_id === breakout.pcb_group_id)
    .map((point) => ({ x: point.x, y: point.y }))

  return {
    bounds: {
      minX: pcbGroup.center.x - pcbGroup.width / 2,
      maxX: pcbGroup.center.x + pcbGroup.width / 2,
      minY: pcbGroup.center.y - pcbGroup.height / 2,
      maxY: pcbGroup.center.y + pcbGroup.height / 2,
    },
    boundaryPointSpacing: 0.5,
    traces,
    pads,
    components,
    usedBoundaryPoints,
  }
}
