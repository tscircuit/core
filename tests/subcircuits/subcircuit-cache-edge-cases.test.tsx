import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A simple cached subcircuit for testing edge cases.
 */
function SimpleSubcircuit({
  name,
  ...props
}: { name: string } & Record<string, any>) {
  return (
    <subcircuit name={name} {...props}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbY={2} />
      <trace from=".R1 .pin1" to=".C1 .pin1" />
    </subcircuit>
  )
}

/**
 * Issue 1: Verify cache is shared across boards in a panel.
 * All boards in a panel should share the same root circuit and cache.
 */
test("cache is shared across boards in a panel", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width={60} height={60} layoutMode="grid">
      <board key="b1" width="15mm" height="10mm">
        <SimpleSubcircuit name="S1" _subcircuitCachingEnabled pcbX={0} />
      </board>
      <board key="b2" width="15mm" height="10mm">
        <SimpleSubcircuit name="S2" _subcircuitCachingEnabled pcbX={0} />
      </board>
      <board key="b3" width="15mm" height="10mm">
        <SimpleSubcircuit name="S3" _subcircuitCachingEnabled pcbX={0} />
      </board>
      <board key="b4" width="15mm" height="10mm">
        <SimpleSubcircuit name="S4" _subcircuitCachingEnabled pcbX={0} />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  // All 4 boards should share the same cache entry
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify all 4 subcircuits rendered correctly
  expect(circuit.db.source_component.list().length).toBe(8) // 4 × 2
  expect(circuit.db.pcb_trace.list().length).toBe(4) // 4 × 1
})

/**
 * Issue 4: Verify that simultaneous cache misses don't cause duplicate rendering.
 * When multiple identical subcircuits render at the same time, ideally only one
 * should do the full render and the others should wait for or reuse the cache.
 *
 * This test verifies that even if multiple async effects are queued, the final
 * output is correct (no duplicate components or traces).
 */
test("simultaneous cache misses produce correct output", async () => {
  const { circuit } = getTestFixture()

  // Add many identical subcircuits that will all try to render simultaneously
  circuit.add(
    <board width="100mm" height="100mm">
      <SimpleSubcircuit
        name="S1"
        _subcircuitCachingEnabled
        pcbX={-40}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="S2"
        _subcircuitCachingEnabled
        pcbX={-20}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="S3"
        _subcircuitCachingEnabled
        pcbX={0}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="S4"
        _subcircuitCachingEnabled
        pcbX={20}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="S5"
        _subcircuitCachingEnabled
        pcbX={40}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="S6"
        _subcircuitCachingEnabled
        pcbX={-40}
        pcbY={0}
      />
      <SimpleSubcircuit
        name="S7"
        _subcircuitCachingEnabled
        pcbX={-20}
        pcbY={0}
      />
      <SimpleSubcircuit name="S8" _subcircuitCachingEnabled pcbX={0} pcbY={0} />
      <SimpleSubcircuit
        name="S9"
        _subcircuitCachingEnabled
        pcbX={20}
        pcbY={0}
      />
      <SimpleSubcircuit
        name="S10"
        _subcircuitCachingEnabled
        pcbX={40}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Should have exactly 1 cache entry (all are identical)
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify correct number of components (no duplicates)
  // 10 subcircuits × 2 components each = 20
  expect(circuit.db.source_component.list().length).toBe(20)

  // Verify correct number of traces (no duplicates)
  // 10 subcircuits × 1 trace each = 10
  expect(circuit.db.pcb_trace.list().length).toBe(10)

  // Verify all resistors have distinct source_component_ids
  const resistors = circuit.db.source_component
    .list()
    .filter((c) => c.ftype === "simple_resistor")
  const resistorIds = new Set(resistors.map((r) => r.source_component_id))
  expect(resistorIds.size).toBe(10) // All unique IDs
})

/**
 * Issue 5: Verify cached subcircuits work when nested inside non-cached parent subcircuits.
 */
test("cached subcircuits nested inside non-cached parent subcircuits", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="50mm">
      {/* Non-cached parent subcircuit containing cached children */}
      <subcircuit name="Parent1" pcbX={-30}>
        <SimpleSubcircuit name="Child1" _subcircuitCachingEnabled pcbX={0} />
        <SimpleSubcircuit name="Child2" _subcircuitCachingEnabled pcbX={15} />
      </subcircuit>

      {/* Another non-cached parent with identical cached children */}
      <subcircuit name="Parent2" pcbX={30}>
        <SimpleSubcircuit name="Child3" _subcircuitCachingEnabled pcbX={0} />
        <SimpleSubcircuit name="Child4" _subcircuitCachingEnabled pcbX={15} />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  // All 4 cached subcircuits should share 1 cache entry
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify all components rendered correctly
  // 4 cached subcircuits × 2 components = 8
  expect(circuit.db.source_component.list().length).toBe(8)

  // Verify all traces rendered correctly
  // 4 cached subcircuits × 1 trace = 4
  expect(circuit.db.pcb_trace.list().length).toBe(4)
})

/**
 * Verify cached subcircuits work at multiple nesting levels within non-cached subcircuits.
 */
test("cached subcircuits deeply nested in non-cached subcircuits", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="50mm">
      {/* Deeply nested structure */}
      <subcircuit name="Level1" pcbX={0}>
        <subcircuit name="Level2" pcbX={0}>
          <SimpleSubcircuit name="Deep1" _subcircuitCachingEnabled pcbX={-20} />
          <SimpleSubcircuit name="Deep2" _subcircuitCachingEnabled pcbX={0} />
          <SimpleSubcircuit name="Deep3" _subcircuitCachingEnabled pcbX={20} />
        </subcircuit>
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  // All 3 cached subcircuits should share 1 cache entry
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify all components rendered correctly
  // 3 cached subcircuits × 2 components = 6
  expect(circuit.db.source_component.list().length).toBe(6)

  // Verify all traces rendered correctly
  // 3 cached subcircuits × 1 trace = 3
  expect(circuit.db.pcb_trace.list().length).toBe(3)
})

/**
 * Verify that cached and non-cached subcircuits can coexist at the same level.
 */
test("mixed cached and non-cached subcircuits at same level", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="50mm">
      {/* Cached subcircuits */}
      <SimpleSubcircuit name="Cached1" _subcircuitCachingEnabled pcbX={-30} />
      <SimpleSubcircuit name="Cached2" _subcircuitCachingEnabled pcbX={-10} />

      {/* Non-cached subcircuit with same content */}
      <subcircuit name="NonCached" pcbX={10}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
        <capacitor name="C1" capacitance="100nF" footprint="0402" pcbY={2} />
        <trace from=".R1 .pin1" to=".C1 .pin1" />
      </subcircuit>

      {/* Another cached subcircuit */}
      <SimpleSubcircuit name="Cached3" _subcircuitCachingEnabled pcbX={30} />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Only the 3 cached subcircuits share a cache entry
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify all components rendered correctly
  // 3 cached + 1 non-cached = 4 subcircuits × 2 components = 8
  expect(circuit.db.source_component.list().length).toBe(8)

  // Verify all traces rendered correctly
  // 4 subcircuits × 1 trace = 4
  expect(circuit.db.pcb_trace.list().length).toBe(4)
})
