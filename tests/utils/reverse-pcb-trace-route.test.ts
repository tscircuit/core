import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"

test("preserves variable wire segment widths when reversing a PCB route", () => {
  const route: PcbTrace["route"] = [
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 2, y: 0, width: 0.4, layer: "top" },
    {
      route_type: "via",
      x: 2,
      y: 0,
      from_layer: "top",
      to_layer: "bottom",
    },
    { route_type: "wire", x: 2, y: 0, width: 0.6, layer: "bottom" },
    { route_type: "wire", x: 3, y: 0, width: 0.8, layer: "bottom" },
    { route_type: "wire", x: 4, y: 0, width: 0.7, layer: "bottom" },
    {
      route_type: "through_pad",
      start: { x: 4, y: 0 },
      end: { x: 5, y: 0 },
      start_layer: "bottom",
      end_layer: "top",
      width: 0.9,
    },
    { route_type: "wire", x: 5, y: 0, width: 0.9, layer: "top" },
    { route_type: "wire", x: 6, y: 0, width: 1, layer: "top" },
    { route_type: "wire", x: 7, y: 0, width: 1.1, layer: "top" },
  ]
  const originalRoute = structuredClone(route)

  const reversed = reversePcbTraceRoute(route)

  expect(reversed).toEqual([
    { route_type: "wire", x: 7, y: 0, width: 1, layer: "top" },
    { route_type: "wire", x: 6, y: 0, width: 0.9, layer: "top" },
    { route_type: "wire", x: 5, y: 0, width: 1.1, layer: "top" },
    {
      route_type: "through_pad",
      start: { x: 5, y: 0 },
      end: { x: 4, y: 0 },
      start_layer: "top",
      end_layer: "bottom",
      width: 0.9,
    },
    { route_type: "wire", x: 4, y: 0, width: 0.8, layer: "bottom" },
    { route_type: "wire", x: 3, y: 0, width: 0.6, layer: "bottom" },
    { route_type: "wire", x: 2, y: 0, width: 0.7, layer: "bottom" },
    {
      route_type: "via",
      x: 2,
      y: 0,
      from_layer: "top",
      to_layer: "bottom",
    },
    { route_type: "wire", x: 2, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 0, y: 0, width: 0.4, layer: "top" },
  ])
  expect(reversePcbTraceRoute(reversed)).toEqual(route)
  expect(route).toEqual(originalRoute)

  const interpolatedRoute: PcbTrace["route"] = [
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 2, y: 0, width: 0.4, layer: "top" },
  ]
  const originalInterpolatedRoute = structuredClone(interpolatedRoute)

  const reversedInterpolatedRoute = reversePcbTraceRoute(
    interpolatedRoute,
    "interpolated",
  )

  expect(reversedInterpolatedRoute).toEqual([
    { route_type: "wire", x: 2, y: 0, width: 0.4, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 0, y: 0, width: 0.3, layer: "top" },
  ])
  expect(
    reversePcbTraceRoute(reversedInterpolatedRoute, "interpolated"),
  ).toEqual(interpolatedRoute)
  expect(interpolatedRoute).toEqual(originalInterpolatedRoute)
})
