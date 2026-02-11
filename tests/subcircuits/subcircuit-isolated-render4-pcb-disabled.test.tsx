import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit respects pcbDisabled flag from parent", async () => {
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true },
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

  // PCB components should NOT be generated since pcbDisabled is true
  const pcbComponents = circuitJson.filter(
    (e: any) => e.type === "pcb_component",
  )
  expect(pcbComponents.length).toBe(0)

  // Source components should still be generated
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  expect(sourceComponents.length).toBeGreaterThanOrEqual(1)
})
