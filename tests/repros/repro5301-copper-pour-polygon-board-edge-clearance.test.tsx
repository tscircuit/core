import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("default copper pour satisfies copper-to-board-edge clearance on a polygon board outline", async () => {
  const { circuit } = getTestFixture()

  const RADIUS = 25
  const START_DEG = 60
  const SWEEP_DEG = 300
  const ARC_STEPS = 48

  const outline = Array.from({ length: ARC_STEPS + 1 }, (_, index) => {
    const angleDeg = START_DEG + (SWEEP_DEG * index) / ARC_STEPS
    const angleRad = (angleDeg * Math.PI) / 180
    return {
      x: Number((RADIUS * Math.cos(angleRad)).toFixed(3)),
      y: Number((RADIUS * Math.sin(angleRad)).toFixed(3)),
    }
  })

  circuit.add(
    <board outline={outline}>
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const placementErrors = circuit.db.pcb_placement_error.list()
  expect(placementErrors).toEqual([])

  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(1)
})
