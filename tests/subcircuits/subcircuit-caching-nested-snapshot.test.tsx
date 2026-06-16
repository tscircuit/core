import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  addNestedCachedSubcircuitBoard,
  getSubcircuitCachingPlatformConfig,
} from "./subcircuit-caching-benchmark-fixtures"

test("subcircuit caching nested pcb snapshot", async () => {
  const { circuit } = getTestFixture({
    platform: getSubcircuitCachingPlatformConfig(),
  })

  addNestedCachedSubcircuitBoard(circuit)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
