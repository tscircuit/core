import { test, expect } from "bun:test"
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
})

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
})

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
})

test("board centers around components", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
    </board>,
  )
  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(5)
  expect(pcb_board.center.y).toBe(0)
})

test("board auto-size with group is empty", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <group></group>
    </board>,
  )
  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(0)
  expect(pcb_board.center.y).toBe(0)
})

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

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot("board-auto-size-grouped-components")
})
