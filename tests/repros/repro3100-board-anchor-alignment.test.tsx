import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchorAlignment positions the board at boardAnchorPosition (#3100)", () => {
  const cases = [
    ["top_left", { x: 20, y: 15 }],
    ["top_center", { x: 10, y: 15 }],
    ["top_right", { x: 0, y: 15 }],
    ["center_left", { x: 20, y: 20 }],
    ["center", { x: 10, y: 20 }],
    ["center_right", { x: 0, y: 20 }],
    ["bottom_left", { x: 20, y: 25 }],
    ["bottom_center", { x: 10, y: 25 }],
    ["bottom_right", { x: 0, y: 25 }],
  ] as const

  for (const [alignment, expectedCenter] of cases) {
    for (const mode of ["preferred", "legacy", "both"] as const) {
      const { circuit } = getTestFixture()
      circuit.add(
        <board
          width={20}
          height={10}
          boardAnchorPosition={{ x: 10, y: 20 }}
          anchorAlignment={mode === "legacy" ? undefined : alignment}
          boardAnchorAlignment={
            mode === "legacy"
              ? alignment
              : mode === "both"
                ? "bottom_right"
                : undefined
          }
          routingDisabled
        >
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX="calc(board.minX + 2mm)"
            pcbY="calc(board.maxY - 2mm)"
          />
        </board>,
      )

      circuit.render()

      const pcbBoard = circuit.db.pcb_board.list()[0]!
      expect(pcbBoard.center).toEqual(expectedCenter)

      const pcbComp = circuit.db.pcb_component.list()[0]!
      expect(pcbComp.center.x).toBeCloseTo(expectedCenter.x - 10 + 2)
      expect(pcbComp.center.y).toBeCloseTo(expectedCenter.y + 5 - 2)
    }
  }
})
