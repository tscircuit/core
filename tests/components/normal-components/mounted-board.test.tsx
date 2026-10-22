import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("MountedBoard sets carrier_pcb_board_id and is_mounted_to_carrier_board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={100} height={100}>
      <resistor name="R1" resistance="10k" footprint="0402" />

      <mountedboard
        name="DaughterBoard"
        width={30}
        height={20}
        pcbX={10}
        pcbY={10}
        boardToBoardDistance="5mm"
        mountOrientation="faceDown"
      >
        <resistor name="R2" resistance="20k" footprint="0402" />
      </mountedboard>
    </board>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()

  expect(boards).toHaveLength(2)

  const carrierBoard = boards.find((b) => !b.is_mounted_to_carrier_board)
  const mountedBoard = boards.find((b) => b.is_mounted_to_carrier_board)

  expect(carrierBoard).toBeDefined()
  expect(mountedBoard).toMatchObject({
    is_mounted_to_carrier_board: true,
    carrier_pcb_board_id: carrierBoard?.pcb_board_id,
  })
  for (const board of boards) {
    expect(board).toMatchObject({ material: "fr4", thickness: 1.6 })
  }
})
