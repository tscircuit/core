import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should auto-size the board and anchor correctly", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board
        boardAnchorPosition={{ x: 0, y: 0 }}
        boardAnchorAlignment="top_left"
      >
        <resistor
          name="R1"
          resistance="10k"
          footprint="0805"
          pcbX="5mm"
          pcbY="5mm"
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0805"
          pcbX="15mm"
          pcbY="15mm"
        />
        <silkscreencircle pcbX={0} pcbY={0} radius="1mm" />
        <silkscreentext pcbX={1} pcbY={1} text="(0,0)" />
        <silkscreentext
          pcbX={0}
          pcbY={-2}
          text="board.anchor: top_left @ (0,0) [autosized]"
        />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })

  it("should auto-size the board with borderRadius and respect bottom-left anchor", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        borderRadius="2mm"
        boardAnchorPosition={{ x: 0, y: 0 }}
        boardAnchorAlignment="bottom_left"
      >
        <resistor
          name="R1"
          resistance="10k"
          footprint="0805"
          pcbX="5mm"
          pcbY="5mm"
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0805"
          pcbX="15mm"
          pcbY="10mm"
        />
      </board>,
    )

    await circuit.render()

    const board = circuit.db.pcb_board.list()[0]

    expect(board.center.x - board.width! / 2).toBeCloseTo(0, 5)
    expect(board.center.y - board.height! / 2).toBeCloseTo(0, 5)
  })
})
