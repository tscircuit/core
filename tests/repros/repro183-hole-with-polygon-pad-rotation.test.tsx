import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole_with_polygon_pad emits ccw_rotation like the rect-pad variant", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbRotation={90}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX={3}
              pcbY={0}
              shape="hole_with_polygon_pad"
              holeShape="circle"
              holeDiameter={1}
              holeOffsetX={0}
              holeOffsetY={0}
              padOutline={[
                { x: -2, y: -0.5 },
                { x: 2, y: -0.5 },
                { x: 2, y: 0.5 },
                { x: -2, y: 0.5 },
              ]}
            />
            <platedhole
              portHints={["pin2"]}
              pcbX={-3}
              pcbY={0}
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={4}
              rectPadHeight={1}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const holes = circuit.db.pcb_plated_hole.list()
  const polygonHole = holes.find((h) => h.shape === "hole_with_polygon_pad")
  const rectHole = holes.find((h) => h.shape === "circular_hole_with_rect_pad")

  expect(polygonHole).toBeDefined()
  expect(rectHole).toBeDefined()

  expect(rectHole!.rect_ccw_rotation).toBe(90)
  expect(polygonHole!.ccw_rotation).toBe(90)
})
