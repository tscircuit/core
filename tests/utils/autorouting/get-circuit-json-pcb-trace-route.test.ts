import { expect, test } from "bun:test"
import {
  type PcbTraceRoutePointWithSrjMetadata,
  getCircuitJsonPcbTraceRoute,
} from "lib/utils/autorouting/get-circuit-json-pcb-trace-route"

test("strips SRJ-only metadata without mutating the routed geometry", () => {
  const route: PcbTraceRoutePointWithSrjMetadata[] = [
    {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 0.1,
      layer: "top",
    },
    {
      route_type: "via",
      x: 1,
      y: 0,
      from_layer: "top",
      to_layer: "inner1",
      layers: ["top", "inner1", "inner2", "bottom"],
      hole_diameter: 0.2,
      outer_diameter: 0.5,
    },
  ]

  const circuitJsonRoute = getCircuitJsonPcbTraceRoute(route)

  expect(circuitJsonRoute).toEqual([
    route[0],
    {
      route_type: "via",
      x: 1,
      y: 0,
      from_layer: "top",
      to_layer: "inner1",
      hole_diameter: 0.2,
      outer_diameter: 0.5,
    },
  ])
  expect(route[1]).toHaveProperty("layers", [
    "top",
    "inner1",
    "inner2",
    "bottom",
  ])
  expect(circuitJsonRoute).not.toBe(route)
})
