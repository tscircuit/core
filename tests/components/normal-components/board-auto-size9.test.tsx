import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const within = (value: number, min: number, max: number) => {
  expect(value).toBeGreaterThanOrEqual(min)
  expect(value).toBeLessThanOrEqual(max)
}

test("board anchor alignment holds when pcbPack auto-sizes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      pcbPack
      pcbGap="1mm"
      boardAnchorAlignment="top_left"
      boardAnchorPosition={{ x: -20, y: 15 }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="1uF" footprint="0402" />
      <fabricationnotetext
        text="top_left"
        anchorAlignment="top_left"
        pcbX={-20}
        pcbY={15}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  const topLeft = {
    x: board.center.x - board.width / 2,
    y: board.center.y + board.height / 2,
  }

  expect(topLeft.x).toBeCloseTo(-20, 6)
  expect(topLeft.y).toBeCloseTo(15, 6)

  const packedComponents = circuit.db.pcb_component
    .list()
    .filter((component) => component.pcb_board_id === board.pcb_board_id)

  const boardBounds = {
    minX: board.center.x - board.width / 2,
    maxX: board.center.x + board.width / 2,
    minY: board.center.y - board.height / 2,
    maxY: board.center.y + board.height / 2,
  }

  for (const component of packedComponents) {
    within(component.center.x, boardBounds.minX, boardBounds.maxX)
    within(component.center.y, boardBounds.minY, boardBounds.maxY)
  }
})
