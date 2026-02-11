import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit IDs do not conflict with main circuit IDs", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        schX={-5}
      />
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor
          name="R2"
          resistance="2k"
          footprint="0402"
          pcbX={3}
          schX={3}
        />
      </subcircuit>
      <subcircuit name="S2" _subcircuitCachingEnabled>
        <resistor
          name="R3"
          resistance="3k"
          footprint="0402"
          pcbX={5}
          schX={5}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // All source_component_ids should be unique
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  const ids = sourceComponents.map((e: any) => e.source_component_id)
  const uniqueIds = new Set(ids)
  expect(uniqueIds.size).toBe(ids.length)

  // Should have 3 source components (R1, R2, R3)
  expect(sourceComponents.length).toBeGreaterThanOrEqual(3)

  // All three resistor names should be present
  const names = sourceComponents.map((e: any) => e.name).sort()
  expect(names).toContain("R1")
  expect(names).toContain("R2")
  expect(names).toContain("R3")
})
