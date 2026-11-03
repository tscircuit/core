import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  obstacleContainsPoint,
  padObstaclePreview,
} from "tests/fixtures/rounded-pad-obstacles"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("repro: rounded pad copper becomes square SRJ corners", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={15} routingDisabled schematicDisabled>
      {[0, 33, 90, 180, 270].map((rotation, column) => (
        <chip
          key={rotation}
          name={`J_${rotation}`}
          pcbX={-10 + column * 5}
          pcbY={3}
          pcbRotation={rotation}
          pinLabels={{ pin1: "ROUNDRECT" }}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={3}
                height={2}
                cornerRadius={0.5}
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="SOURCE: 3 x 2 mm pads / R0.5"
        pcbY={6.2}
        fontSize={0.6}
      />
      <pcbnotetext
        text="SRJ: corners should match source"
        pcbY={-6}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const before = JSON.stringify(circuitJson)
  const obstacles = getObstaclesFromCircuitJson(circuitJson)
  let occupiedEmptyCorners = 0
  for (const pad of circuit.db.pcb_smtpad.list()) {
    if (pad.shape !== "rect" && pad.shape !== "rotated_rect")
      throw new Error("Expected rectangular pad")
    expect(pad.corner_radius).toBe(0.5)
    const transform = compose(
      translate(pad.x, pad.y),
      rotateDEG(pad.shape === "rotated_rect" ? pad.ccw_rotation : 0),
    )
    const padObstacles = obstacles.filter(
      (obstacle) =>
        obstacle.circuitJsonMetadata?.pcb_smtpad_id === pad.pcb_smtpad_id,
    )
    // This point lies inside the bounding rectangle but outside its R0.5 corner.
    const emptyCorner = applyToPoint(transform, {
      x: pad.width / 2 - 0.05,
      y: pad.height / 2 - 0.05,
    })
    if (
      padObstacles.some((obstacle) =>
        obstacleContainsPoint(obstacle, emptyCorner),
      )
    )
      occupiedEmptyCorners++
    expect(
      padObstacles.some((obstacle) =>
        obstacleContainsPoint(obstacle, { x: pad.x, y: pad.y }),
      ),
    ).toBe(true)
  }
  expect(occupiedEmptyCorners).toBe(5)
  expect(JSON.stringify(circuitJson)).toBe(before)
  await expect([
    ...circuitJson,
    ...padObstaclePreview(obstacles),
  ]).toMatchPcbSnapshot(import.meta.path)
})
