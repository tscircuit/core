import { convertSchematicLengthUnits } from "@tscircuit/circuit-json-util"
import { expect, test } from "bun:test"
import { LEGACY_SCHEMATIC_LENGTH_UNIT } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mm and inch subcircuits round-trip placements in explicitly tagged legacy geometry", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board name="Main" defaultSchematicLengthUnit="mm">
      <resistor name="R1" resistance="1k" schX="25.4mm" />
      <subcircuit name="Child" defaultSchematicLengthUnit="in">
        <resistor name="R2" resistance="2k" schX="-1in" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  const stored = circuit.getCircuitJson()
  const imported = getTestFixture({ platform: { pcbDisabled: true } }).circuit
  imported.add(
    <board>
      <subcircuit circuitJson={convertSchematicLengthUnits(stored, "in")} />
    </board>,
  )
  await imported.renderUntilSettled()
  for (const json of [stored, imported.getCircuitJson()]) {
    expect(
      json.find((e) => e.type === "source_group" && e.name === "Child"),
    ).toMatchObject({
      default_schematic_length_unit: "in",
    })
    const components = json.filter((e) => e.type === "schematic_component")
    expect(components).toHaveLength(2)
    for (const component of components)
      expect(component.schematic_length_unit).toBe(LEGACY_SCHEMATIC_LENGTH_UNIT)
    const [left, right] = components.sort((a, b) => a.center.x - b.center.x)
    expect(left.center.x).toBeCloseTo(-2.75, 10)
    expect(right.center.x).toBeCloseTo(2.75, 10)
    expect(left.size).toEqual(right.size)
  }
})
