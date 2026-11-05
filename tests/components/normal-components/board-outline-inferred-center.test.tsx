import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Board } from "lib/components/normal-components/Board/Board"

test("an unpositioned outlined board derives its center and calc bounds from its outline", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      outline={[
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 20 },
        { x: 0, y: 20 },
      ]}
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={25} pcbY={5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={17} />
      <pcbnotetext
        text="Outline bounds: (0, 0) to (30, 20)"
        pcbX={15}
        pcbY={3}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.db.pcb_board.list()[0]
  expect(board.center).toEqual({ x: 15, y: 10 })
  expect(board.width).toBe(30)
  expect(board.height).toBe(20)
  expect((circuit.firstChild as Board)._getBoardCalcVariables()).toEqual({
    "board.minX": 0,
    "board.maxX": 30,
    "board.minY": 0,
    "board.maxY": 20,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
