import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-sizes with nested components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={10}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={-10}
      />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]

  // Should be at least 20mm (component spread) + padding
  expect(pcb_board.width).toBeGreaterThan(22)
  expect(pcb_board.height).toBeGreaterThan(22)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
