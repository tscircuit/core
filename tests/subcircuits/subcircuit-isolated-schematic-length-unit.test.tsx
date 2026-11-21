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
  const centers = circuit.db.schematic_component
    .list()
    .map((component) => component.center.x)
    .sort((a, b) => a - b)
  for (const component of circuit.db.schematic_component.list()) {
    expect(component.center.y).toBeCloseTo(1.1, 10)
  }
  expect(centers).toHaveLength(2)
  expect(centers[0]).toBeCloseTo(0.4 / (10.16 / 1.1), 10)
  expect(centers[1]).toBeCloseTo(1.1, 10)
})
