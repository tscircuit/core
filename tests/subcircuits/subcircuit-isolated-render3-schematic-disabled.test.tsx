import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit respects schematicDisabled flag from parent", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      </subcircuit>
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Schematic components should NOT be generated since schematicDisabled is true
  const schematicComponents = circuitJson.filter(
    (e: any) => e.type === "schematic_component",
  )
  expect(schematicComponents.length).toBe(0)

  // PCB components should still be generated
  const pcbComponents = circuitJson.filter(
    (e: any) => e.type === "pcb_component",
  )
  expect(pcbComponents.length).toBeGreaterThanOrEqual(1)
})
