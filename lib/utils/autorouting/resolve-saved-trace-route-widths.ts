import type { PcbTraceRoutePoint } from "circuit-json"
import type { fanoutTracePath } from "@tscircuit/props"
import type { z } from "zod"

export type SavedPcbRoute = z.output<typeof fanoutTracePath>["route"]

/**
 * Resolve saved path point widths into outgoing Circuit JSON wire tapers.
 * Points are in the caller's PCB frame, mm (+X right, +Y up, +Z above,
 * right-handed). Positions and directions are unchanged; only widths are added.
 */
export function resolveSavedTraceRouteWidths<T extends PcbTraceRoutePoint>(
  route: readonly T[],
): T[] {
  return route.map((point, index) => {
    if (point.route_type !== "wire" || !point.width_interpolation_mode)
      return { ...point }
    const next = route[index + 1]
    if (
      next?.route_type !== "wire" ||
      next.layer !== point.layer ||
      (next.x === point.x && next.y === point.y)
    ) {
      throw new Error(
        "Width interpolation requires a distinct next wire point on the same layer",
      )
    }
    return { ...point, start_width: point.width, end_width: next.width }
  })
}

/** Match each via contact to its adjacent saved wire width, in mm. */
export function getSavedTraceViaContactWidths(
  route: readonly PcbTraceRoutePoint[],
  viaIndex: number,
  fallbackWidth: number,
): { fromWidth: number; toWidth: number } {
  let before: number | undefined
  let after: number | undefined
  for (let index = viaIndex - 1; index >= 0; index--) {
    const point = route[index]
    if (point.route_type === "wire") {
      before = point.width
      break
    }
  }
  for (let index = viaIndex + 1; index < route.length; index++) {
    const point = route[index]
    if (point.route_type === "wire") {
      after = point.width
      break
    }
  }
  return {
    fromWidth: before ?? after ?? fallbackWidth,
    toWidth: after ?? before ?? fallbackWidth,
  }
}

/**
 * Add explicit wire contacts on both sides of saved vias without moving copper.
 * Points retain the caller's PCB frame, in mm (+X right, +Y up, +Z above;
 * right-handed).
 */
export function getSavedTraceRouteWithViaContacts(
  route: SavedPcbRoute,
  fallbackWidth: number,
): SavedPcbRoute {
  const withContacts = route.flatMap((point, index): SavedPcbRoute => {
    if (point.route_type !== "via") return [point]
    const { fromWidth, toWidth } = getSavedTraceViaContactWidths(
      route,
      index,
      fallbackWidth,
    )
    return [
      {
        route_type: "wire",
        x: point.x,
        y: point.y,
        layer: point.from_layer,
        width: fromWidth,
      },
      point,
      {
        route_type: "wire",
        x: point.x,
        y: point.y,
        layer: point.to_layer,
        width: toWidth,
      },
    ]
  })
  const last = route.at(-1)!
  if (last.route_type === "via") {
    const { toWidth } = getSavedTraceViaContactWidths(
      route,
      route.length - 1,
      fallbackWidth,
    )
    withContacts.push({
      route_type: "wire",
      x: last.x,
      y: last.y,
      layer: last.to_layer,
      width: toWidth,
    })
  }
  return withContacts
}
