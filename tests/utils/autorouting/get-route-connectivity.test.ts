import { expect, test } from "bun:test"
import { getRouteConnectivity } from "lib/utils/autorouting/get-route-connectivity"

const wire = (x: number, y: number, layer: "top" | "bottom") => ({
  route_type: "wire" as const,
  x,
  y,
  layer,
  width: 0.2,
})

test("route connectivity handles junctions, layers, vias, and plated ports", () => {
  const junctionResult = getRouteConnectivity({
    routes: [
      [wire(0, 0, "top"), wire(4, 0, "top")],
      [wire(2, 0, "top"), wire(2, 2, "top")],
      [wire(2, 0, "bottom"), wire(2, -2, "bottom")],
    ],
    layerCount: 2,
  })

  expect(junctionResult.components).toEqual([[0, 1], [2]])
  expect(junctionResult.routeTouchesPoint(0, { x: 2, y: 0 }, ["top"])).toBe(
    true,
  )
  expect(junctionResult.routeTouchesPoint(0, { x: 2, y: 0 }, ["bottom"])).toBe(
    false,
  )
  // Crossing wire interiors form a junction only on the same layer.
  const crossingResult = getRouteConnectivity({
    routes: [
      [wire(0, 0, "top"), wire(4, 0, "top")],
      [wire(2, -2, "top"), wire(2, 2, "top")],
    ],
    layerCount: 2,
  })
  expect(crossingResult.components).toEqual([[0, 1]])
  // A via joins route segments across layers.
  const viaResult = getRouteConnectivity({
    routes: [
      [wire(0, 0, "top"), wire(2, 0, "top")],
      [
        wire(2, 0, "top"),
        {
          route_type: "via" as const,
          x: 2,
          y: 0,
          from_layer: "top" as const,
          to_layer: "bottom" as const,
        },
        wire(2, 0, "bottom"),
      ],
      [wire(2, 0, "bottom"), wire(4, 0, "bottom")],
    ],
    layerCount: 2,
  })

  expect(viaResult.components).toEqual([[0, 1, 2]])
  // A plated port can join traces without an explicit via route point.
  const routes = [
    [wire(0, 0, "top"), wire(2, 0, "top")],
    [wire(2, 0, "bottom"), wire(4, 0, "bottom")],
  ]
  expect(getRouteConnectivity({ routes, layerCount: 2 }).components).toEqual([
    [0],
    [1],
  ])
  expect(
    getRouteConnectivity({
      routes,
      layerCount: 2,
      contacts: [{ x: 2, y: 0, layers: ["top", "bottom"] }],
    }).components,
  ).toEqual([[0, 1]])
})
