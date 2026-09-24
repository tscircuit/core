import { expect, test } from "bun:test"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"

test("footprint traces validate the complete tapered outgoing segment at the input boundary", () => {
  const wire = {
    route_type: "wire" as const,
    x: 0,
    y: 0,
    layer: "top" as const,
    width: 0.2,
    start_width: 0.2,
    end_width: 1,
    width_interpolation_mode: "quadratic" as const,
  }
  const end = {
    route_type: "wire" as const,
    x: 2,
    y: 0,
    layer: "top" as const,
    width: 1,
  }
  expect(() => new PcbTrace({ route: [wire, end] }).getPcbSize()).not.toThrow()
  expect(() => new PcbTrace({ route: [wire] }).getPcbSize()).toThrow()
  expect(() =>
    new PcbTrace({ route: [wire, { ...end, x: 0 }] }).getPcbSize(),
  ).toThrow()
  expect(() =>
    new PcbTrace({ route: [wire, { ...end, layer: "bottom" }] }).getPcbSize(),
  ).toThrow()
})
