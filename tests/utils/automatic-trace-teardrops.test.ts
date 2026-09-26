import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { addTraceTeardrops } from "lib/utils/autorouting/add-trace-teardrops"

test("automatic tapers preserve explicit copper, bends, and input across repeated runs", () => {
  const route = [
    { route_type: "wire", x: -3, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 3, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 3, y: 1, width: 0.2, layer: "top" },
  ] satisfies PcbTraceRoutePoint[]
  const original = structuredClone(route)
  const contacts = [
    { x: -3, y: 0, layer: "top" as const, diameter: 1 },
    { x: 3, y: 1, layer: "top" as const, diameter: 0.6 },
  ]
  const result = addTraceTeardrops(route, contacts)
  expect(
    result.filter((p) => p.route_type === "wire" && p.width_interpolation_mode),
  ).toHaveLength(2)
  expect(result).toContainEqual(route[1])
  expect(addTraceTeardrops(result, contacts)).toEqual(result)
  expect(route).toEqual(original)
  expect(addTraceTeardrops(route, [])).toEqual(route)
  expect(
    addTraceTeardrops(
      route,
      contacts.map((c) => ({ ...c, diameter: 0.1 })),
    ),
  ).toEqual(route)
  const explicit = [
    {
      ...route[0],
      start_width: 0.2,
      end_width: 0.2,
      width_interpolation_mode: "linear" as const,
    },
    route[1],
  ]
  expect(addTraceTeardrops(explicit, contacts)).toEqual(explicit)
  const short = [route[0], { ...route[0], x: -2.9 }]
  expect(addTraceTeardrops(short, contacts)).toEqual(short)
})
