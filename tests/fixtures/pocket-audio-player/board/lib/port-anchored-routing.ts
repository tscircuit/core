import { simplifyCopperRoute } from "./simplify-copper-route"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SimplifiedPcbTraces,
} from "@tscircuit/capacity-autorouter"

type RoutePoint = SimplifiedPcbTrace["route"][number]
type Position = { x: number; y: number; layer: string }
type Edge = { target: string; route: RoutePoint[] }

/** Reconstruct continuous port-to-port paths from the router's copper graph. */
export function anchorCopperToPorts({
  input,
  traces,
}: {
  input: SimpleRouteJson
  traces: SimplifiedPcbTraces
}): SimplifiedPcbTraces {
  const connection = input.connections[0]!
  const graph = new Map<string, Edge[]>()
  const positions = new Map<string, Position>()
  const allLayers = [
    "top",
    ...Array.from(
      { length: input.layerCount - 2 },
      (_, index) => `inner${index + 1}`,
    ),
    "bottom",
  ]
  const key = (point: Position) =>
    `${point.x.toFixed(3)},${point.y.toFixed(3)},${point.layer}`
  const register = (point: Position) => {
    const identity = key(point)
    if (!graph.has(identity)) graph.set(identity, [])
    if (!positions.has(identity)) positions.set(identity, point)
    return identity
  }
  const reverse = (route: RoutePoint[]): RoutePoint[] =>
    route.toReversed().map((point) =>
      point.route_type === "via"
        ? { ...point, from_layer: point.to_layer, to_layer: point.from_layer }
        : point.route_type === "through_obstacle"
          ? {
              ...point,
              start: point.end,
              end: point.start,
              from_layer: point.to_layer,
              to_layer: point.from_layer,
            }
          : point,
    )
  const connect = ({
    from,
    to,
    route,
  }: { from: Position; to: Position; route: RoutePoint[] }) => {
    const start = register(from)
    const end = register(to)
    if (start === end) return
    graph.get(start)!.push({ target: end, route })
    graph.get(end)!.push({ target: start, route: reverse(route) })
  }
  const wire = (position: Position, width: number): RoutePoint => ({
    route_type: "wire",
    ...position,
    width,
  })
  for (const trace of traces) {
    let previous: Position | undefined
    let width = 0.15
    for (const point of trace.route) {
      if (point.route_type === "wire") {
        const position = { x: point.x, y: point.y, layer: point.layer }
        register(position)
        if (previous && previous.layer === position.layer)
          connect({
            from: previous,
            to: position,
            route: [wire(previous, width), wire(position, point.width)],
          })
        previous = position
        width = point.width
      } else if (point.route_type === "via") {
        const from = { x: point.x, y: point.y, layer: point.from_layer }
        const to = { x: point.x, y: point.y, layer: point.to_layer }
        if (previous && previous.layer === from.layer)
          connect({
            from: previous,
            to: from,
            route: [wire(previous, width), wire(from, width)],
          })
        for (const layer of allLayers) {
          const contact = { x: point.x, y: point.y, layer }
          connect({
            from,
            to: contact,
            route: [
              wire(from, width),
              { ...point, to_layer: layer },
              wire(contact, width),
            ],
          })
        }
        previous = to
      } else if (point.route_type === "through_obstacle") {
        const from = { ...point.start, layer: point.from_layer }
        const to = { ...point.end, layer: point.to_layer }
        if (previous && previous.layer === from.layer)
          connect({
            from: previous,
            to: from,
            route: [wire(previous, width), wire(from, point.width)],
          })
        connect({
          from,
          to,
          route: [wire(from, point.width), point, wire(to, point.width)],
        })
        previous = to
        width = point.width
      } else
        throw new Error(
          "Port-anchored routing does not accept jumper components",
        )
    }
  }
  const wireEdges = [...graph].flatMap(([start, edges]) =>
    edges
      .filter(
        (edge) =>
          start < edge.target &&
          edge.route.every((point) => point.route_type === "wire"),
      )
      .map((edge) => ({ start, edge })),
  )
  for (const { start, edge } of wireEdges) {
    const from = positions.get(start)!
    const to = positions.get(edge.target)!
    const dx = to.x - from.x,
      dy = to.y - from.y
    const lengthSquared = dx * dx + dy * dy
    if (lengthSquared < 0.000001) continue
    for (const [nodeId, node] of positions) {
      if (
        nodeId === start ||
        nodeId === edge.target ||
        node.layer !== from.layer
      )
        continue
      const fraction =
        ((node.x - from.x) * dx + (node.y - from.y) * dy) / lengthSquared
      if (
        fraction <= 0 ||
        fraction >= 1 ||
        Math.hypot(
          node.x - from.x - dx * fraction,
          node.y - from.y - dy * fraction,
        ) > 0.00001
      )
        continue
      const first = edge.route[0]!,
        last = edge.route.at(-1)!
      if (first.route_type !== "wire" || last.route_type !== "wire") continue
      connect({
        from,
        to: node,
        route: [wire(from, first.width), wire(node, first.width)],
      })
      connect({
        from: node,
        to,
        route: [wire(node, last.width), wire(to, last.width)],
      })
    }
  }
  const anchors = connection.pointsToConnect.map((point) => {
    const layer = point.layer ?? point.layers?.[0]
    if (!layer) throw new Error("Routing port has no copper layer")
    const position = { x: point.x, y: point.y, layer }
    const identity = key(position)
    const pads = input.obstacles.filter(
      (obstacle) =>
        obstacle.circuitJsonMetadata?.pcb_port_id === point.pcb_port_id,
    )
    let touches = graph.has(identity)
    for (const [nodeId, node] of [...positions]) {
      if (nodeId === identity) continue
      for (const pad of pads) {
        if (!pad.layers.includes(node.layer)) continue
        const local = applyToPoint(
          compose(
            rotateDEG(-(pad.ccwRotationDegrees ?? 0)),
            translate(-pad.center.x, -pad.center.y),
          ),
          node,
        )
        if (
          Math.abs(local.x) > pad.width / 2 + 0.001 ||
          Math.abs(local.y) > pad.height / 2 + 0.001
        )
          continue
        if (
          node.layer !== layer &&
          !pad.circuitJsonMetadata?.pcb_plated_hole_id
        )
          continue
        connect({
          from: position,
          to: node,
          route: nodeAnchorRoute({
            port: position,
            contact: node,
            metadata: pad.circuitJsonMetadata,
          }),
        })
        touches = true
      }
    }
    if (!touches)
      throw new Error(
        `Autorouted copper does not touch PCB port ${point.pcb_port_id} at (${point.x},${point.y})`,
      )
    return {
      identity: register(position),
      portId: point.pcb_port_id ?? point.pointId ?? "",
    }
  })
  const root = anchors[0]!
  const parents = new Map<string, { from: string; edge: Edge }>()
  const visited = new Set([root.identity])
  const queue = [root.identity]
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index]!
    for (const edge of graph.get(node) ?? []) {
      if (visited.has(edge.target)) continue
      visited.add(edge.target)
      parents.set(edge.target, { from: node, edge })
      queue.push(edge.target)
    }
  }
  return anchors.slice(1).map((anchor, index) => {
    if (!visited.has(anchor.identity))
      throw new Error(
        `Autorouted copper has no physical path from ${root.portId} to ${anchor.portId}`,
      )
    const edges: Edge[] = []
    let node = anchor.identity
    while (node !== root.identity) {
      const parent = parents.get(node)!
      edges.push(parent.edge)
      node = parent.from
    }
    const route = simplifyCopperRoute(
      edges
        .toReversed()
        .flatMap((edge) => edge.route)
        .map((point) => structuredClone(point)),
    )
    if (!route.length)
      throw new Error("Two source ports have indistinguishable routing anchors")
    const first = route.find((point) => point.route_type === "wire")
    const last = route.findLast((point) => point.route_type === "wire")
    if (first?.route_type === "wire") first.start_pcb_port_id = root.portId
    if (last?.route_type === "wire") last.end_pcb_port_id = anchor.portId
    return {
      type: "pcb_trace",
      pcb_trace_id: `${connection.name}_anchored_${index}`,
      connection_name: connection.name,
      connectsTo: [root.portId, anchor.portId],
      route,
    }
  })
}

function nodeAnchorRoute({
  port,
  contact,
  metadata,
}: {
  port: Position
  contact: Position
  metadata?: { pcb_plated_hole_id?: string; pcb_port_id?: string }
}): RoutePoint[] {
  const start: RoutePoint = { route_type: "wire", ...port, width: 0.15 }
  const end: RoutePoint = { route_type: "wire", ...contact, width: 0.15 }
  if (port.layer === contact.layer) return [start, end]
  return [
    start,
    {
      route_type: "through_obstacle",
      start: { x: port.x, y: port.y },
      end: { x: contact.x, y: contact.y },
      from_layer: port.layer,
      to_layer: contact.layer,
      width: 0.15,
      circuitJsonMetadata: metadata,
    },
    end,
  ]
}
