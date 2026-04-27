import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const uShapedOutline = [
  { x: -8, y: -6 },
  { x: -2, y: -6 },
  { x: -2, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: -6 },
  { x: 8, y: -6 },
  { x: 8, y: 6 },
  { x: -8, y: 6 },
]

test("simple route json includes board outline when provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board outline={uShapedOutline}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={-4} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("simple route json ignores unconnected obstacles outside board outline", () => {
  const outline = [
    { x: -10, y: -5 },
    { x: 10, y: -5 },
    { x: 10, y: 5 },
    { x: -10, y: 5 },
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [
      {
        type: "pcb_board",
        pcb_board_id: "pcb_board_0",
        center: { x: 0, y: 0 },
        width: 20,
        height: 10,
        outline,
        num_layers: 2,
      },
      {
        type: "pcb_hole",
        pcb_hole_id: "pcb_hole_inside",
        x: 0,
        y: 0,
        hole_shape: "square",
        hole_diameter: 1,
      },
      {
        type: "pcb_hole",
        pcb_hole_id: "pcb_hole_outside",
        x: 48,
        y: 33,
        hole_shape: "square",
        hole_diameter: 1,
      },
    ] as any,
  })

  expect(simpleRouteJson.bounds).toEqual({
    minX: -11,
    maxX: 11,
    minY: -6,
    maxY: 6,
  })
  expect(simpleRouteJson.obstacles).toHaveLength(1)
  expect(simpleRouteJson.obstacles[0].center).toEqual({ x: 0, y: 0 })
})
