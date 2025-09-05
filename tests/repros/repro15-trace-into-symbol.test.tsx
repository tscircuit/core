import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("Schematic trace overlaps manufacturer label", async () => {
  const { circuit } = getTestFixture()

  circuit._featureMspSchematicTraceRouting = true
  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={5}>
      <resistor resistance="1k" footprint="0402" name="R1" schX={-1} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
