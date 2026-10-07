import { expect, test } from "bun:test"
import { pcbTraceProps } from "lib/components/primitive-components/PcbTrace"

test("invalid detailed routes and ambiguous coordinate layer changes are rejected", () => {
  for (const route of [
    [{ route_type: "wire", x: 0, y: 0, layer: "top" }],
    [{ route_type: "via", x: 0, y: 0, from_layer: "top" }],
    [{ route_type: "unknown", x: 0, y: 0 }],
    [{ x: 0, y: 0, via: true }],
    [{ x: 0, y: 0, to_layer: "bottom" }],
  ]) {
    expect(pcbTraceProps.safeParse({ route }).success).toBe(false)
  }
  expect(
    pcbTraceProps.safeParse({ layer: "typo", route: [{ x: 0, y: 0 }] }).success,
  ).toBe(false)
})
