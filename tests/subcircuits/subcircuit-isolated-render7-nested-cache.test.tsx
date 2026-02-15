import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested cached subcircuits with different parents share cache", async () => {
  const { circuit } = getTestFixture()

  // Create a common subcircuit structure that will be reused
  // Each parent group (G1 and G2) contains an identical cached subcircuit
  circuit.add(
    <board width="40mm" height="30mm">
      {/* First parent group */}
      <group name="G1" pcbX={-10}>
        <subcircuit name="S1" _subcircuitCachingEnabled>
          <resistor name="R1" resistance="1k" footprint="0402" />
          <capacitor name="C1" capacitance="100nF" footprint="0402" pcbY={2} />
          <trace from=".R1 .pin1" to=".C1 .pin1" />
        </subcircuit>
      </group>

      {/* Second parent group with identical cached subcircuit */}
      <group name="G2" pcbX={10}>
        <subcircuit name="S2" _subcircuitCachingEnabled>
          <resistor name="R1" resistance="1k" footprint="0402" />
          <capacitor name="C1" capacitance="100nF" footprint="0402" pcbY={2} />
          <trace from=".R1 .pin1" to=".C1 .pin1" />
        </subcircuit>
      </group>

      {/* Third instance directly on board */}
      <subcircuit name="S3" _subcircuitCachingEnabled pcbX={0} pcbY={10}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="100nF" footprint="0402" pcbY={2} />
        <trace from=".R1 .pin1" to=".C1 .pin1" />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  // All three subcircuits have identical props (excluding name/position)
  // so they should share one cache entry
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify all components rendered correctly
  // 3 subcircuits × 2 components each = 6 source components
  const sourceComponents = circuit.db.source_component.list()
  expect(sourceComponents.length).toBe(6)

  // Verify all traces were created with PCB routes
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBe(3)

  // Each trace should have a route
  for (const trace of pcbTraces) {
    expect(trace.route.length).toBeGreaterThan(0)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
