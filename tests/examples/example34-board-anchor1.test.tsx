import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the top-left", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board
        width="30mm"
        height="30mm"
        boardAnchorPosition={{ x: 0, y: 0 }}
        boardAnchorAlignment="top_left"
      >
        <resistor name="R1" resistance="10k" footprint="0805" />
        <silkscreencircle pcbX={0} pcbY={0} radius="1mm" />
        <silkscreentext pcbX={1} pcbY={1} text="(0,0)" />
        <silkscreentext
          pcbX={0}
          pcbY={-2}
          text="board.anchor: top_left @ (0,0)"
        />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
