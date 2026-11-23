import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached subcircuits inherit and override the board placement unit", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board defaultSchematicLengthUnit="mm">
      <subcircuit
        name="S1"
        defaultSchematicLengthUnit={undefined}
        _subcircuitCachingEnabled
      >
        <resistor name="R1" resistance="1k" schX={0.4} schY="10.16mm" />
      </subcircuit>
      <subcircuit
        name="S2"
        defaultSchematicLengthUnit="in"
        _subcircuitCachingEnabled
      >
        <resistor name="R1" resistance="1k" schX={0.4} schY="10.16mm" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  const components = circuit.db.schematic_component.list()
  expect(components).toHaveLength(2)
  for (const unit of ["mm", "in"] as const) {
    const component = components.find((c) => c.schematic_length_unit === unit)
    expect(component?.center.x).toBeCloseTo(0.4, 10)
  }
  expect(
    components.find((c) => c.schematic_length_unit === "in")?.center.y,
  ).toBeCloseTo(0.4, 10)
  expect(
    components.find((c) => c.schematic_length_unit === "mm")?.center.y,
  ).toBeCloseTo(10.16, 10)
})
