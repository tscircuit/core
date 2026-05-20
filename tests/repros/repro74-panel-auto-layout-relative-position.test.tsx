import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel auto-layout positions boards relative to panel center", () => {
  const { circuit } = getTestFixture()

  // Panel at (25, 25) with two unpositioned boards
  // The boards should be auto-laid out centered around the panel position
  circuit.add(
    <panel width="30mm" height="30mm" pcbX="25mm" pcbY="25mm" layoutMode="grid">
      <board width="10mm" height="10mm" routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
      <board width="10mm" height="10mm" routingDisabled>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </board>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()

  expect(boards).toHaveLength(2)
  expect(boards[0].position_mode).toBe("relative_to_panel_anchor")
  expect(boards[0].center).toEqual({ x: 25, y: 19 })
  expect(boards[0].display_offset_x).toBe("0mm")
  expect(boards[0].display_offset_y).toBe("-6mm")
  expect(boards[1].position_mode).toBe("relative_to_panel_anchor")
  expect(boards[1].center).toEqual({ x: 25, y: 31 })
  expect(boards[1].display_offset_x).toBe("0mm")
  expect(boards[1].display_offset_y).toBe("6mm")
})
