import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type {
  SimpleRouteJson,
  SimplifiedPcbTraces,
} from "@tscircuit/capacity-autorouter"

/** Independent geometric acceptance check before caching an autorouter result. */
export function findCopperConflicts({
  input,
  traces,
}: { input: SimpleRouteJson; traces: SimplifiedPcbTraces }): string[] {
  const owners = new Set(
    input.connections.flatMap((connection) => [
      connection.name,
      ...connection.pointsToConnect.flatMap((point) => [
        point.pcb_port_id ?? "",
        point.pointId ?? "",
      ]),
    ]),
  )
  const obstacles = input.obstacles
    .filter((obstacle) => !obstacle.isCopperPour)
    .map((obstacle) => ({
      obstacle,
      own: obstacle.connectedTo.some((id) => owners.has(id)),
      transform: compose(
        rotateDEG(-(obstacle.ccwRotationDegrees ?? 0)),
        translate(-obstacle.center.x, -obstacle.center.y),
      ),
      radius: Math.hypot(obstacle.width, obstacle.height) / 2,
    }))
  const findings: string[] = []
  const seen = new Set<string>()
  function checkPoint({
    x,
    y,
    layer,
    radius,
    holeRadius = 0,
    via = false,
  }: {
    x: number
    y: number
    layer: string
    radius: number
    holeRadius?: number
    via?: boolean
  }) {
    for (const check of obstacles) {
      const obstacle = check.obstacle
      if (!via && !obstacle.layers.includes(layer)) continue
      if (
        Math.hypot(x - obstacle.center.x, y - obstacle.center.y) >
        check.radius + radius + 0.15
      )
        continue
      if (check.own && !(via && obstacle.circuitJsonMetadata?.pcb_smtpad_id))
        continue
      const local = applyToPoint(check.transform, { x, y })
      const distance = Math.hypot(
        Math.max(Math.abs(local.x) - obstacle.width / 2, 0),
        Math.max(Math.abs(local.y) - obstacle.height / 2, 0),
      )
      const required = check.own ? holeRadius + 0.05 : radius + 0.1
      if (distance + 0.00001 >= required) continue
      const identity = `${via ? "via" : "wire"}:${obstacle.center.x}:${obstacle.center.y}:${obstacle.layers.join(",")}`
      if (seen.has(identity)) continue
      seen.add(identity)
      findings.push(
        `${via ? "Via" : "Wire"} at (${x.toFixed(4)},${y.toFixed(4)}) violates ${check.own ? "drill-to-own-pad" : "foreign-copper"} clearance to ${obstacle.connectedTo.slice(0, 3).join(",")} on ${obstacle.layers.join(",")}`,
      )
    }
  }
  for (const trace of traces) {
    for (let index = 0; index < trace.route.length; index++) {
      const point = trace.route[index]!
      if (point.route_type === "via") {
        checkPoint({
          x: point.x,
          y: point.y,
          layer: point.from_layer,
          radius: (point.via_diameter ?? input.minViaPadDiameter ?? 0.4) / 2,
          holeRadius:
            (point.via_hole_diameter ?? input.minViaHoleDiameter ?? 0.2) / 2,
          via: true,
        })
        continue
      }
      if (point.route_type !== "wire") continue
      const next = trace.route[index + 1]
      if (!next || next.route_type !== "wire" || next.layer !== point.layer)
        continue
      const dx = next.x - point.x
      const dy = next.y - point.y
      const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.025))
      for (let sample = 0; sample <= count; sample++)
        checkPoint({
          x: point.x + (dx * sample) / count,
          y: point.y + (dy * sample) / count,
          layer: point.layer,
          radius: Math.max(point.width, next.width) / 2,
        })
    }
  }
  return findings
}
