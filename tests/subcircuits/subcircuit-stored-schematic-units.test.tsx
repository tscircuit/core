import { expect, test } from "bun:test"
import { convertSchematicLengthUnits } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mm and inch subcircuits serialize and re-import physical component geometry", async () => {
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
      <subcircuit circuitJson={stored} />
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
    expect(
      components.find((c) => c.schematic_length_unit === "mm")?.center.x,
    ).toBeCloseTo(25.4, 10)
    expect(
      components.find((c) => c.schematic_length_unit === "in")?.center.x,
    ).toBeCloseTo(-1, 10)
    const [first, second] = convertSchematicLengthUnits(
      components,
      "mm",
    ).filter((e) => e.type === "schematic_component")
    expect(first.size.width).toBeCloseTo(second.size.width, 10)
  }
})
