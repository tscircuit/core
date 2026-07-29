import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cross-subcircuit trace adds a net label to both resistor ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit name="subcircuit1" schX={-2}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </subcircuit>
      <subcircuit name="subcircuit2" schX={2}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </subcircuit>
      <trace from=".subcircuit1 .R1 .pin1" to=".subcircuit2 .R2 .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netLabels = circuit.db.schematic_net_label.list()
  expect(netLabels).toHaveLength(2)
  expect(netLabels.map((label) => label.text).sort()).toEqual([
    "R1_pin1",
    "R2_pin1",
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
