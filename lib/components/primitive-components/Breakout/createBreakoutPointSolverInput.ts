import type {
  BreakoutPad,
  BreakoutPointSolverInput,
  BreakoutPort,
  PcbLayer,
} from "@tscircuit/breakout-point-solver"
import {
  type CircuitJsonUtilObjects,
  findBoundsAndCenter,
} from "@tscircuit/circuit-json-util"
import type { PcbPort } from "circuit-json"
import type { Breakout } from "./Breakout"

const getPortLabel = (db: CircuitJsonUtilObjects, sourcePortId?: string) => {
  if (!sourcePortId) return undefined
  const sourcePort = db.source_port.get(sourcePortId)
  if (!sourcePort) return undefined
  let sourceComponent
  if (sourcePort.source_component_id) {
    sourceComponent = db.source_component.get(sourcePort.source_component_id)
  }
  if (sourceComponent?.name) {
    return `${sourceComponent.name}.${sourcePort.name}`
  }
  return sourcePort.name
}

const getPadElement = (db: CircuitJsonUtilObjects, pcbPortId: string) => {
  return (
    db.pcb_smtpad.getWhere({ pcb_port_id: pcbPortId }) ??
    db.pcb_plated_hole.getWhere({ pcb_port_id: pcbPortId })
  )
}

const toBreakoutPort = (db: CircuitJsonUtilObjects, pcbPort: PcbPort) => {
  const pad = getPadElement(db, pcbPort.pcb_port_id)
  let padBounds
  if (pad) {
    padBounds = findBoundsAndCenter([pad])
  }
  const breakoutPort: BreakoutPort = {
    sourcePortId: pcbPort.source_port_id!,
    position: { x: pcbPort.x!, y: pcbPort.y! },
    layer: (pcbPort.layers?.[0] as PcbLayer) ?? "top",
    label: getPortLabel(db, pcbPort.source_port_id),
  }
  if (padBounds) {
    breakoutPort.width = padBounds.width
    breakoutPort.height = padBounds.height
  }
  return breakoutPort
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

  const boundsMinX = pcbGroup.center.x - pcbGroup.width / 2
  const boundsMaxX = pcbGroup.center.x + pcbGroup.width / 2
  const boundsMinY = pcbGroup.center.y - pcbGroup.height / 2
  const boundsMaxY = pcbGroup.center.y + pcbGroup.height / 2
  const board = db.pcb_board.list()[0]
  const traceWidth = board?.min_trace_width ?? 0.15
  const traceToPadEdgeClearance = board?.min_trace_to_pad_edge_clearance ?? 0.1
  const boundaryPointClearance = board?.min_trace_to_pad_edge_clearance ?? 0.2
  const viaPadDiameter = board?.min_via_pad_diameter ?? 0.3
  const padEscapeClearance = traceWidth / 2 + traceToPadEdgeClearance

  const traces: BreakoutPointSolverInput["traces"] = []
  for (const sourceTrace of db.source_trace.list()) {
    const pcbPorts = sourceTrace.connected_source_port_ids
      .map((sourcePortId) => sourcePortIdToPcbPort.get(sourcePortId))
      .filter((port): port is PcbPort => Boolean(port))

    const insidePorts = pcbPorts.filter(
      (port) => port.pcb_group_id === breakout.pcb_group_id,
    )
    const outsidePorts = pcbPorts.filter(
      (port) =>
        port.pcb_group_id !== breakout.pcb_group_id &&
        !(
          port.x! >= boundsMinX &&
          port.x! <= boundsMaxX &&
          port.y! >= boundsMinY &&
          port.y! <= boundsMaxY
        ),
    )

    if (insidePorts.length === 0 || outsidePorts.length === 0) continue

    traces.push({
      sourceTraceId: sourceTrace.source_trace_id,
      insidePorts: insidePorts.map((port) => toBreakoutPort(db, port)),
      outsidePorts: outsidePorts.map((port) => toBreakoutPort(db, port)),
    })
  }

  if (traces.length === 0) return null

  const allPadElements = [...db.pcb_smtpad.list(), ...db.pcb_plated_hole.list()]
  const pads: BreakoutPointSolverInput["pads"] = []
  for (const pad of allPadElements) {
    const padBounds = findBoundsAndCenter([pad])
    if (!padBounds.width || !padBounds.height) continue
    const padWithPort = pad as typeof pad & { pcb_port_id?: string }
    let pcbPort
    if (padWithPort.pcb_port_id) {
      pcbPort = db.pcb_port.get(padWithPort.pcb_port_id)
    }
    const breakoutPad: BreakoutPad = {
      center: padBounds.center,
      width: padBounds.width,
      height: padBounds.height,
      layer: ((pad as any).layer as PcbLayer) ?? "top",
      sourcePortIds: [],
      label: getPortLabel(db, pcbPort?.source_port_id),
    }
    if (pcbPort?.pcb_group_id === breakout.pcb_group_id) {
      breakoutPad.clearance = padEscapeClearance
    }
    if (pcbPort?.source_port_id) {
      breakoutPad.sourcePortIds = [pcbPort.source_port_id]
    }
    pads.push(breakoutPad)
  }

  const components = db.pcb_component
    .list()
    .filter((component) => component.width && component.height)
    .map((component) => ({
      center: component.center,
      width: component.width,
      height: component.height,
      ccwRotationDegrees: component.rotation,
      layer: component.layer as PcbLayer | undefined,
      label: component.pcb_component_id,
    }))

  const usedBoundaryPoints = db.pcb_breakout_point
    .list()
    .filter((point) => point.pcb_group_id === breakout.pcb_group_id)
    .map((point) => ({ x: point.x, y: point.y }))

  const boundaryPointSpacing =
    viaPadDiameter + 2 * (traceWidth + boundaryPointClearance)

  return {
    bounds: {
      minX: boundsMinX,
      maxX: boundsMaxX,
      minY: boundsMinY,
      maxY: boundsMaxY,
    },
    boundaryPointSpacing,
    traces,
    pads,
    components,
    usedBoundaryPoints,
  }
}
