import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Test that multiple independent root circuits rendering simultaneously
 * don't interfere with each other's subcircuit caching.
 *
 * This tests the potential issue where the module-level pendingRenders map
 * could cause cross-contamination between different circuits.
 */
test("parallel root circuits with different subcircuits don't interfere", async () => {
  // Create two independent circuits with DIFFERENT subcircuit content
  const { circuit: circuit1 } = getTestFixture()
  const { circuit: circuit2 } = getTestFixture()

  // Circuit 1 has subcircuits with 1k resistors
  circuit1.add(
    <board width="50mm" height="50mm">
      <subcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="1k" pcbX={0} pcbY={0} />
      </subcircuit>
      <subcircuit name="S2" _subcircuitCachingEnabled pcbX={10} pcbY={0}>
        <resistor name="R1" resistance="1k" pcbX={0} pcbY={0} />
      </subcircuit>
    </board>,
  )

  // Circuit 2 has subcircuits with 2k resistors (different content!)
  circuit2.add(
    <board width="50mm" height="50mm">
      <subcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="2k" pcbX={0} pcbY={0} />
      </subcircuit>
      <subcircuit name="S2" _subcircuitCachingEnabled pcbX={10} pcbY={0}>
        <resistor name="R1" resistance="2k" pcbX={0} pcbY={0} />
      </subcircuit>
    </board>,
  )

  // Render both circuits in parallel
  await Promise.all([
    circuit1.renderUntilSettled(),
    circuit2.renderUntilSettled(),
  ])

  // Verify circuit1 has all 1k resistors
  const circuit1Resistors = circuit1.db.source_component.list()
  expect(circuit1Resistors.length).toBe(2)
  for (const r of circuit1Resistors) {
    expect((r as any).resistance).toBe(1000) // 1k = 1000 ohms
  }

  // Verify circuit2 has all 2k resistors
  const circuit2Resistors = circuit2.db.source_component.list()
  expect(circuit2Resistors.length).toBe(2)
  for (const r of circuit2Resistors) {
    expect((r as any).resistance).toBe(2000) // 2k = 2000 ohms
  }

  // Each circuit should have its own cache entry
  expect(circuit1.cachedSubcircuits?.size).toBe(1)
  expect(circuit2.cachedSubcircuits?.size).toBe(1)
})

test("parallel root circuits with identical subcircuits work correctly", async () => {
  // Create two independent circuits with IDENTICAL subcircuit content
  const { circuit: circuit1 } = getTestFixture()
  const { circuit: circuit2 } = getTestFixture()

  // Both circuits have identical subcircuits
  const addSubcircuits = (circuit: typeof circuit1) => {
    circuit.add(
      <board width="50mm" height="50mm">
        <subcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0}>
          <resistor name="R1" resistance="1k" pcbX={0} pcbY={0} />
          <resistor name="R2" resistance="2k" pcbX={5} pcbY={0} />
        </subcircuit>
        <subcircuit name="S2" _subcircuitCachingEnabled pcbX={10} pcbY={0}>
          <resistor name="R1" resistance="1k" pcbX={0} pcbY={0} />
          <resistor name="R2" resistance="2k" pcbX={5} pcbY={0} />
        </subcircuit>
      </board>,
    )
  }

  addSubcircuits(circuit1)
  addSubcircuits(circuit2)

  // Render both circuits in parallel
  await Promise.all([
    circuit1.renderUntilSettled(),
    circuit2.renderUntilSettled(),
  ])

  // Both circuits should have correct components
  expect(circuit1.db.source_component.list().length).toBe(4) // 2 subcircuits × 2 resistors
  expect(circuit2.db.source_component.list().length).toBe(4)

  // Verify resistance values are correct in both circuits
  const getResistances = (circuit: typeof circuit1) =>
    circuit.db.source_component
      .list()
      .map((c: any) => c.resistance)
      .sort((a: number, b: number) => a - b)

  expect(getResistances(circuit1)).toEqual([1000, 1000, 2000, 2000])
  expect(getResistances(circuit2)).toEqual([1000, 1000, 2000, 2000])

  // Each circuit should have its own cache
  expect(circuit1.cachedSubcircuits?.size).toBe(1)
  expect(circuit2.cachedSubcircuits?.size).toBe(1)

  // The caches should be separate instances
  expect(circuit1.cachedSubcircuits).not.toBe(circuit2.cachedSubcircuits)
})

test("sequential renders after parallel don't reuse wrong cache", async () => {
  // First, render two circuits in parallel
  const { circuit: circuit1 } = getTestFixture()
  const { circuit: circuit2 } = getTestFixture()

  circuit1.add(
    <board width="50mm" height="50mm">
      <subcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="1k" pcbX={0} pcbY={0} />
      </subcircuit>
    </board>,
  )

  circuit2.add(
    <board width="50mm" height="50mm">
      <subcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="2k" pcbX={0} pcbY={0} />
      </subcircuit>
    </board>,
  )

  await Promise.all([
    circuit1.renderUntilSettled(),
    circuit2.renderUntilSettled(),
  ])

  // Now create a third circuit after the parallel renders complete
  const { circuit: circuit3 } = getTestFixture()
  circuit3.add(
    <board width="50mm" height="50mm">
      <subcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="3k" pcbX={0} pcbY={0} />
      </subcircuit>
    </board>,
  )

  await circuit3.renderUntilSettled()

  // Circuit3 should have its own 3k resistor, not contaminated by circuit1 or circuit2
  const circuit3Resistors = circuit3.db.source_component.list()
  expect(circuit3Resistors.length).toBe(1)
  expect((circuit3Resistors[0] as any).resistance).toBe(3000)
})
