import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached subcircuits inherit millimeter placement from their board", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board schematicLengthUnit="mm">
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" schX="0.4in" />
      </subcircuit>
      <subcircuit name="S2" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" schX="-0.4in" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  const centers = circuit.db.schematic_component
    .list()
    .map((component) => component.center.x)
    .sort((a, b) => a - b)
  expect(centers).toHaveLength(2)
  expect(centers[0]).toBeCloseTo(-1.1, 10)
  expect(centers[1]).toBeCloseTo(1.1, 10)
})
