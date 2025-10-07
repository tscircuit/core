import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the center", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board
        width="30mm"
        height="30mm"
        boardAnchorPosition={{ x: 5, y: 5 }}
        boardAnchorAlignment="center"
      >
        <resistor name="R1" resistance="10k" footprint="0805" />
        <silkscreencircle pcbX={0} pcbY={0} radius="1mm" />
        <silkscreentext pcbX={1} pcbY={1} text="(0,0)" />
        <silkscreencircle pcbX={5} pcbY={5} radius="1mm" />
        <silkscreentext pcbX={5} pcbY={3} text="board.anchor: center @ (5,5)" />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
