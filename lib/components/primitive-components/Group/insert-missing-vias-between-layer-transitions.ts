import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

type SimplifiedPcbTraceRoute = SimplifiedPcbTrace["route"]
type SimplifiedWireRoutePoint = Extract<
  SimplifiedPcbTraceRoute[number],
  { route_type: "wire" }
>

const wirePointsHaveSamePosition = (
  firstWirePoint: SimplifiedWireRoutePoint,
  secondWirePoint: SimplifiedWireRoutePoint,
) =>
  firstWirePoint.x === secondWirePoint.x &&
  firstWirePoint.y === secondWirePoint.y

/**
 * Autorouter output uses board-world coordinates in millimeters. When two
 * adjacent wire points change PCB layers, materialize the transition at the
 * second point so the preceding segment keeps its original layer and geometry.
 */
export const insertMissingViasBetweenLayerTransitions = (
  route: SimplifiedPcbTraceRoute,
): SimplifiedPcbTraceRoute => {
  const routeWithExplicitVias: SimplifiedPcbTraceRoute = []

  for (const routePoint of route) {
    const previousRoutePoint = routeWithExplicitVias.at(-1)
    if (
      previousRoutePoint?.route_type === "wire" &&
      routePoint.route_type === "wire" &&
      previousRoutePoint.layer !== routePoint.layer
    ) {
      if (!wirePointsHaveSamePosition(previousRoutePoint, routePoint)) {
        routeWithExplicitVias.push({
          route_type: "wire",
          x: routePoint.x,
          y: routePoint.y,
          width: previousRoutePoint.width,
          layer: previousRoutePoint.layer,
        })
      }
      routeWithExplicitVias.push({
        route_type: "via",
        x: routePoint.x,
        y: routePoint.y,
        from_layer: previousRoutePoint.layer,
        to_layer: routePoint.layer,
      })
    }
    routeWithExplicitVias.push(routePoint)
  }

  return routeWithExplicitVias
}
