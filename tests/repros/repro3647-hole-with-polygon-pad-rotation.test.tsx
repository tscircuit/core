import { expect, test } from "bun:test"
import type {
  PcbHoleCircularWithRectPad,
  PcbHoleWithPolygonPad,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole_with_polygon_pad plated holes emit ccw_rotation from component rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
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

  const platedHoles = circuit.db.pcb_plated_hole.list()
  const polygonHole = platedHoles.find(
    (h): h is PcbHoleWithPolygonPad => h.shape === "hole_with_polygon_pad",
  )
  const rectHole = platedHoles.find(
    (h): h is PcbHoleCircularWithRectPad =>
      h.shape === "circular_hole_with_rect_pad",
  )

  expect(polygonHole).toBeDefined()
  expect(rectHole).toBeDefined()
  expect(polygonHole?.x).toBeCloseTo(0)
  expect(polygonHole?.y).toBeCloseTo(3)
  expect(polygonHole?.ccw_rotation).toBe(90)
  expect(polygonHole?.pad_outline).toEqual([
    { x: -2, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -2, y: 0.5 },
  ])
  expect(rectHole?.rect_ccw_rotation).toBe(90)
})
