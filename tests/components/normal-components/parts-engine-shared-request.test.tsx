import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "identical parts share one failed supplier lookup and warning",
  async () => {
    let findPartCallCount = 0
    const partsEngine: PartsEngine = {
      findPart: async () => {
        findPartCallCount++
        throw new Error("supplier service unavailable")
      },
    }
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="12mm" partsEngine={partsEngine}>
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
        <capacitor name="C2" capacitance="100nF" footprint="0402" />
        <capacitor name="C3" capacitance="100nF" footprint="0402" />
        <capacitor name="C4" capacitance="100nF" footprint="0402" />
      </board>,
    )
    await circuit.renderUntilSettled()

    expect(findPartCallCount).toBe(1)
    expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(1)
  },
)
