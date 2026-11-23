import type { PcbTrace, PcbVia } from "circuit-json"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

type RoutedTrace = PcbTrace | SimplifiedPcbTrace
type RoutePoint = RoutedTrace["route"][number]

function getWireSegment(previous: RoutePoint, next: RoutePoint) {
  const start = "end" in previous ? previous.end : previous
  const end = "start" in next ? next.start : next
  if (start.x === end.x && start.y === end.y) return
  let layer: string
  if (previous.route_type === "wire") layer = previous.layer
  else if (next.route_type === "wire") layer = next.layer
  else if (previous.route_type === "through_pad") layer = previous.end_layer
  else if ("to_layer" in previous) layer = previous.to_layer
  else layer = previous.layer
  const width =
    previous.route_type === "wire"
      ? previous.width
      : next.route_type === "wire"
        ? next.width
        : undefined
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, layer, width }
}

/** A stage may return existing copper together with its new routes, in either direction. */
function containsWireSegment(
  route: RoutedTrace["route"],
  segment: NonNullable<ReturnType<typeof getWireSegment>>,
): boolean {
  for (let i = 1; i < route.length; i++) {
    const prior = getWireSegment(route[i - 1], route[i])
    if (
      !prior ||
      prior.layer !== segment.layer ||
      prior.width !== segment.width
    )
      continue
    const forward =
      prior.x1 === segment.x1 &&
      prior.y1 === segment.y1 &&
      prior.x2 === segment.x2 &&
      prior.y2 === segment.y2
    const reversed =
      prior.x1 === segment.x2 &&
      prior.y1 === segment.y2 &&
      prior.x2 === segment.x1 &&
      prior.y2 === segment.y1
    if (forward || reversed) return true
  }
  return false
}

/** Ignore drill barrels and copper through a component. Only newly routed planar copper must use the board's signal layers. */
export function getRoutingLayerError(
  input: Pick<SimpleRouteJson, "routingLayers" | "traces">,
  output: readonly (RoutedTrace | PcbVia)[] | undefined,
): string | undefined {
  if (!input.routingLayers || !output) return
  const allowedLayers = new Set(input.routingLayers)
  for (const trace of output) {
    if (trace.type !== "pcb_trace") continue
    for (let i = 1; i < trace.route.length; i++) {
      const segment = getWireSegment(trace.route[i - 1], trace.route[i])
      if (!segment || allowedLayers.has(segment.layer)) continue
      const existing = input.traces?.find(
        (prior) => prior.pcb_trace_id === trace.pcb_trace_id,
      )
      if (existing && containsWireSegment(existing.route, segment)) continue
      return `Trace ${trace.pcb_trace_id} has routed copper on ${segment.layer}, outside board routingLayers (${input.routingLayers.join(", ")})`
    }
  }
}
