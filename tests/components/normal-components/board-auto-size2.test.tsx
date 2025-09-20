import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board respects explicit dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.width).toBe(50)
  expect(pcb_board.height).toBe(50)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
