import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-sizes when no dimensions provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0603"
        pcbX={-5}
        pcbY={-5}
      />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]

  // Board should be larger than component bounds
  expect(pcb_board.width).toBeGreaterThan(10)
  expect(pcb_board.height).toBeGreaterThan(10)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
