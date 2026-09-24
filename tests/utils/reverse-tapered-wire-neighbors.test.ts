import { expect, test } from "bun:test"
import type { PcbTraceRoutePointWire } from "circuit-json"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { getTaperedWireGeometry } from "lib/utils/tapered-wire-geometry"

test("reversing tapers preserves ordinary interpolated neighbors with different endpoint widths", () => {
  const route: PcbTraceRoutePointWire[] = [
    { route_type: "wire", x: -1, y: 0, width: 0.3, layer: "top" },
    {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 2,
      start_width: 2,
      end_width: 0.2,
      width_interpolation_mode: "quadratic",
      layer: "top",
    },
    { route_type: "wire", x: 4, y: 0, width: 0.7, layer: "top" },
    {
      route_type: "wire",
      x: 5,
      y: 0,
      width: 0.9,
      start_width: 0.9,
      end_width: 0.4,
      width_interpolation_mode: "linear",
      layer: "top",
    },
    { route_type: "wire", x: 6, y: 0, width: 0.6, layer: "top" },
  ]
  const measure = (wires: PcbTraceRoutePointWire[]) =>
    wires
      .slice(0, -1)
      .map((wire, i) => {
        const next = wires[i + 1]!
        const widthAt = wire.width_interpolation_mode
          ? getTaperedWireGeometry(wire, next).widthAt
          : (t: number) => wire.width + (next.width - wire.width) * t
        return {
          x: Math.min(wire.x, next.x),
          widths: [0, 0.25, 0.5, 0.75, 1].map((t) =>
            Number(widthAt(wire.x < next.x ? t : 1 - t).toFixed(8)),
          ),
        }
      })
      .sort((a, b) => a.x - b.x)
  const reversed = reversePcbTraceRoute(
    route,
    "interpolated",
  ) as PcbTraceRoutePointWire[]
  expect(measure(reversed)).toEqual(measure(route))
  expect(
    measure(
      reversePcbTraceRoute(
        reversed,
        "interpolated",
      ) as PcbTraceRoutePointWire[],
    ),
  ).toEqual(measure(route))
})
