import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { mergeRoutes } from "lib/utils/autorouting/mergeRoutes"

test("mergeRoutes preserves segment widths when it reverses route sections", () => {
  const firstRoute: PcbTrace["route"] = [
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 5, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 10, y: 0, width: 0.4, layer: "top" },
  ]
  const secondRoute: PcbTrace["route"] = [
    { route_type: "wire", x: 5, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 3, y: 0, width: 0.6, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.7, layer: "top" },
  ]
  const originalRoutes = structuredClone([firstRoute, secondRoute])

  const mergedRoute = mergeRoutes([firstRoute, secondRoute])

  expect(mergedRoute).toEqual([
    { route_type: "wire", x: 10, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 5, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 0, y: 0, width: 0.4, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.6, layer: "top" },
    { route_type: "wire", x: 3, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 5, y: 0, width: 0.7, layer: "top" },
  ])
  expect([firstRoute, secondRoute]).toEqual(originalRoutes)
})
