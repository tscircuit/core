import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { resolveSavedTraceRouteWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"

test("reversing mixed saved wire segments preserves taper ownership and widths", () => {
  const route: PcbTraceRoutePoint[] = [
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
      width: 0.2,
      layer: "top",
      width_interpolation_mode: "linear",
    },
    { route_type: "wire", x: 4, y: 0, width: 0.6, layer: "top" },
  ]
  const resolved = resolveSavedTraceRouteWidths(route)
  const original = structuredClone(resolved)
  for (const mode of ["constant", "interpolated"] as const) {
    const reversed = reversePcbTraceRoute(resolved, mode)
    expect(reversed[0]).toMatchObject({
      x: 4,
      width: 0.6,
      start_width: 0.6,
      end_width: 0.2,
      width_interpolation_mode: "linear",
    })
    expect(reversed[1]).not.toHaveProperty("width_interpolation_mode")
    expect(reversed[2]).toMatchObject({
      x: 1,
      width: 0.2,
      start_width: 0.2,
      end_width: 0.8,
      width_interpolation_mode: "quadratic",
    })
    expect(reversed[3]).not.toHaveProperty("width_interpolation_mode")
    expect(resolved).toEqual(original)
  }
})
