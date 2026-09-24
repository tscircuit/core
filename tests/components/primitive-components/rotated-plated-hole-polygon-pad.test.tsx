import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole_with_polygon_pad emits ccw_rotation from component rotation (#3647)", async () => {
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

  await circuit.renderUntilSettled()

  const hole = circuit.db.pcb_plated_hole
    .list()
    .find((h: any) => h.shape === "hole_with_polygon_pad") as any
  expect(hole.shape).toBe("hole_with_polygon_pad")
  expect(hole.ccw_rotation).toBe(90)
})
