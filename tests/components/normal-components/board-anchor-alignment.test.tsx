import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchorAlignment honors all nine anchors and prefers the current prop", () => {
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
    for (const mode of ["preferred", "legacy", "both"]) {
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
        >
          <pcbnotetext
            pcbX={10}
            pcbY={22}
            anchorAlignment="bottom_left"
            fontSize={0.7}
            text={`anchor (10,20): ${alignment}`}
          />
        </board>,
      )
      circuit.render()
      const board = circuit.db.pcb_board.list()[0]!
      expect(board.center).toEqual(expectedCenter)
      expect([board.width, board.height]).toEqual([20, 10])
      if (mode === "preferred" && alignment === "top_left") {
        expect(circuit).toMatchPcbSnapshot(import.meta.path)
      }
    }
  }
})
