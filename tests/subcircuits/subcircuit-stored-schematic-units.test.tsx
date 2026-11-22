import { expect, test } from "bun:test"
import { convertSchematicLengthUnits } from "@tscircuit/circuit-json-util"
import { LEGACY_SCHEMATIC_LENGTH_UNIT } from "circuit-json"
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
  const child = stored.find(
    (e) => e.type === "source_group" && e.name === "Child",
  )
  expect(child).toMatchObject({ default_schematic_length_unit: "in" })
  const components = stored.filter((e) => e.type === "schematic_component")
  expect(components).toHaveLength(2)
  expect(components.find((c) => c.center.x > 0)?.schematic_length_unit).toBe(
    "mm",
  )
  expect(components.find((c) => c.center.x < 0)?.schematic_length_unit).toBe(
    "in",
  )
  expect(components.find((c) => c.center.x > 0)?.center.x).toBeCloseTo(25.4, 10)
  expect(components.find((c) => c.center.x < 0)?.center.x).toBeCloseTo(-1, 10)
  const mm = convertSchematicLengthUnits(stored, "mm").filter(
    (e) => e.type === "schematic_component",
  )
  expect(mm[0].size.width).toBeCloseTo(mm[1].size.width, 10)

  const imported = getTestFixture({ platform: { pcbDisabled: true } }).circuit
  imported.add(
    <board>
      <subcircuit circuitJson={stored} />
    </board>,
  )
  await imported.renderUntilSettled()
  const roundTrip = imported.getCircuitJson()
  expect(
    roundTrip.find((e) => e.type === "source_group" && e.name === "Child"),
  ).toMatchObject({ default_schematic_length_unit: "in" })
  const centers = convertSchematicLengthUnits(
    roundTrip,
    LEGACY_SCHEMATIC_LENGTH_UNIT,
  )
    .filter((e) => e.type === "schematic_component")
    .map((c) => c.center.x)
    .sort((a, b) => a - b)
  expect(centers).toHaveLength(2)
  expect(centers[0]).toBeCloseTo(-2.75, 10)
  expect(centers[1]).toBeCloseTo(2.75, 10)
})
