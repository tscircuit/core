import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getBoard = (circuit: ReturnType<typeof getTestFixture>["circuit"]) =>
  circuit.db.pcb_board.list()[0]

test("board uses anchor alignment for explicit dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={10}
      boardAnchorPosition={{ x: 5, y: -5 }}
      boardAnchorAlignment="top_left"
    />,
  )

  circuit.render()

  const pcbBoard = getBoard(circuit)
  expect(pcbBoard.center.x - pcbBoard.width / 2).toBeCloseTo(5, 6)
  expect(pcbBoard.center.y + pcbBoard.height / 2).toBeCloseTo(-5, 6)
})

test("board auto-sizing keeps anchor centered", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      boardAnchorPosition={{ x: 10, y: -10 }}
      boardAnchorAlignment="center"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={12} pcbY={-8} />
    </board>,
  )

  circuit.render()

  const pcbBoard = getBoard(circuit)
  expect(pcbBoard.center.x).toBeCloseTo(10, 6)
  expect(pcbBoard.center.y).toBeCloseTo(-10, 6)
  expect(pcbBoard.width).toBeGreaterThan(0)
  expect(pcbBoard.height).toBeGreaterThan(0)
})

test("board auto-sizing respects top-left anchor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="top_left"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={8} pcbY={-6} />
    </board>,
  )

  circuit.render()

  const pcbBoard = getBoard(circuit)
  expect(pcbBoard.center.x - pcbBoard.width / 2).toBeCloseTo(0, 6)
  expect(pcbBoard.center.y + pcbBoard.height / 2).toBeCloseTo(0, 6)
  expect(pcbBoard.width).toBeGreaterThan(0)
  expect(pcbBoard.height).toBeGreaterThan(0)
})

