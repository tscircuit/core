import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic chip width separates visible labels for strings and arrays", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  // PWM_OUT and VMM visibly collide in the array chip before the fix.
  // Use the same text and automatic sizing for both chips.
  const labels = ["PWM_OUT", "GND", "EN", "DIR", "VCC", "VMM"]
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
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1200,
    height: 600,
  })
})
