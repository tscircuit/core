import { LEGACY_SCHEMATIC_LENGTH_UNIT } from "circuit-json"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solver labels, debug geometry and construction errors carry the legacy geometry unit", () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board defaultSchematicLengthUnit="mm">
      <subcircuit
        name="Child"
        defaultSchematicLengthUnit="in"
        // @ts-expect-error internal debug flag
        _schDebugObjectsEnabled
      >
        <resistor name="R1" resistance="1k" schX={1} />
        <trace from=".R1 > .pin1" to="net.GND" />
        {/* @ts-expect-error missing resistance */}
        <resistor name="Broken" schX="50.8mm" schY="-1in" pcbX={3} />
      </subcircuit>
    </board>,
  )
  circuit.render()
  const json = circuit.getCircuitJson()
  expect(
    json.find((e) => e.type === "source_failed_to_create_component_error"),
  ).toMatchObject({
    schematic_length_unit: LEGACY_SCHEMATIC_LENGTH_UNIT,
    schematic_center: { x: 5.5, y: -2.75 },
    pcb_center: { x: 3, y: 0 },
  })
  for (const type of [
    "schematic_port",
    "schematic_net_label",
    "schematic_debug_object",
  ] as const) {
    const records = json.filter((e) => e.type === type)
    expect(records.length).toBeGreaterThan(0)
    for (const record of records)
      expect(record).toHaveProperty(
        "schematic_length_unit",
        LEGACY_SCHEMATIC_LENGTH_UNIT,
      )
  }
})
