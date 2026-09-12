import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("small polygon and circular cutouts remain obstacles on every board layer", async () => {
  const { circuit } = getTestFixture()
  const slots = [
    { height: 0.2, y: 0.5 },
    { height: 0.3, y: -0.5 },
  ]

  circuit.add(
    <board width={6} height={3} layers={4} routingDisabled>
      {slots.map(({ height, y }) => (
        <Fragment key={height}>
          <cutout
            shape="polygon"
            pcbX={-1}
            pcbY={y}
            points={[
              { x: -1, y: -height / 2 },
              { x: 1, y: -height / 2 },
              { x: 1, y: height / 2 },
              { x: -1, y: height / 2 },
            ]}
          />
        </Fragment>
      ))}
      <cutout shape="circle" radius={0.1} pcbX={1.5} />
      <pcbnotetext
        pcbX={-1}
        pcbY={0.9}
        text="0.2 mm polygon slot"
        fontSize={0.15}
      />
      <pcbnotetext
        pcbX={-1}
        pcbY={-0.9}
        text="0.3 mm polygon slot"
        fontSize={0.15}
      />
      <pcbnotetext pcbX={1.5} pcbY={0.5} text="0.2 mm circle" fontSize={0.15} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.obstacles).toHaveLength(slots.length + 1)
  for (const { height, y } of slots) {
    const obstacle = simpleRouteJson.obstacles.find(
      (candidate) => Math.abs(candidate.center.y - y) < 1e-6,
    )!
    expect(obstacle).toBeDefined()
    expect(obstacle.center.x).toBeCloseTo(-1)
    expect(obstacle.width).toBeCloseTo(2)
    expect(obstacle.height).toBeCloseTo(height)
    expect(obstacle.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    expect(obstacle.connectedTo).toEqual([])
  }

  const circleObstacle = simpleRouteJson.obstacles.find(
    (obstacle) => Math.abs(obstacle.center.x - 1.5) < 1e-6,
  )!
  expect(circleObstacle).toBeDefined()
  expect(circleObstacle.center.y).toBeCloseTo(0)
  expect(circleObstacle.width).toBeCloseTo(0.2)
  expect(circleObstacle.height).toBeCloseTo(0.2)
  expect(circleObstacle.layers).toEqual(["top", "inner1", "inner2", "bottom"])
  expect(circleObstacle.connectedTo).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
