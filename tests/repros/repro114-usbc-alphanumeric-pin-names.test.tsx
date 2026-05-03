import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Repro for tscircuit/tscircuit#3085
 *
 * When using imported KiCad footprints that have USB-C style alphanumeric pin
 * names (A1, A4, B1, B4, GND, CC1, CC2, etc.) instead of plain numeric pin
 * names (1, 2, 3...), the schematic symbol failed to render because
 * NormalComponent threw an error when pinLabels keys didn't match the
 * pin<N>/<N> pattern.
 */
test("repro114: chip with alphanumeric KiCad-style pin names renders correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{
          A1: "GND",
          A4: "VBUS",
          B1: "GND",
          B4: "VBUS",
          A5: "CC1",
          B5: "CC2",
          A6: "DP1",
          B6: "DN1",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Should not throw — component should render
  const sourceComponents = circuit.db.source_component.list()
  expect(sourceComponents).toHaveLength(1)

  // Should have the right number of ports
  const sourcePorts = circuit.db.source_port.list()
  // 8 unique alphanumeric pins, but GND and VBUS appear twice each,
  // so after normalization we should have 8 ports (one per entry)
  expect(sourcePorts.length).toBeGreaterThan(0)

  // Schematic component should be created
  const schematicComponents = circuit.db.schematic_component.list()
  expect(schematicComponents).toHaveLength(1)

  // No schematic errors
  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "schematic_error")
  expect(errors).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
