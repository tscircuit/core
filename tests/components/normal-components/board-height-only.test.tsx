import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// When only the board height is provided, the width should be automatically
// calculated while the explicit height is preserved.

test("board preserves height and auto-calculates width", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board height={20}>
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
  expect(pcb_board.height).toBe(20)
  expect(pcb_board.width).toBeGreaterThan(10)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
