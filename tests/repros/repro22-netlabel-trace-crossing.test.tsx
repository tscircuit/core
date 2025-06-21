import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure traces created from <netlabel connectsTo> create schematic crossings

test("repro22 netlabel trace crossing", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" schX={2} schY={0} />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={1.5}
      />

      {/* Horizontal trace between R1 and R2 */}
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />

      {/* Net label connecting to R3 pin1. The vertical trace should cross the
          horizontal trace above. */}
      <netlabel
        net="NET1"
        schX={0}
        schY={-1}
        connectsTo=".R3 > .pin1"
        anchorSide="top"
      />
    </board>,
  )

  circuit.render()

  const crossingEdges = circuit.db.schematic_trace
    .list()
    .flatMap((t) => t.edges.filter((e) => e.is_crossing))

  expect(crossingEdges.length).toBe(1)
  expect(crossingEdges[0].is_crossing).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
