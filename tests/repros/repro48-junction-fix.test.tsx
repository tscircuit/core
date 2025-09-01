import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("repro48: junction fix - no junctions for X-crossings", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      {/* Create two different nets that cross but don't connect */}
      <resistor name="R1" resistance="1k" schX={0} schY={0} schRotation={0} />
      <resistor name="R2" resistance="1k" schX={2} schY={0} schRotation={0} />
      <resistor name="R3" resistance="1k" schX={1} schY={1} schRotation={90} />
      <resistor name="R4" resistance="1k" schX={1} schY={-1} schRotation={90} />

      {/* Horizontal trace (net1) */}
      <trace from="R1.pin2" to="R2.pin1" />

      {/* Vertical trace (net2) - crosses horizontal but different net */}
      <trace from="R3.pin2" to="R4.pin1" />
    </board>,
  )

  circuit.render()

  // Get schematic traces from the database
  const schematicTraces = circuit.db.schematic_trace.list()

  // Verify that no junctions are created where the traces cross
  // since they are on different nets
  for (const trace of schematicTraces) {
    // X-crossings should not have junctions
    expect(trace.junctions).toHaveLength(0)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
