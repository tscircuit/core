import { expect, test } from "bun:test"
import { computeJunctions } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/compute-junctions"

test("computeJunctions: same-net T-junction creates a junction", () => {
  const traces = [
    {
      source_trace_id: "trace_a",
      connectivity_key: "net.GND",
      edges: [
        { from: { x: 0, y: 0 }, to: { x: 2, y: 0 } },
        { from: { x: 2, y: 0 }, to: { x: 2, y: 2 } },
      ],
    },
    {
      source_trace_id: "trace_b",
      connectivity_key: "net.GND",
      edges: [{ from: { x: 2, y: 0 }, to: { x: 4, y: 0 } }],
    },
  ]

  const junctions = computeJunctions(traces)
  const all = [...junctions.trace_a, ...junctions.trace_b]
  expect(all.length).toBeGreaterThan(0)
  expect(all.some((p) => p.x === 2 && p.y === 0)).toBe(true)
})

test("computeJunctions: different-net T-junction does not create a junction (#2553)", () => {
  const traces = [
    {
      source_trace_id: "trace_vcc",
      connectivity_key: "net.VCC",
      edges: [
        { from: { x: 0, y: 0 }, to: { x: 2, y: 0 } },
        { from: { x: 2, y: 0 }, to: { x: 2, y: 2 } },
      ],
    },
    {
      source_trace_id: "trace_gnd",
      connectivity_key: "net.GND",
      edges: [{ from: { x: 2, y: 0 }, to: { x: 4, y: 0 } }],
    },
  ]

  const junctions = computeJunctions(traces)
  expect(junctions.trace_vcc).toHaveLength(0)
  expect(junctions.trace_gnd).toHaveLength(0)
})
