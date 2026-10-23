import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("outline center inference preserves authored board coordinates and offsets", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      outline={[
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 20 },
        { x: 0, y: 20 },
      ]}
      pcbX={0}
      pcbY={0}
      outlineOffsetX={2}
      outlineOffsetY={-3}
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={10} pcbY={5} />
      <pcbnotetext
        text="Explicit board origin, outline offset (2,-3)"
        pcbX={16}
        pcbY={10}
        fontSize={0.5}
      />
    </board>,
  )
  circuit.render()
  const board = circuit.db.pcb_board.list()[0]
  expect(board.center).toEqual({ x: 2, y: -3 })
  expect(board.outline?.[0]).toEqual({ x: 2, y: -3 })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
