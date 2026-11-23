import { MM_PER_SCHEMATIC_UNIT } from "circuit-json"
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
  const centers = components.map((c) => c.center).sort((a, b) => a.x - b.x)
  expect(centers[0].x * MM_PER_SCHEMATIC_UNIT).toBeCloseTo(0.4, 10)
  expect(centers[1].x * MM_PER_SCHEMATIC_UNIT).toBeCloseTo(10.16, 10)
  for (const center of centers)
    expect(center.y * MM_PER_SCHEMATIC_UNIT).toBeCloseTo(10.16, 10)
})
