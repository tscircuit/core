import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify that traces created via <netlabel connectsTo={...} /> generate
// crossing segments when intersecting other traces

test("repro22 netlabel trace crossing", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={-2}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={-1}
      />
      <resistor name="R3" resistance="10k" footprint="0402" schX={0} schY={2} />

      {/* Trace that will intersect with netlabel generated trace */}
      <trace from=".R1 > .pin2" to=".R3 > .pin1" />

      {/* Netlabel connection creating a second trace */}
      <netlabel net="N1" schX={0} schY={0} connectsTo="R3.pin2" />
      <trace from=".R2 > .pin2" to="net.N1" />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.schematic_trace.list()
  const crossingEdges = traces.flatMap((trace) =>
    trace.edges.filter((e) => e.is_crossing),
  )

  expect(crossingEdges.length).toBe(1)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
