import { expect, test } from "bun:test"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rounded board outlines follow the resolved board center", async () => {
  for (const position of [
    { pcbX: 10, pcbY: 0 },
    { pcbX: 0, pcbY: -12 },
    { pcbX: 10, pcbY: -12, outlineOffsetX: 1, outlineOffsetY: 2 },
    {
      pcbX: 15,
      pcbY: -7,
      boardAnchorPosition: { x: 10, y: -12 },
      boardAnchorAlignment: "bottom_left" as const,
    },
  ]) {
    for (const borderRadius of [1, 0.005, 0]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <board width={10} height={10} borderRadius={borderRadius} {...position}>
          <chip name="U1" footprint="0402" />
        </board>,
      )
      await circuit.renderUntilSettled()

      const board = circuit.db.pcb_board.list()[0]!
      expect(board.center).toEqual({
        x: position.pcbX + (position.outlineOffsetX ?? 0),
        y: position.pcbY + (position.outlineOffsetY ?? 0),
      })
      expect(getBoundsFromPoints(board.outline!)).toMatchObject({
        minX: board.center.x - 5,
        maxX: board.center.x + 5,
        minY: board.center.y - 5,
        maxY: board.center.y + 5,
      })
      expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
      expect(circuit.db.pcb_component_outside_board_error.list()).toHaveLength(
        0,
      )

      if (position.outlineOffsetX && borderRadius === 1) {
        expect(circuit).toMatchPcbSnapshot(import.meta.path)
      }
    }
  }
})
