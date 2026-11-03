import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { Fragment } from "react"
import { obstacleContainsPoint } from "tests/fixtures/rounded-pad-obstacles"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("oval copper obstacles match emitted holes on both board sides", async () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270, 33]
  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).map((layer, row) =>
        rotations.map((rotation, column) => (
          <chip
            key={`${layer}_${rotation}`}
            name={`J_${layer}_${rotation}`}
            layer={layer}
            pcbX={-8 + column * 4}
            pcbY={3 - row * 6}
            pcbRotation={rotation}
            pinLabels={{ pin1: "SHIELD" }}
            footprint={
              <footprint>
                <platedhole
                  portHints={["pin1"]}
                  shape="oval"
                  outerWidth={2.2}
                  outerHeight={3.2}
                  holeWidth={1.2}
                  holeHeight={2.2}
                />
              </footprint>
            }
          />
        )),
      )}
      {(["top", "bottom"] as const).map((layer, row) =>
        rotations.map((rotation, column) => (
          <Fragment key={`${layer}_${rotation}`}>
            <pcbnotetext
              pcbX={-8 + column * 4}
              pcbY={5.4 - row * 6}
              text={`${layer} ${rotation} deg`}
              fontSize={0.4}
            />
          </Fragment>
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes).toHaveLength(10)
  const obstacles = getObstaclesFromCircuitJson(circuit.getCircuitJson())

  for (const hole of holes) {
    if (hole.shape !== "oval") throw new Error("Expected an oval shield hole")
    const holeObstacles = obstacles.filter(
      (obstacle) =>
        obstacle.circuitJsonMetadata?.pcb_plated_hole_id ===
        hole.pcb_plated_hole_id,
    )
    expect(holeObstacles.length).toBeGreaterThan(0)
    for (const obstacle of holeObstacles) {
      expect(obstacle.type).toBe("rect")
      expect(obstacle.connectedTo).toEqual([hole.pcb_plated_hole_id])
      expect(obstacle.circuitJsonMetadata).toMatchObject({
        pcb_port_id: hole.pcb_port_id,
      })
      expect(obstacle.layers).toEqual(["top", "bottom"])
    }
    const transform = compose(
      translate(hole.x, hole.y),
      rotateDEG(hole.ccw_rotation ?? 0),
    )
    const radius = Math.min(hole.outer_width, hole.outer_height) / 2
    // Sample emitted copper in its local frame, then compare against the
    // union of SRJ primitives in board space, including both rounded ends.
    for (
      let x = -hole.outer_width / 2 - 0.1;
      x <= hole.outer_width / 2 + 0.1;
      x += 0.2
    ) {
      for (
        let y = -hole.outer_height / 2 - 0.1;
        y <= hole.outer_height / 2 + 0.1;
        y += 0.2
      ) {
        const dx = Math.max(0, Math.abs(x) - (hole.outer_width / 2 - radius))
        const dy = Math.max(0, Math.abs(y) - (hole.outer_height / 2 - radius))
        const onCopper = Math.hypot(dx, dy) <= radius + 1e-9
        const point = applyToPoint(transform, { x, y })
        expect(
          holeObstacles.some((obstacle) =>
            obstacleContainsPoint(obstacle, point),
          ),
        ).toBe(onCopper)
      }
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
