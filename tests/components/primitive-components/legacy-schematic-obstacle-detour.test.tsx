import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("legacy schematic routing detours around a component blocking the elbow", () => {
  const { circuit } = getTestFixture()
  circuit._featureMspSchematicTraceRouting = false
  circuit.add(
    <board width={30} height={20} routingDisabled>
      <resistor name="R1" resistance={1000} schX={-5} footprint="0402" />
      <resistor name="R2" resistance={1000} schX={5} footprint="0402" />
      <chip
        name="BLOCKER"
        schWidth={2}
        schHeight={3}
        pinLabels={{ pin1: "IN", pin2: "OUT" }}
        schX={0}
        schY={0}
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  circuit.render()
  const traces = circuit.db.schematic_trace.list()
  expect(traces.length).toBeGreaterThan(0)
  const edges = traces.flatMap((trace) => trace.edges)
  expect(
    edges.some(
      ({ from, to }) => Math.abs(from.y) >= 1.5 || Math.abs(to.y) >= 1.5,
    ),
  ).toBe(true)
  for (const { from, to } of edges) {
    expect(from.x === to.x || from.y === to.y).toBe(true)
    // No segment may enter the blocker's open interior.
    const crossesInterior =
      from.y === to.y
        ? Math.abs(from.y) < 1.5 &&
          Math.max(from.x, to.x) > -1 &&
          Math.min(from.x, to.x) < 1
        : Math.abs(from.x) < 1 &&
          Math.max(from.y, to.y) > -1.5 &&
          Math.min(from.y, to.y) < 1.5
    expect(crossesInterior).toBe(false)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
