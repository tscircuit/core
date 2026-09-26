import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { resolveSavedTraceRouteWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import { getCircuitJsonPcbTraceRoute } from "lib/utils/autorouting/get-circuit-json-pcb-trace-route"

test("saved widths resolve only explicitly interpolated outgoing segments", () => {
  const route = [
    {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 0.8,
      layer: "top",
      width_interpolation_mode: "quadratic",
    },
    { route_type: "wire", x: 1, y: 0, width: 0.2, layer: "top" },
    {
      route_type: "wire",
      x: 3,
      y: 0,
      width: 0.4,
      layer: "top",
      width_interpolation_mode: "linear",
    },
    { route_type: "wire", x: 4, y: 0, width: 0.8, layer: "top" },
    { route_type: "via", x: 4, y: 0, from_layer: "top", to_layer: "bottom" },
  ] as const satisfies readonly PcbTraceRoutePoint[]
  const original = structuredClone(route)
  const resolved = getCircuitJsonPcbTraceRoute(
    resolveSavedTraceRouteWidths(route),
  )
  expect(resolved).toEqual([
    { ...route[0], start_width: 0.8, end_width: 0.2 },
    route[1],
    { ...route[2], start_width: 0.4, end_width: 0.8 },
    route[3],
    route[4],
  ])
  expect(route).toEqual(original)
  expect(resolved[0]).not.toBe(route[0])
})
