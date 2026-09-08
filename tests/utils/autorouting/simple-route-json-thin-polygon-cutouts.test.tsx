import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("thin polygon cutouts remain obstacles on every board layer", async () => {
  const { circuit } = getTestFixture()
  const slots = [
    { height: 0.2, y: 0.5 },
    { height: 0.3, y: -0.5 },
  ]

  circuit.add(
    <board width={4} height={3} layers={4} routingDisabled>
      {slots.map(({ height, y }) => (
        <Fragment key={height}>
          <cutout
            shape="polygon"
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
      <pcbnotetext pcbY={0.9} text="0.2 mm polygon slot" fontSize={0.15} />
      <pcbnotetext pcbY={-0.9} text="0.3 mm polygon slot" fontSize={0.15} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.obstacles).toHaveLength(slots.length)
  for (const { height, y } of slots) {
    const obstacle = simpleRouteJson.obstacles.find(
      (candidate) => Math.abs(candidate.center.y - y) < 1e-6,
    )!
    expect(obstacle).toBeDefined()
    expect(obstacle.center.x).toBeCloseTo(0)
    expect(obstacle.width).toBeCloseTo(2)
    expect(obstacle.height).toBeCloseTo(height)
    expect(obstacle.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    expect(obstacle.connectedTo).toEqual([])
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
