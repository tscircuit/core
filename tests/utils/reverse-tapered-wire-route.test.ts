import { expect, test } from "bun:test"
import {
  pcb_trace,
  type PcbTraceRoutePoint,
  type PcbTraceRoutePointWire,
} from "circuit-json"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { getTaperedWireGeometry } from "lib/utils/tapered-wire-geometry"
import { getRoutePointPosition } from "lib/utils/pcb-trace-route-point-utils"

test("route reversal moves taper ownership and preserves joins to wires, vias and through-pads", () => {
  for (const mode of ["constant", "interpolated"] as const) {
    for (const endpoint of [
      { route_type: "wire", x: 4, y: 0, width: 0.7, layer: "top" },
      { route_type: "via", x: 4, y: 0, from_layer: "top", to_layer: "bottom" },
      {
        route_type: "through_pad",
        start: { x: 4, y: 0 },
        end: { x: 5, y: 0 },
        width: 0.8,
        start_layer: "top",
        end_layer: "bottom",
      },
    ] satisfies PcbTraceRoutePoint[]) {
      const taper: PcbTraceRoutePointWire = {
        route_type: "wire",
        x: 0,
        y: 0,
        width: 2,
        start_width: 2,
        end_width: 0.2,
        width_interpolation_mode: "quadratic",
        layer: "top",
        start_pcb_port_id: "pcb_port_1",
        end_pcb_port_id: "pcb_port_2",
      }
      const route = [taper, endpoint]
      const original = structuredClone(route)
      const reversed = reversePcbTraceRoute(route, mode)
      expect(
        pcb_trace.safeParse({
          type: "pcb_trace",
          pcb_trace_id: "pcb_trace_1",
          route: reversed,
        }).success,
      ).toBe(true)
      const index = reversed.findIndex(
        (p) =>
          p.route_type === "wire" && p.width_interpolation_mode === "quadratic",
      )
      const reversedTaper = reversed[index] as PcbTraceRoutePointWire
      expect(reversedTaper).toMatchObject({
        x: 4,
        y: 0,
        layer: "top",
        width: 0.2,
        start_width: 0.2,
        end_width: 2,
        start_pcb_port_id: "pcb_port_2",
        end_pcb_port_id: "pcb_port_1",
      })
      expect(
        getTaperedWireGeometry(
          reversedTaper,
          getRoutePointPosition(reversed[index + 1]!),
        ).polygon.area(),
      ).toBeCloseTo(
        getTaperedWireGeometry(taper, { x: 4, y: 0 }).polygon.area(),
        8,
      )
      expect(route).toEqual(original)
    }
  }
})
