import { expect, test } from "bun:test"
import { Fragment } from "react"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mounting slot endpoints follow their footprint on both PCB layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={65} height={48} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer, side) =>
        [0, 15].flatMap((slotCcwRotationDegrees, row) =>
          [0, 45, 90, 180, 270].map((chipCcwRotationDegrees, column) => (
            <Fragment
              key={`${layer}-${slotCcwRotationDegrees}-${chipCcwRotationDegrees}`}
            >
              <pcbnotetext
                text={`${layer} ${chipCcwRotationDegrees}+${slotCcwRotationDegrees}deg`}
                pcbX={column * 12 - 24}
                pcbY={20 - (side * 2 + row) * 12}
                fontSize={0.6}
              />
              <chip
                name={`J${side}${row}${column}`}
                layer={layer}
                pcbX={column * 12 - 24}
                pcbY={16 - (side * 2 + row) * 12}
                pcbRotation={chipCcwRotationDegrees}
                footprint={
                  <footprint>
                    <hole
                      shape="pill"
                      width={4}
                      height={1}
                      pcbX={1}
                      pcbY={1}
                      pcbRotation={slotCcwRotationDegrees}
                    />
                    <silkscreenpath
                      route={[-1.5, 1.5].map((x) =>
                        applyToPoint(
                          compose(
                            translate(1, 1),
                            rotateDEG(slotCcwRotationDegrees),
                          ),
                          { x, y: 0 },
                        ),
                      )}
                    />
                  </footprint>
                }
              />
            </Fragment>
          )),
        ),
      )}
    </board>,
  )
  circuit.render()
  for (const hole of circuit.db.pcb_hole.list()) {
    if (hole.hole_shape !== "pill" && hole.hole_shape !== "rotated_pill") {
      throw new Error("Expected a pill mounting slot")
    }
    const guide = circuit.db.pcb_silkscreen_path
      .list()
      .find((path) => path.pcb_component_id === hole.pcb_component_id)!
    const slotLocalToBoardTransform = compose(
      translate(hole.x, hole.y),
      rotateDEG(hole.hole_shape === "rotated_pill" ? hole.ccw_rotation : 0),
    )
    // Compare the emitted slot's cap centers with an independently rendered
    // footprint guide, so a missing parent rotation or layer flip fails.
    const endpoints = [-1, 1].map((sign) =>
      applyToPoint(slotLocalToBoardTransform, {
        x: (sign * (hole.hole_width - hole.hole_height)) / 2,
        y: 0,
      }),
    )
    for (const point of guide.route) {
      expect(
        Math.min(
          ...endpoints.map((end) =>
            Math.hypot(point.x - end.x, point.y - end.y),
          ),
        ),
      ).toBeLessThan(0.000001)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
