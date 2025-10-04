import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the top-left", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board
        boardAnchorPosition={{ x: 0, y: 0 }}
        boardAnchorAlignment="top_left"
      >
        <resistor name="R1" resistance="10k" />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
