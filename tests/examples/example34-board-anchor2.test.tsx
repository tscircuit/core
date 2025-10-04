import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the bottom-right", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board
        boardAnchorPosition={{ x: 10, y: 10 }}
        boardAnchorAlignment="bottom_right"
      >
        <resistor name="R1" resistance="10k" />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
