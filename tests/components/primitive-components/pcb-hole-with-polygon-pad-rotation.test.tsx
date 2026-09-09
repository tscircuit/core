import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb plated hole with polygon pad carries the component rotation", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
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
  )

  circuit.add(
    <board width={20} height={20}>
      <chip name="U1" footprint={footprint} pcbRotation={90} />
    </board>,
  )

  circuit.render()

  const holes = circuit.db.pcb_plated_hole.list()
  const polygonHole = holes.find((h) => h.shape === "hole_with_polygon_pad")!
  const rectHole = holes.find((h) => h.shape === "circular_hole_with_rect_pad")!

  // both holes are moved by the component rotation
  expect(polygonHole.x).toBeCloseTo(0, 6)
  expect(polygonHole.y).toBeCloseTo(3, 6)
  expect(rectHole.x).toBeCloseTo(0, 6)
  expect(rectHole.y).toBeCloseTo(-3, 6)

  // the rect pad already carried the rotation, the polygon pad did not
  expect((rectHole as any).rect_ccw_rotation).toBe(90)
  expect((polygonHole as any).ccw_rotation).toBe(90)

  // pad_outline stays relative to the hole position, unrotated
  expect((polygonHole as any).pad_outline).toEqual([
    { x: -2, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -2, y: 0.5 },
  ])
})
