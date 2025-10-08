import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the bottom-right", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board
        width="30mm"
        height="30mm"
        boardAnchorPosition={{ x: 10, y: 10 }}
        boardAnchorAlignment="bottom_right"
      >
        <resistor name="R1" resistance="10k" footprint="0805" />
        <silkscreencircle pcbX={0} pcbY={0} radius="1mm" />
        <silkscreentext pcbX={1} pcbY={1} text="(0,0)" />
        <silkscreencircle pcbX={10} pcbY={10} radius="1mm" />
        <silkscreentext
          pcbX={10}
          pcbY={8}
          text="board.anchor: bottom_right @ (10,10)"
        />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
