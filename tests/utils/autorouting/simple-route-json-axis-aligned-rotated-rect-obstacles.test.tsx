import { expect, test } from "bun:test"
import type { PcbSmtPadRotatedRect } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("axis-aligned rotated_rect pads become single simple-route obstacles", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin1"]}
              ccwRotation={0}
              pcbX={-8}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin2"]}
              ccwRotation={90}
              pcbX={-4}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin3"]}
              ccwRotation={180}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin4"]}
              ccwRotation={270}
              pcbX={4}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin5"]}
              ccwRotation={45}
              pcbX={8}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const rotatedPads = circuit
    .getCircuitJson()
    .filter(
      (element): element is PcbSmtPadRotatedRect =>
        element.type === "pcb_smtpad" && element.shape === "rotated_rect",
    )

  expect(rotatedPads).toHaveLength(5)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  for (const pad of rotatedPads) {
    const matchingObstacles = simpleRouteJson.obstacles.filter((obstacle) =>
      obstacle.connectedTo.includes(pad.pcb_smtpad_id),
    )

    if (pad.ccw_rotation === 45) {
      expect(matchingObstacles.length).toBeGreaterThan(1)
      continue
    }

    expect(matchingObstacles).toHaveLength(1)

    const [obstacle] = matchingObstacles
    const isVertical = pad.ccw_rotation === 90 || pad.ccw_rotation === 270

    expect(obstacle.center.x).toBeCloseTo(pad.x, 6)
    expect(obstacle.center.y).toBeCloseTo(pad.y, 6)
    expect(obstacle.width).toBeCloseTo(isVertical ? pad.height : pad.width, 6)
    expect(obstacle.height).toBeCloseTo(isVertical ? pad.width : pad.height, 6)
  }
})
