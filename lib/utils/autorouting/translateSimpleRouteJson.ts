import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

export function translateSimpleRouteJson(
  simpleRouteJson: SimpleRouteJson,
  offset: { x: number; y: number },
): SimpleRouteJson {
  const newSimpleRouteJson = structuredClone(simpleRouteJson)
  newSimpleRouteJson.bounds.minX += offset.x
  newSimpleRouteJson.bounds.maxX += offset.x
  newSimpleRouteJson.bounds.minY += offset.y
  newSimpleRouteJson.bounds.maxY += offset.y

  if (newSimpleRouteJson.outline) {
    for (const pt of newSimpleRouteJson.outline) {
      pt.x += offset.x
      pt.y += offset.y
    }
  }

  for (const obstacle of newSimpleRouteJson.obstacles) {
    obstacle.center.x += offset.x
    obstacle.center.y += offset.y
  }

  for (const conn of newSimpleRouteJson.connections) {
    for (const pt of conn.pointsToConnect) {
      pt.x += offset.x
      pt.y += offset.y
    }
  }
  return newSimpleRouteJson
}

export function translateSimplifiedPcbTraces(
  traces: SimplifiedPcbTrace[],
  offset: { x: number; y: number },
): SimplifiedPcbTrace[] {
  const newTraces = structuredClone(traces)
  for (const trace of newTraces) {
    for (const pt of trace.route) {
      if (pt.route_type === "wire" || pt.route_type === "via") {
        pt.x += offset.x
        pt.y += offset.y
      }
    }
  }
  return newTraces
}
