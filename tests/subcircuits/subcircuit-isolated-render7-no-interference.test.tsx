import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit does not interfere with main circuit components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter="sequential-trace">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        schX={-5}
      />
      <resistor
        name="R2"
        resistance="2k"
        footprint="0402"
        pcbX={-5}
        pcbY={3}
        schX={-5}
        schY={3}
      />
      <trace from=".R1 .pin2" to=".R2 .pin1" />
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={5}
          schX={5}
        />
        <capacitor
          name="C2"
          capacitance="200nF"
          footprint="0402"
          pcbX={5}
          pcbY={3}
          schX={5}
          schY={3}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Main circuit should have its own source components
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  // R1, R2 from main + C1, C2 from isolated = 4
  expect(sourceComponents.length).toBeGreaterThanOrEqual(4)

  // Main circuit's trace between R1 and R2 should still exist
  const sourceTraces = circuitJson.filter((e: any) => e.type === "source_trace")
  expect(sourceTraces.length).toBeGreaterThanOrEqual(1)

  // Check PCB trace was created for the main circuit
  const pcbTraces = circuitJson.filter((e: any) => e.type === "pcb_trace")
  expect(pcbTraces.length).toBeGreaterThanOrEqual(1)

  // The isolated subcircuit's elements should all be prefixed
  const isolatedComponents = sourceComponents.filter((e: any) =>
    e.source_component_id?.startsWith("isolated_S1_"),
  )
  expect(isolatedComponents.length).toBe(2) // C1 and C2

  // Main circuit's components should NOT be prefixed
  const mainComponents = sourceComponents.filter(
    (e: any) => !e.source_component_id?.startsWith("isolated_"),
  )
  expect(mainComponents.length).toBe(2) // R1 and R2
})
