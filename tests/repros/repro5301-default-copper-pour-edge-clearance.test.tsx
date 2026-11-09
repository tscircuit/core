import { expect, test } from "bun:test"
import { checkCopperToBoardEdgeClearance } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const arcRadius = 15
const arcPointCount = 49
const arcStartDegrees = -60
const arcSweepDegrees = 300

const outline = Array.from({ length: arcPointCount }, (_, pointIndex) => {
  const angleDegrees =
    arcStartDegrees + (arcSweepDegrees * pointIndex) / (arcPointCount - 1)
  const angleRadians = (angleDegrees * Math.PI) / 180
  return {
    x: arcRadius * Math.cos(angleRadians),
    y: arcRadius * Math.sin(angleRadians),
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

    expect(
      checkCopperToBoardEdgeClearance(circuit.getCircuitJson()),
    ).toHaveLength(0)
  },
)
