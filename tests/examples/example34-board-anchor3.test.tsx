import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the center", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board boardAnchorPosition={{x: 5, y: 5}} boardAnchorAlignment="center">
        <resistor name="R1" resistance="10k" />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
