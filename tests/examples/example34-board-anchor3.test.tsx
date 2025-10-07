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
        <resistor
          name="R1"
          resistance="10k"
          footprint="0805"
          pcbX="15mm"
          pcbY="15mm"
        />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
