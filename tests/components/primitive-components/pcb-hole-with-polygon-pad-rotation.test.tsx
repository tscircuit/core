import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("plated hole with polygon pad emits ccw_rotation for rotated component", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <platedhole
        portHints={["pin1"]}
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
        shape="circular_hole_with_rect_pad"
        holeDiameter={1}
        rectPadWidth={4}
        rectPadHeight={1}
      />
    </footprint>
  )

  circuit.add(
    <board width={20} height={20}>
      <chip name="U1" pcbRotation={90} footprint={footprint} />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  const polygonPadHole = platedHoles.find(
    (h) => h.shape === "hole_with_polygon_pad",
  )
  const rectPadHole = platedHoles.find(
    (h) => h.shape === "circular_hole_with_rect_pad",
  )

  expect(polygonPadHole!.ccw_rotation).toBe(90)
  expect(rectPadHole!.rect_ccw_rotation).toBe(90)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
