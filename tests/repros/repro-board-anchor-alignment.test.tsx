import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const expectedCenter = { x: 20, y: 15 }
const boardAnchorPosition = { x: 10, y: 20 }

test.failing(
  "board anchorAlignment should position the requested anchor",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(
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
          text={`anchor: ${JSON.stringify(boardAnchorPosition)}\nalignment: top_left\nexpected center: ${JSON.stringify(expectedCenter)}`}
        />
      </board>,
    )
    circuit.render()

    const board = circuit.db.pcb_board.list()[0]
    const observedCenter = board?.center

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    expect(observedCenter).toEqual(expectedCenter)
  },
)
