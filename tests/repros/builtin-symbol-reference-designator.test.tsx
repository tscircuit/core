import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("built-in resistor labels do not trigger missing reference designator warnings", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <resistor name="R_ENC_SDA" resistance="4.7k" schX={-1} schRotation={90} />
      <resistor name="R_ENC_SCL" resistance="4.7k" schX={1} schRotation={90} />
      <resistor name="R_BUZZER" resistance="1k" schY={-2} />
    </board>,
  )
  await circuit.renderUntilSettled()

  // These labels live in the library symbol, not standalone schematic_text.
  expect(circuit.db.schematic_text.list()).toHaveLength(0)
  expect(
    circuit.db.schematic_component_styling_warning
      .list()
      .filter(
        (warning) =>
          warning.styling_issue_type === "missing_reference_designator_text",
      ),
  ).toEqual([])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
