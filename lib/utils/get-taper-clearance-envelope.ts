import type { AnyCircuitElement } from "circuit-json"

/** Conservative analysis-only copper envelope for consumers that read width
 * but not taper fields. Board-world positions (mm, +X right, +Y up, +Z above)
 * are unchanged. Widen both endpoints to cover the widest part of each taper;
 * never mutate the displayed/exported Circuit JSON. This can overestimate
 * clearance violations near a taper until consumers support its exact shape.
 */
export function getTaperClearanceEnvelope(
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] {
  return circuitJson.map((element) => {
    if (
      element.type !== "pcb_trace" ||
      !element.route.some(
        (point) =>
          point.route_type === "wire" && point.width_interpolation_mode,
      )
    )
      return element
    const route = element.route.map((point) => ({ ...point }))
    for (let index = 0; index < element.route.length - 1; index++) {
      const point = element.route[index]
      if (
        point.route_type !== "wire" ||
        point.start_width === undefined ||
        point.end_width === undefined
      )
        continue
      const width = Math.max(point.start_width, point.end_width)
      for (const endpoint of [route[index], route[index + 1]]) {
        if (endpoint.route_type !== "wire") continue
        endpoint.width = Math.max(endpoint.width, width)
      }
    }
    for (const point of route) {
      if (point.route_type !== "wire") continue
      delete point.start_width
      delete point.end_width
      delete point.width_interpolation_mode
    }
    return { ...element, route }
  })
}
