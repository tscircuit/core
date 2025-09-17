import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size with grouped components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={5}
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0402"
          pcbX={-5}
          pcbY={-5}
        />
      </group>
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(0)
  expect(pcb_board.center.y).toBe(0)
  expect(pcb_board.width).toBeGreaterThan(10)
  expect(pcb_board.height).toBeGreaterThan(10)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
