import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro4 schematic trace overlap", async () => {
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

      <trace from=".R1 > .pin2" to=".R3 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin2" />
    </board>,
  )

  circuit.render()

  // Get the schematic traces
  const traces = circuit.db.schematic_trace.list()

  // Find edges with is_crossing=true
  const crossingEdges = traces.flatMap((trace) =>
    trace.edges.filter((edge) => edge.is_crossing),
  )

  // There should be exactly one crossing
  expect(crossingEdges.length).toBe(1)

  const crossingEdge = crossingEdges[0]
  expect(crossingEdge.is_crossing).toBe(true)

  // Check crossing segment length is ~0.1mm
  const length = Math.sqrt(
    (crossingEdge.to.x - crossingEdge.from.x) ** 2 +
      (crossingEdge.to.y - crossingEdge.from.y) ** 2,
  )
  expect(length).toBeCloseTo(0.075, 2)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
