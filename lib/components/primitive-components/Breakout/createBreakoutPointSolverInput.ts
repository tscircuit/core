import type {
  BreakoutPointSolverInput,
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
  const sourceComponent = sourcePort?.source_component_id
    ? db.source_component.get(sourcePort.source_component_id)
    : undefined
  if (!sourcePort) return undefined
  return sourceComponent?.name
    ? `${sourceComponent.name}.${sourcePort.name}`
    : sourcePort.name
}

const getPadElement = (db: CircuitJsonUtilObjects, pcbPortId: string) => {
  return (
    db.pcb_smtpad.getWhere({ pcb_port_id: pcbPortId }) ??
    db.pcb_plated_hole.getWhere({ pcb_port_id: pcbPortId })
  )
}

const toBreakoutPort = (db: CircuitJsonUtilObjects, pcbPort: PcbPort) => {
  const pad = getPadElement(db, pcbPort.pcb_port_id)
  const padBounds = pad ? findBoundsAndCenter([pad]) : null

  return {
    sourcePortId: pcbPort.source_port_id!,
    position: { x: pcbPort.x!, y: pcbPort.y! },
    ...(padBounds ? { width: padBounds.width, height: padBounds.height } : {}),
    layer: (pcbPort.layers?.[0] as PcbLayer) ?? "top",
    label: getPortLabel(db, pcbPort.source_port_id),
  }
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

  const traces: BreakoutPointSolverInput["traces"] = []
  for (const sourceTrace of db.source_trace.list()) {
    const pcbPorts = sourceTrace.connected_source_port_ids
      .map((sourcePortId) => sourcePortIdToPcbPort.get(sourcePortId))
      .filter((port): port is PcbPort => Boolean(port))

    const insidePorts = pcbPorts.filter(
      (port) => port.pcb_group_id === breakout.pcb_group_id,
    )
    // Only include outside ports that are geometrically outside the bounds.
    // Components may sit inside the boundary area without belonging to the
    // breakout group (different pcb_group_id); passing them to the solver
    // as "outside" would produce invalid boundary intersections.
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
    const pcbPort = (pad as any).pcb_port_id
      ? db.pcb_port.get((pad as any).pcb_port_id)
      : null
    pads.push({
      center: padBounds.center,
      width: padBounds.width,
      height: padBounds.height,
      layer: ((pad as any).layer as PcbLayer) ?? "top",
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
      layer: component.layer as PcbLayer | undefined,
      label: component.pcb_component_id,
    }))

  const usedBoundaryPoints = db.pcb_breakout_point
    .list()
    .filter((point) => point.pcb_group_id === breakout.pcb_group_id)
    .map((point) => ({ x: point.x, y: point.y }))

  return {
    bounds: {
      minX: boundsMinX,
      maxX: boundsMaxX,
      minY: boundsMinY,
      maxY: boundsMaxY,
    },
    boundaryPointSpacing: 0.5,
    traces,
    pads,
    components,
    usedBoundaryPoints,
  }
}
