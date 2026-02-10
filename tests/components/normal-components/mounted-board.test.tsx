import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { su } from "@tscircuit/circuit-json-util"

test("Board inside MountedBoard has carrier_pcb_board_id and is_mounted_to_carrier_board set", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={100} height={100}>
      <resistor name="R1" resistance="10k" footprint="0402" />

      <mountedboard
        name="DaughterBoard"
        boardToBoardDistance="5mm"
        mountOrientation="faceDown"
      >
        <board width={30} height={20}>
          <resistor name="R2" resistance="20k" footprint="0402" />
        </board>
      </mountedboard>
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const boards = su(circuitJson).pcb_board.list()

  // Should have 2 boards: carrier board and daughter board inside mountedboard
  expect(boards.length).toBe(2)

  const carrierBoard = boards.find((b) => !b.is_mounted_to_carrier_board)
  const mountedBoard = boards.find((b) => b.is_mounted_to_carrier_board)

  expect(carrierBoard).toBeDefined()
  expect(mountedBoard).toBeDefined()
  expect(mountedBoard?.is_mounted_to_carrier_board).toBe(true)
  expect(mountedBoard?.carrier_pcb_board_id).toBe(carrierBoard?.pcb_board_id)
})
