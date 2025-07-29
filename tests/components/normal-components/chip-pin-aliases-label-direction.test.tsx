import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Chip pin aliases labels are shown after the primary pin label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schHeight={2}
        schWidth={2}
        pinLabels={{
          pin1: ["A1", "A2"],
          pin2: ["B1_1", "B1_2"],
          pin3: ["B2_1", "B2_2"],
          pin4: ["B3_1", "B3_2"],
        }}
        showPinAliases
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
