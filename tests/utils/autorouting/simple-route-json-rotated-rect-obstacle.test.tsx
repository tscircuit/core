import { expect, test } from "bun:test"
import type { PcbSmtPadRotatedRect } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("non-axis-aligned rotated_rect pad becomes a single rotated simple-route obstacle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin1"]}
              ccwRotation={45}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const rotatedPad = circuit
    .getCircuitJson()
    .find(
      (element): element is PcbSmtPadRotatedRect =>
        element.type === "pcb_smtpad" && element.shape === "rotated_rect",
    )

  expect(rotatedPad).toBeDefined()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  const matchingObstacles = simpleRouteJson.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes(rotatedPad!.pcb_smtpad_id),
  )

  expect(matchingObstacles).toHaveLength(1)

  const [obstacle] = matchingObstacles

  expect(obstacle.center.x).toBeCloseTo(rotatedPad!.x, 6)
  expect(obstacle.center.y).toBeCloseTo(rotatedPad!.y, 6)
  expect(obstacle.width).toBeCloseTo(rotatedPad!.width, 6)
  expect(obstacle.height).toBeCloseTo(rotatedPad!.height, 6)
  expect(obstacle.ccwRotationDegrees).toBe(45)
})
