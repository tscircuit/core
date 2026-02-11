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

  circuit.render()

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

  // IDs from S1 should be prefixed with "isolated_S1_"
  const s1Components = sourceComponents.filter(
    (e: any) =>
      typeof e.source_component_id === "string" &&
      e.source_component_id.startsWith("isolated_S1_"),
  )
  expect(s1Components.length).toBeGreaterThanOrEqual(1)

  // IDs from S2 should be prefixed with "isolated_S2_"
  const s2Components = sourceComponents.filter(
    (e: any) =>
      typeof e.source_component_id === "string" &&
      e.source_component_id.startsWith("isolated_S2_"),
  )
  expect(s2Components.length).toBeGreaterThanOrEqual(1)

  // R1 should have a non-prefixed ID
  const r1 = sourceComponents.find(
    (e: any) =>
      e.name === "R1" && !e.source_component_id?.startsWith("isolated_"),
  )
  expect(r1).toBeDefined()
})
