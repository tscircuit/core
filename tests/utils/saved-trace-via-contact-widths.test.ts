import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getSavedTraceViaContactWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"

test("via contacts use adjacent widths rather than the first taper width", () => {
  const route: PcbTraceRoutePoint[] = [
    { route_type: "wire", x: 0, y: 0, width: 0.8, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.2, layer: "top" },
    { route_type: "via", x: 1, y: 0, from_layer: "top", to_layer: "bottom" },
    { route_type: "wire", x: 2, y: 0, width: 0.3, layer: "bottom" },
  ]
  expect(getSavedTraceViaContactWidths(route, 2, 0.1)).toEqual({
    fromWidth: 0.2,
    toWidth: 0.3,
  })
  expect(getSavedTraceViaContactWidths(route.slice(2), 0, 0.1)).toEqual({
    fromWidth: 0.3,
    toWidth: 0.3,
  })
  expect(getSavedTraceViaContactWidths(route.slice(0, 3), 2, 0.1)).toEqual({
    fromWidth: 0.2,
    toWidth: 0.2,
  })
  expect(getSavedTraceViaContactWidths([route[2]], 0, 0.1)).toEqual({
    fromWidth: 0.1,
    toWidth: 0.1,
  })
})
