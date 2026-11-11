import { expect, test } from "bun:test"
import BenchSupplyStatusIndicator from "tests/fixtures/bench-supply-status-indicator"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "the bench supply copper legend should inherit its 90 degree group rotation",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(<BenchSupplyStatusIndicator />)
    await circuit.renderUntilSettled()

    const normalizedRotations = circuit.db.pcb_copper_text
      .list()
      .map((label) => (((label.ccw_rotation ?? 0) % 360) + 360) % 360)
    expect(normalizedRotations).toEqual([90])
  },
)
