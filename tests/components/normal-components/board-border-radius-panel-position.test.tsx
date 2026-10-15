import { expect, test } from "bun:test"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rounded outlines in a panel receive the board translation once", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="none">
      <board width={10} height={10} pcbX={10} pcbY={-12} borderRadius={1}>
        <chip name="U1" footprint="0402" />
      </board>
      <board width={10} height={10} pcbX={-10} pcbY={12} borderRadius={1}>
        <chip name="U2" footprint="0402" />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  for (const board of circuit.db.pcb_board.list()) {
    if (!board.outline) continue
    expect(getBoundsFromPoints(board.outline)).toMatchObject({
      minX: board.center.x - board.width! / 2,
      maxX: board.center.x + board.width! / 2,
      minY: board.center.y - board.height! / 2,
      maxY: board.center.y + board.height! / 2,
    })
  }
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_component_outside_board_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
