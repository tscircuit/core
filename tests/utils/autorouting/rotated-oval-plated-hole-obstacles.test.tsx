import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { Fragment } from "react"
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
                <silkscreenpath
                  strokeWidth={0.05}
                  route={[
                    { x: -1.1, y: -1.6 },
                    { x: 1.1, y: -1.6 },
                    { x: 1.1, y: 1.6 },
                    { x: -1.1, y: 1.6 },
                    { x: -1.1, y: -1.6 },
                  ]}
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
    const obstacle = obstacles.find(
      (obstacle) =>
        obstacle.circuitJsonMetadata?.pcb_plated_hole_id ===
        hole.pcb_plated_hole_id,
    )!
    expect(obstacle.center).toEqual({ x: hole.x, y: hole.y })
    expect(obstacle.connectedTo).toEqual([hole.pcb_plated_hole_id])
    expect(obstacle.circuitJsonMetadata).toMatchObject({
      pcb_port_id: hole.pcb_port_id,
    })
    expect(obstacle.layers).toEqual(["top", "bottom"])

    const rotation = hole.ccw_rotation ?? 0
    const transform = compose(translate(hole.x, hole.y), rotateDEG(rotation))
    const corners = [-1, 1].flatMap((xSign) =>
      [-1, 1].map((ySign) =>
        applyToPoint(transform, {
          x: (xSign * hole.outer_width) / 2,
          y: (ySign * hole.outer_height) / 2,
        }),
      ),
    )
    // The sibling path carries the same local bounds through actual board
    // placement. Checking it also detects a hole/obstacle pair that agrees
    // with itself while using the wrong reflection angle on the bottom.
    const outline = circuit.db.pcb_silkscreen_path
      .list()
      .find((path) => path.pcb_component_id === hole.pcb_component_id)!
    for (const point of outline.route.slice(0, 4)) {
      expect(
        Math.min(
          ...corners.map((corner) =>
            Math.hypot(corner.x - point.x, corner.y - point.y),
          ),
        ),
      ).toBeLessThan(0.000001)
    }
    if (Math.abs(rotation % 90) < 1e-6) {
      // Derive board-world copper bounds from the emitted hole's local
      // rectangle corners (mm, +X right/+Y up), rather than copying the
      // converter's quarter-turn width/height selection.
      expect(obstacle.width).toBeCloseTo(
        Math.max(...corners.map((corner) => corner.x)) -
          Math.min(...corners.map((corner) => corner.x)),
        8,
      )
      expect(obstacle.height).toBeCloseTo(
        Math.max(...corners.map((corner) => corner.y)) -
          Math.min(...corners.map((corner) => corner.y)),
        8,
      )
      expect(obstacle.ccwRotationDegrees).toBeUndefined()
    } else {
      expect(obstacle.width).toBe(hole.outer_width)
      expect(obstacle.height).toBe(hole.outer_height)
      expect(obstacle.ccwRotationDegrees).toBe(rotation)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
