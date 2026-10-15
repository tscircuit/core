import { expect, test } from "bun:test"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("auto-sized rounded board outline follows its component bounds", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      pcbX={10}
      pcbY={-12}
      borderRadius={1}
      outlineOffsetX={1}
      outlineOffsetY={-0.5}
    >
      <chip name="U1" footprint="0402" pcbX={4} pcbY={3} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]!
  const component = circuit.db.pcb_component.list()[0]!
  expect(board.center).toEqual({
    x: component.center.x + 1,
    y: component.center.y - 0.5,
  })
  expect(getBoundsFromPoints(board.outline!)).toMatchObject({
    minX: board.center.x - board.width! / 2,
    maxX: board.center.x + board.width! / 2,
    minY: board.center.y - board.height! / 2,
    maxY: board.center.y + board.height! / 2,
  })
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_component_outside_board_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
