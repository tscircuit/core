import { expect, test } from "bun:test"
import { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip renders with default name when none provided", () => {
  const { circuit } = getTestFixture()

  // @ts-expect-error - name is not required
  circuit.add(<chip footprint="soic8" />)

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

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
