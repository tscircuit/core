import {
  type Point,
  doSegmentsIntersect,
  pointToSegmentDistance,
} from "@tscircuit/math-utils"
import type { LayerRef } from "circuit-json"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"
import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

export type RoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { x: number }
>

export type CopperContact = {
  x: number
  y: number
  layers: readonly string[]
}

type CopperSegment = { start: Point; end: Point; layer: string }

const CONTACT_TOLERANCE = 1e-4

const copperSegmentsTouch = (a: CopperSegment, b: CopperSegment) => {
  if (a.layer !== b.layer) return false
  if (doSegmentsIntersect(a.start, a.end, b.start, b.end)) return true
  return (
    pointToSegmentDistance(a.start, b.start, b.end) < CONTACT_TOLERANCE ||
    pointToSegmentDistance(a.end, b.start, b.end) < CONTACT_TOLERANCE ||
    pointToSegmentDistance(b.start, a.start, a.end) < CONTACT_TOLERANCE ||
    pointToSegmentDistance(b.end, a.start, a.end) < CONTACT_TOLERANCE
  )
}

const getRouteCopperSegments = (
  route: readonly RoutePoint[],
  options: {
    layerCount: number
    allowBlindAndBuriedVias?: boolean
  },
): CopperSegment[] => {
  const segments: CopperSegment[] = []
  for (const [index, point] of route.entries()) {
    const layers =
      point.route_type === "wire"
        ? [point.layer]
        : getAutoroutedViaLayers({
            fromLayer: point.from_layer as LayerRef,
            toLayer: point.to_layer as LayerRef,
            layerCount: options.layerCount,
            allowBlindAndBuriedVias: options.allowBlindAndBuriedVias,
            physicalLayers: point.layers as LayerRef[] | undefined,
          })
    for (const layer of layers) {
      segments.push({ start: point, end: point, layer })
    }

    const next = route[index + 1]
    if (!next) continue
    const outgoingLayer =
      point.route_type === "wire" ? point.layer : point.to_layer
    const incomingLayer =
      next.route_type === "wire" ? next.layer : next.from_layer
    if (outgoingLayer !== incomingLayer)
      throw new Error("A saved route must use vias for layer changes")
    segments.push({ start: point, end: next, layer: outgoingLayer })
  }
  return segments
}

/**
 * Route and contact points are board-world mm coordinates: +X right, +Y up,
 * +Z above, right-handed. They are points (not directions); layer names are
 * physical PCB layers. Finds centerline junctions, vias, and plated contacts.
 */
export const getRouteConnectivity = ({
  routes,
  layerCount,
  allowBlindAndBuriedVias,
  contacts = [],
}: {
  routes: readonly (readonly RoutePoint[])[]
  layerCount: number
  allowBlindAndBuriedVias?: boolean
  contacts?: readonly CopperContact[]
}) => {
  const options = { layerCount, allowBlindAndBuriedVias }
  const copperByRoute = routes.map((route) =>
    getRouteCopperSegments(route, options),
  )
  const parent = routes.map((_, index) => index)
  const find = (index: number): number => {
    let root = index
    while (parent[root] !== root) root = parent[root]!
    let current = index
    while (parent[current] !== current) {
      const next = parent[current]!
      parent[current] = root
      current = next
    }
    return root
  }
  const routesTouch = (first: number, second: number) =>
    copperByRoute[first]!.some((left) =>
      copperByRoute[second]!.some((right) => copperSegmentsTouch(left, right)),
    )
  for (let first = 0; first < routes.length; first++) {
    for (let second = first + 1; second < routes.length; second++) {
      if (routesTouch(first, second)) parent[find(second)] = find(first)
    }
  }

  // A plated port joins copper on every layer in its plated barrel, even
  // when the routed polylines themselves contain no via at that position.
  for (const contact of contacts) {
    let firstRoute: number | undefined
    for (const [routeIndex, segments] of copperByRoute.entries()) {
      const touchesContact = segments.some(
        (segment) =>
          contact.layers.includes(segment.layer) &&
          pointToSegmentDistance(contact, segment.start, segment.end) <
            CONTACT_TOLERANCE,
      )
      if (!touchesContact) continue
      if (firstRoute === undefined) firstRoute = routeIndex
      else parent[find(routeIndex)] = find(firstRoute)
    }
  }

  const componentsByRoot = new Map<number, number[]>()
  for (let index = 0; index < routes.length; index++) {
    const root = find(index)
    const component = componentsByRoot.get(root) ?? []
    component.push(index)
    componentsByRoot.set(root, component)
  }

  const routeTouchesPoint = (
    routeIndex: number,
    point: { x: number; y: number },
    layers: readonly string[],
  ) =>
    copperByRoute[routeIndex]!.some(
      (segment) =>
        layers.includes(segment.layer) &&
        pointToSegmentDistance(point, segment.start, segment.end) <
          CONTACT_TOLERANCE,
    )

  return {
    components: [...componentsByRoot.values()],
    routeTouchesPoint,
  }
}
