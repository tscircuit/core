import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic DRC warns when component bounds overlap", async () => {
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true },
  })

  circuit.add(
    <board>
      <resistor name="R1" resistance="1k" schX={0} schY={0} />
      <resistor name="R2" resistance="2k" schX={0.1} schY={0} />
      {/* R3 only touches R2's right boundary and must not trigger a warning. */}
      <resistor name="R3" resistance="3k" schX={0.7} schY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.schematic_component_overlap_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toBe("Schematic components R1 and R2 overlap")
  expect(warnings[0].schematic_component_ids).toHaveLength(2)
  expect(() => any_circuit_element.parse(warnings[0])).not.toThrow()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
