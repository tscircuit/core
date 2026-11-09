import { expect, test } from "bun:test"
import { checkCopperToBoardEdgeClearance } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const radius = 15
const outline = Array.from({ length: 49 }, (_, index) => {
  const angleDegrees = -60 + (300 * index) / 48
  const angleRadians = (angleDegrees * Math.PI) / 180
  return {
    x: radius * Math.cos(angleRadians),
    y: radius * Math.sin(angleRadians),
  }
})

test.failing(
  "default copper pour respects board edge clearance on a polygon outline",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board outline={outline}>
        <resistor name="R1" resistance="1k" footprint="0603" />
        <trace from=".R1 > .pin1" to="net.GND" />
        <trace from=".R1 > .pin2" to="net.GND" />
        <copperpour connectsTo="net.GND" layer="top" />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)
    expect(
      checkCopperToBoardEdgeClearance(circuit.getCircuitJson()),
    ).toHaveLength(0)
  },
)
