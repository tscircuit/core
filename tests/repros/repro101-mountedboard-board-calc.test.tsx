import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro101: mountedboard supports calc(board.*) without crashing", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="60mm">
      <mountedboard
        name="MB1"
        width="30mm"
        height="20mm"
        pcbX="calc(board.maxX - 20mm)"
        pcbY="calc(board.minY + 15mm)"
      >
        <resistor name="R_INNER" resistance="10k" footprint="0402" />
      </mountedboard>
    </board>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  const carrier = boards.find((board) => !board.is_mounted_to_carrier_board)
  const mounted = boards.find((board) => board.is_mounted_to_carrier_board)

  expect(carrier).toBeDefined()
  expect(mounted).toBeDefined()
  expect(mounted?.carrier_pcb_board_id).toBe(carrier?.pcb_board_id)

  const carrierMaxX = (carrier?.center.x ?? 0) + (carrier?.width ?? 0) / 2
  const carrierMinY = (carrier?.center.y ?? 0) - (carrier?.height ?? 0) / 2
  expect(mounted?.center.x).toBeCloseTo(carrierMaxX - 20)
  expect(mounted?.center.y).toBeCloseTo(carrierMinY + 15)
})
