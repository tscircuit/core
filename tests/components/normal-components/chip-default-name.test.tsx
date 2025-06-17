import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip renders with default name when none provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip footprint="soic8" />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip
  expect(chip).not.toBeNull()
  expect(chip.props.name).toBeDefined()

  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_failed_to_create_component_error")
  expect(errors.length).toBe(0)
  expect(chip.pcb_component_id).not.toBeNull()
  expect(chip.schematic_component_id).not.toBeNull()
})
