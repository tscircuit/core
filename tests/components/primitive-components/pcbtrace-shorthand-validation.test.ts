import { expect, test } from "bun:test"
import { pcbTraceProps } from "lib/components/primitive-components/PcbTrace"

test("pcbtrace shorthand does not let malformed explicit routes bypass validation", () => {
  const wire = { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" }
  for (const point of [
    { ...wire, route_type: "unknown" },
    { ...wire, width: false },
    { ...wire, layer: "middle" },
    { route_type: "via", x: 0, y: 0 },
    {
      ...wire,
      start_width: -0.2,
      end_width: 0.3,
      width_interpolation_mode: "linear",
    },
  ]) {
    expect(pcbTraceProps.safeParse({ route: [point] }).success).toBe(false)
  }
})
