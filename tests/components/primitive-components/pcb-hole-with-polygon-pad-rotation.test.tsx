import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb plated hole with polygon pad inherits component rotation (#3647)", async () => {
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
      <chip name="U1" pcbRotation={90} layer="top" footprint={footprint} />
    </board>,
  )

  await circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const platedHoles = circuitJson.filter(
    (item: any) => item.type === "pcb_plated_hole",
  )

  const polygonPadHole = platedHoles.find(
    (h: any) => h.shape === "hole_with_polygon_pad",
  )
  const rectPadHole = platedHoles.find(
    (h: any) => h.shape === "circular_hole_with_rect_pad",
  )

  expect(polygonPadHole).toBeDefined()
  expect(rectPadHole).toBeDefined()

  // Rect pad receives 90 degree rotation
  expect(rectPadHole.rect_ccw_rotation).toBe(90)

  // Polygon pad must also emit ccw_rotation: 90
  expect(polygonPadHole.ccw_rotation).toBe(90)
  expect(polygonPadHole.pad_outline).toEqual([
    { x: -2, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -2, y: 0.5 },
  ])
})

test("pcb plated hole with polygon pad direct pcbRotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <chip
        name="U2"
        layer="top"
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0}
              shape="hole_with_polygon_pad"
              holeShape="circle"
              holeDiameter={1}
              holeOffsetX={0}
              holeOffsetY={0}
              pcbRotation={45}
              padOutline={[
                { x: -1, y: -1 },
                { x: 1, y: -1 },
                { x: 1, y: 1 },
                { x: -1, y: 1 },
              ]}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const polygonPadHole = circuitJson.find(
    (item: any) =>
      item.type === "pcb_plated_hole" && item.shape === "hole_with_polygon_pad",
  )

  expect(polygonPadHole).toBeDefined()
  expect(polygonPadHole.ccw_rotation).toBe(45)
})
