import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  addCachedSubcircuitPanel,
  getSubcircuitCachingPlatformConfig,
} from "./subcircuit-caching-benchmark-fixtures"

test("subcircuit caching panel pcb snapshot", async () => {
  const { circuit } = getTestFixture({
    platform: getSubcircuitCachingPlatformConfig(),
  })

  addCachedSubcircuitPanel(circuit)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
