import type { Breakout } from "./Breakout"
import type { PcbPort } from "circuit-json"

type AutoBreakoutPcbPort = PcbPort & {
  source_port_id: string
  x: number
  y: number
}

type BreakoutSide = "left" | "right" | "top" | "bottom"

type BreakoutPortTarget = {
  port: AutoBreakoutPcbPort
  side: BreakoutSide
  breakoutX: number
  breakoutY: number
}

const MIN_AUTO_BREAKOUT_PITCH = 0.5

function getBreakoutSide({
  breakout,
  port,
  center,
  width,
  height,
}: {
  breakout: Breakout
  port: AutoBreakoutPcbPort
  center: { x: number; y: number }
  width: number
  height: number
}): BreakoutSide {
  const pcbComponent = port.pcb_component_id
    ? breakout.root!.db.pcb_component.get(port.pcb_component_id)
    : null

  if (pcbComponent) {
    const dx = port.x - pcbComponent.center.x
    const dy = port.y - pcbComponent.center.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx > absDy) return dx < 0 ? "left" : "right"
    if (absDy > absDx) return dy < 0 ? "bottom" : "top"
  }

  const leftDistance = Math.abs(port.x - (center.x - width / 2))
  const rightDistance = Math.abs(port.x - (center.x + width / 2))
  const bottomDistance = Math.abs(port.y - (center.y - height / 2))
  const topDistance = Math.abs(port.y - (center.y + height / 2))
  const horizontalDistance = Math.min(leftDistance, rightDistance)
  const verticalDistance = Math.min(bottomDistance, topDistance)

  if (horizontalDistance <= verticalDistance) {
    return leftDistance <= rightDistance ? "left" : "right"
  }
  if (bottomDistance <= topDistance) return "bottom"
  return "top"
}

function getNaturalSideCoordinate(target: BreakoutPortTarget): number {
  if (target.side === "left" || target.side === "right") {
    return target.port.y
  }
  return target.port.x
}

function setSideCoordinate(
  target: BreakoutPortTarget,
  coordinate: number,
): void {
  if (target.side === "left" || target.side === "right") {
    target.breakoutY = coordinate
  } else {
    target.breakoutX = coordinate
  }
}

function spreadTargetsOnSide(targets: BreakoutPortTarget[]): void {
  if (targets.length < 2) return

  targets.sort(
    (a, b) => getNaturalSideCoordinate(a) - getNaturalSideCoordinate(b),
  )

  const coordinates = targets.map(getNaturalSideCoordinate)
  for (let i = 1; i < coordinates.length; i++) {
    if (coordinates[i] - coordinates[i - 1] < MIN_AUTO_BREAKOUT_PITCH) {
      coordinates[i] = coordinates[i - 1] + MIN_AUTO_BREAKOUT_PITCH
    }
  }

  const originalCenter =
    targets.reduce((sum, target) => sum + getNaturalSideCoordinate(target), 0) /
    targets.length
  const spreadCenter =
    coordinates.reduce((sum, coordinate) => sum + coordinate, 0) /
    coordinates.length
  const recenterDelta = originalCenter - spreadCenter

  for (let i = 0; i < targets.length; i++) {
    setSideCoordinate(targets[i], coordinates[i] + recenterDelta)
  }
}

function getSourceTraceBySourcePortId(breakout: Breakout) {
  const sourceTraceBySourcePortId = new Map<
    string,
    { source_trace_id: string; connected_source_net_ids: string[] }
  >()
  const { db } = breakout.root!
  for (const sourceTrace of db.source_trace.list()) {
    for (const sourcePortId of sourceTrace.connected_source_port_ids) {
      sourceTraceBySourcePortId.set(sourcePortId, sourceTrace)
    }
  }
  return sourceTraceBySourcePortId
}

export function Breakout_doInitialPcbLayout(breakout: Breakout): void {
  if (breakout.root?.pcbDisabled) return
  if (!breakout.pcb_group_id) return

  const { db } = breakout.root!
  const pcbGroup = db.pcb_group.get(breakout.pcb_group_id)
  if (!pcbGroup) return

  const existingBreakoutPoints = db.pcb_breakout_point
    .list()
    .filter((point) => point.pcb_group_id === breakout.pcb_group_id)
  if (existingBreakoutPoints.length > 0) return

  const pcbPorts = db.pcb_port
    .list()
    .filter(
      (port): port is AutoBreakoutPcbPort =>
        port.pcb_group_id === breakout.pcb_group_id &&
        Boolean(port.source_port_id) &&
        port.x !== undefined &&
        port.y !== undefined,
    )

  if (pcbPorts.length === 0) return

  const center = pcbGroup.center
  const width = pcbGroup.width ?? 0
  const height = pcbGroup.height ?? 0
  const left = center.x - width / 2
  const right = center.x + width / 2
  const bottom = center.y - height / 2
  const top = center.y + height / 2

  const targets: BreakoutPortTarget[] = pcbPorts.map((port) => {
    const side = getBreakoutSide({ breakout, port, center, width, height })
    return {
      port,
      side,
      breakoutX: side === "left" ? left : side === "right" ? right : port.x,
      breakoutY: side === "bottom" ? bottom : side === "top" ? top : port.y,
    }
  })

  for (const side of ["left", "right", "top", "bottom"] as const) {
    spreadTargetsOnSide(targets.filter((target) => target.side === side))
  }

  const sourceTraceBySourcePortId = getSourceTraceBySourcePortId(breakout)

  for (const target of targets) {
    const sourceTrace = sourceTraceBySourcePortId.get(
      target.port.source_port_id,
    )
    db.pcb_breakout_point.insert({
      pcb_group_id: breakout.pcb_group_id,
      subcircuit_id: breakout.subcircuit_id ?? undefined,
      source_port_id: target.port.source_port_id,
      source_trace_id: sourceTrace?.source_trace_id,
      source_net_id: sourceTrace?.connected_source_net_ids[0],
      x: target.breakoutX,
      y: target.breakoutY,
    })
  }
}
