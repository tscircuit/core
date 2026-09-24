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
      if (point.route_type !== "through_pad") return { ...point }

      return {
        ...point,
        start: point.end,
        end: point.start,
        start_layer: point.end_layer,
        end_layer: point.start_layer,
      }
    })

  if (routeThicknessMode !== "interpolated") {
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

  // Tapers belong to outgoing segments, not vertices. Remove the copied
  // metadata before assigning each taper to the other end of its segment.
  for (const point of reversedRoute) {
    if (point.route_type !== "wire") continue
    delete point.start_width
    delete point.end_width
    delete point.width_interpolation_mode
  }
  for (let i = 0; i < route.length - 1; i++) {
    const original = route[i]!
    if (original.route_type !== "wire" || !original.width_interpolation_mode)
      continue
    const next = route[i + 1]!
    const reversedIndex = route.length - i - 2
    const taper = {
      ...original,
      x: next.route_type === "through_pad" ? next.start.x : next.x,
      y: next.route_type === "through_pad" ? next.start.y : next.y,
      width: original.end_width!,
      start_width: original.end_width!,
      end_width: original.start_width!,
      start_pcb_port_id: original.end_pcb_port_id,
      end_pcb_port_id: original.start_pcb_port_id,
    }
    if (next.route_type === "wire") {
      const existing = reversedRoute[reversedIndex]!
      // Preserve an adjoining interpolated segment's endpoint width when the
      // authored taper end differs from its neighboring wire's width.
      const incoming = reversedRoute[reversedIndex - 1]
      if (
        routeThicknessMode === "interpolated" &&
        incoming?.route_type === "wire" &&
        !incoming.width_interpolation_mode
      ) {
        incoming.start_width = incoming.width
        incoming.end_width = next.width
        incoming.width_interpolation_mode = "linear"
      }
      reversedRoute[reversedIndex] = { ...existing, ...taper }
    } else {
      // After reversing a via/through-pad, depart its exit on the old entry
      // layer. A wire anchor is required to own the outgoing taper fields.
      reversedRoute.splice(reversedIndex + 1, 0, taper)
    }
  }
  return reversedRoute
}
