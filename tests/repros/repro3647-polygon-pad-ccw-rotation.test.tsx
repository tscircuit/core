import { expect, test } from "bun:test"
import { Circuit } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole_with_polygon_pad plated hole inherits component rotation as ccw_rotation (#3647)", async () => {
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
      <chip name="U1" pcbRotation={90} footprint={footprint} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const polygonPadHole = circuitJson.find(
    (e: any) =>
      e.type === "pcb_plated_hole" && e.shape === "hole_with_polygon_pad",
  ) as any
  const rectPadHole = circuitJson.find(
    (e: any) =>
      e.type === "pcb_plated_hole" && e.shape === "circular_hole_with_rect_pad",
  ) as any

  expect(rectPadHole).toBeDefined()
  expect(rectPadHole.rect_ccw_rotation).toBe(90)

  expect(polygonPadHole).toBeDefined()
  expect(polygonPadHole.ccw_rotation).toBe(90)
  expect(polygonPadHole.pad_outline).toEqual([
    { x: -2, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -2, y: 0.5 },
  ])
})

test("hole_with_polygon_pad in chip supports arbitrary pcbRotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <chip
        name="U2"
        pcbRotation={45}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              shape="hole_with_polygon_pad"
              holeShape="circle"
              holeDiameter={1}
              holeOffsetX={0}
              holeOffsetY={0}
              pcbX={0}
              pcbY={0}
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

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const hole = circuitJson.find(
    (e: any) =>
      e.type === "pcb_plated_hole" && e.shape === "hole_with_polygon_pad",
  ) as any

  expect(hole).toBeDefined()
  expect(hole.ccw_rotation).toBe(45)
})
