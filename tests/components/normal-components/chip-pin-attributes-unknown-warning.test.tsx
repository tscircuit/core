import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unknown pin names and misspelled attribute fields are included in one warning", async () => {
  const { circuit } = getTestFixture()
  const pinAttributes = {
    DATA: { isInput: true, isOuput: true },
    GROUND: { requiresGround: true },
    NOT_A_PIN: { isOutput: true },
  }
  const originalAttributes = structuredClone(pinAttributes)
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="pinrow2"
        pinLabels={{ pin1: "DATA", pin2: "GROUND" }}
        pinAttributes={pinAttributes}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain(
    "DATA (unknown pinAttributes fields: isOuput)",
  )
  expect(warnings[0]!.message).toContain(
    "NOT_A_PIN (does not match a chip pin)",
  )
  expect(warnings[0]!.source_port_ids).toHaveLength(1)
  expect(pinAttributes).toEqual(originalAttributes)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
