import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const expectedCenter = { x: 20, y: 15 }
const boardAnchorPosition = { x: 10, y: 20 }

const createReproBoard = (observedCenter?: { x: number; y: number }) => (
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
      text={`anchorAlignment=top_left\nexpected center: (${expectedCenter.x}, ${expectedCenter.y})\nobserved center: (${observedCenter?.x ?? "?"}, ${observedCenter?.y ?? "?"})`}
    />
  </board>
)

test("board anchorAlignment currently has no effect", () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())
  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  const observedCenter = board?.center

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(createReproBoard(observedCenter))
  snapshotCircuit.render()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(observedCenter).toEqual(boardAnchorPosition)
  expect(observedCenter).not.toEqual(expectedCenter)
})
