import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit respects disabled flags from parent", async () => {
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Source components should still be generated
  expect(
    circuitJson.filter((e: any) => e.type === "source_component").length,
  ).toBeGreaterThanOrEqual(1)

  // PCB and schematic components should NOT be generated
  expect(
    circuitJson.filter((e: any) => e.type === "pcb_component").length,
  ).toBe(0)
  expect(
    circuitJson.filter((e: any) => e.type === "schematic_component").length,
  ).toBe(0)
})
