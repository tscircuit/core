import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Small polygon and circular cutouts produce obstacles in getObstaclesFromCircuitJson", () => {
  const slotObstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_cutout",
      pcb_cutout_id: "thin-slot",
      shape: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 0.2 },
        { x: 0, y: 0.2 },
      ],
    } as any,
  ])

  expect(slotObstacles.length).toBeGreaterThan(0)
  expect(slotObstacles[0].width).toBeCloseTo(2)
  expect(slotObstacles[0].height).toBeCloseTo(0.2)
  expect(slotObstacles[0].center.x).toBeCloseTo(1)
  expect(slotObstacles[0].center.y).toBeCloseTo(0.1)

  const circleObstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_cutout",
      pcb_cutout_id: "small-circle",
      shape: "circle",
      center: { x: 0, y: 0 },
      radius: 0.1,
    } as any,
  ])

  expect(circleObstacles.length).toBeGreaterThan(0)
  expect(circleObstacles[0].width).toBeCloseTo(0.2)
  expect(circleObstacles[0].height).toBeCloseTo(0.2)
  expect(circleObstacles[0].center.x).toBeCloseTo(0)
  expect(circleObstacles[0].center.y).toBeCloseTo(0)
})

test("Small polygon and circular cutouts are emitted as obstacles in simple route json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <cutout
        shape="polygon"
        points={[
          { x: -5, y: 0 },
          { x: -3, y: 0 },
          { x: -3, y: 0.2 },
          { x: -5, y: 0.2 },
        ]}
      />
      <cutout shape="circle" radius="0.1mm" pcbX="3mm" pcbY="3mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  const hasSlotObstacle = simpleRouteJson.obstacles.some((o) => {
    return (
      Math.abs(o.center.x - -4) < 0.1 &&
      Math.abs(o.center.y - 0.1) < 0.1 &&
      Math.abs(o.width - 2) < 0.1 &&
      Math.abs(o.height - 0.2) < 0.1
    )
  })

  const hasCircleObstacle = simpleRouteJson.obstacles.some((o) => {
    return (
      Math.abs(o.center.x - 3) < 0.1 &&
      Math.abs(o.center.y - 3) < 0.1 &&
      Math.abs(o.width - 0.2) < 0.1 &&
      Math.abs(o.height - 0.2) < 0.1
    )
  })

  expect(hasSlotObstacle).toBe(true)
  expect(hasCircleObstacle).toBe(true)
})
