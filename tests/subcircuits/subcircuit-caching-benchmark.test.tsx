import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  addCachedSubcircuitPanel,
  addNestedCachedSubcircuitBoard,
  addSingleCachedSubcircuitBoard,
  getSubcircuitCachingPlatformConfig,
} from "./subcircuit-caching-benchmark-fixtures"

test("subcircuit caching benchmark", async () => {
  const platformConfig = getSubcircuitCachingPlatformConfig()

  // ============================================================
  // Test 1: Single subcircuit (baseline)
  // ============================================================
  const { circuit: circuit1 } = getTestFixture({ platform: platformConfig })

  const start1 = performance.now()
  addSingleCachedSubcircuitBoard(circuit1)
  await circuit1.renderUntilSettled()
  const time1 = performance.now() - start1

  expect(circuit1.db.source_component.list().length).toBe(2)
  expect(circuit1.db.pcb_trace.list().length).toBe(2)

  // ============================================================
  // Test 2: Panel with 20 cached subcircuits
  // ============================================================
  const { circuit: circuit2 } = getTestFixture({ platform: platformConfig })

  const start2 = performance.now()
  addCachedSubcircuitPanel(circuit2)
  await circuit2.renderUntilSettled()
  const time2 = performance.now() - start2

  // Should have 20 * 2 = 40 source components
  expect(circuit2.db.source_component.list().length).toBe(40)
  // Should have 20 * 2 = 40 traces
  expect(circuit2.db.pcb_trace.list().length).toBe(40)
  // Should only have 1 cached subcircuit (all 20 share the same cache)
  expect(circuit2.cachedSubcircuits!.size).toBe(1)

  // ============================================================
  // Test 3: 24 cached subcircuits nested at different levels
  // Total: 5 direct + 2 in G1 + 3 in G2 + 4 in G32 + 4 in G3 + 6 in Deep = 24
  // ============================================================
  const { circuit: circuit3 } = getTestFixture({ platform: platformConfig })

  const start3 = performance.now()
  addNestedCachedSubcircuitBoard(circuit3)
  await circuit3.renderUntilSettled()
  const time3 = performance.now() - start3

  // 24 subcircuits x 2 components each = 48 source components
  expect(circuit3.db.source_component.list().length).toBe(48)
  // 24 subcircuits x 2 traces each = 48 traces
  expect(circuit3.db.pcb_trace.list().length).toBe(48)
  // Should have 3 cached subcircuits: KicadSubcircuit, G32, and G3
  expect(circuit3.cachedSubcircuits!.size).toBe(3)

  // ============================================================
  // Log timing results
  // ============================================================
  console.log("\n=== Subcircuit Caching Benchmark Results ===")
  console.log(`Test 1 - Single subcircuit (baseline): ${time1.toFixed(2)}ms`)
  console.log(
    `Test 2 - Panel with 20 cached subcircuits: ${time2.toFixed(2)}ms`,
  )
  console.log(`Test 3 - 20 nested cached subcircuits: ${time3.toFixed(2)}ms`)
  console.log(
    `\nSpeedup factor (panel vs 20x baseline): ${((time1 * 20) / time2).toFixed(2)}x`,
  )
  console.log(
    `Speedup factor (nested vs 24x baseline): ${((time1 * 24) / time3).toFixed(2)}x`,
  )
  console.log("=============================================\n")

  // Verify caching provides meaningful speedup
  // With caching, 20 subcircuits should take much less than 20x the single subcircuit time
  // We expect at least 2x speedup (being conservative due to test variability)
  const expectedMaxTime = time1 * 10 // Should be much faster than 10x baseline
  expect(time2).toBeLessThan(expectedMaxTime)
  expect(time3).toBeLessThan(expectedMaxTime)
})
