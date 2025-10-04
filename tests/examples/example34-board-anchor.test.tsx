import { getTestFixture } from "../fixtures/get-test-fixture"

describe("Board Anchor", () => {
  it("should anchor the board to the top-left", async () => {
    const { circuit } = getTestFixture()
    // @ts-ignore
    const board = (
      <board boardAnchorPosition={[0, 0]} boardAnchorAlignment="top-left">
        <resistor name="R1" resistance="10k" center={[2, 2]} />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })

  it("should anchor the board to the bottom-right", async () => {
    const { circuit } = getTestFixture()
    // @ts-ignore
    const board = (
      <board boardAnchorPosition={[10, 10]} boardAnchorAlignment="bottom-right">
        <resistor name="R1" resistance="10k" center={[2, 2]} />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path, "bottom-right")
  })

  it("should anchor the board to the center", async () => {
    const { circuit } = getTestFixture()
    // @ts-ignore
    const board = (
      <board boardAnchorPosition={[5, 5]} boardAnchorAlignment="center">
        <resistor name="R1" resistance="10k" center={[2, 2]} />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path, "center")
  })
})
