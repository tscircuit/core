import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic chip width uses visible labels for string and array pinLabels", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  const labels = ["SCL", "GND", "ALERT", "ADD0", "V_POS", "SDA"]
  const strings = Object.fromEntries(
    labels.map((label, index) => [`pin${index + 1}`, label]),
  )
  const arrays = Object.fromEntries(
    labels.map((label, index) => [`pin${index + 1}`, [label]]),
  )

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="Strings" pinLabels={strings} schX={-2} />
      <chip name="Arrays" pinLabels={arrays} schX={2} />
    </board>,
  )
  circuit.render()

  const [stringBox, arrayBox] = circuit.db.schematic_component.list()
  expect(arrayBox.size).toEqual(stringBox.size)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
