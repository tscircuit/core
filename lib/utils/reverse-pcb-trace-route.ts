import type { PcbTrace } from "circuit-json"

/**
 * Reverse a Circuit JSON PCB route without changing its physical copper.
 *
 * Constant-mode wire widths are stored on the first point of each segment, so
 * they must be remapped to preserve each physical segment. Interpolated-mode
 * widths are point-local and reverse with their points.
 */
export const reversePcbTraceRoute = (
  route: PcbTrace["route"],
  routeThicknessMode: PcbTrace["route_thickness_mode"] = "constant",
): PcbTrace["route"] => {
  const reversedRoute = route
    .slice()
    .reverse()
    .map((point) => {
      if (point.route_type === "wire") {
        const { start_width, end_width, width_interpolation_mode, ...wire } =
          point
        return wire
      }
      if (point.route_type !== "through_pad") return { ...point }

      return {
        ...point,
        start: point.end,
        end: point.start,
        start_layer: point.end_layer,
        end_layer: point.start_layer,
      }
    })

  if (routeThicknessMode === "constant") {
    for (
      let reversedIndex = 0;
      reversedIndex < reversedRoute.length - 1;
      reversedIndex++
    ) {
      const reversedStart = reversedRoute[reversedIndex]
      const reversedEnd = reversedRoute[reversedIndex + 1]
      if (
        reversedStart?.route_type !== "wire" ||
        reversedEnd?.route_type !== "wire" ||
        reversedStart.layer !== reversedEnd.layer
      ) {
        continue
      }

      const originalSegmentStart = route[route.length - reversedIndex - 2]
      if (originalSegmentStart?.route_type === "wire") {
        reversedStart.width = originalSegmentStart.width
      }
    }

    for (
      let reversedIndex = 0;
      reversedIndex < reversedRoute.length;
      reversedIndex++
    ) {
      const reversedPoint = reversedRoute[reversedIndex]
      if (reversedPoint?.route_type !== "wire") continue

      const nextReversedPoint = reversedRoute[reversedIndex + 1]
      if (
        nextReversedPoint?.route_type === "wire" &&
        nextReversedPoint.layer === reversedPoint.layer
      ) {
        continue
      }

      let originalRunEndIndex = route.length - reversedIndex - 1
      while (originalRunEndIndex < route.length - 1) {
        const originalRunPoint = route[originalRunEndIndex]
        const nextOriginalRunPoint = route[originalRunEndIndex + 1]
        if (
          originalRunPoint?.route_type !== "wire" ||
          nextOriginalRunPoint?.route_type !== "wire" ||
          originalRunPoint.layer !== nextOriginalRunPoint.layer
        ) {
          break
        }
        originalRunEndIndex++
      }

      const originalRunEnd = route[originalRunEndIndex]
      if (originalRunEnd?.route_type === "wire") {
        reversedPoint.width = originalRunEnd.width
      }
    }
  }

  // Taper metadata belongs to the outgoing segment, not its original point.
  for (let index = 0; index < route.length - 1; index++) {
    const start = route[index]
    const end = route[index + 1]
    if (start.route_type !== "wire" || !start.width_interpolation_mode) continue
    if (end.route_type !== "wire" || end.layer !== start.layer) continue
    const reversedStart = reversedRoute[route.length - index - 2]
    if (reversedStart.route_type !== "wire") continue
    Object.assign(reversedStart, {
      width: start.end_width,
      start_width: start.end_width,
      end_width: start.start_width,
      width_interpolation_mode: start.width_interpolation_mode,
    })
  }
  return reversedRoute
}
