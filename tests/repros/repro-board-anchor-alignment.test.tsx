import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const expectedCenter = { x: 20, y: 15 }
const boardAnchorPosition = { x: 10, y: 20 }

const createReproBoard = (observedCenter?: { x: number; y: number }) => {
  const status =
    observedCenter?.x === expectedCenter.x &&
    observedCenter?.y === expectedCenter.y
      ? "correct"
      : "failing"

  return (
    <board
      width="20mm"
      height="10mm"
      boardAnchorPosition={boardAnchorPosition}
      anchorAlignment="top_left"
    >
      <pcbnotetext
        pcbX={10}
        pcbY={20}
        fontSize={0.7}
        text={`anchor: ${JSON.stringify(boardAnchorPosition)}\nalignment: top_left\nexpected center: ${JSON.stringify(expectedCenter)}\nobserved center: ${JSON.stringify(observedCenter)}\nstatus: ${status}`}
      />
    </board>
  )
}

test.failing(
  "board anchorAlignment should position the requested anchor",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(createReproBoard())
    circuit.render()

    const board = circuit.db.pcb_board.list()[0]
    const observedCenter = board?.center

    const { circuit: snapshotCircuit } = getTestFixture()
    snapshotCircuit.add(createReproBoard(observedCenter))
    snapshotCircuit.render()

    expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
    expect(observedCenter).toEqual(expectedCenter)
  },
)
