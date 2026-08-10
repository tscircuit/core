import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const width = "20mm"
const height = "10mm"
const expectedCenter = { x: 20, y: 15 }
const boardAnchorPosition = { x: 10, y: 20 }

test.failing(
  "board anchorAlignment should position the requested anchor",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={width}
        height={height}
        boardAnchorPosition={boardAnchorPosition}
        anchorAlignment="top_left"
      />,
    )
    circuit.render()

    const board = circuit.db.pcb_board.list()[0]
    const observedCenter = board?.center

    const { circuit: snapshotCircuit } = getTestFixture()
    snapshotCircuit.add(
      <board
        width={width}
        height={height}
        boardAnchorPosition={boardAnchorPosition}
        anchorAlignment="top_left"
      >
        <pcbnotetext
          pcbX={10}
          pcbY={20}
          fontSize={0.7}
          text={`board size: ${width} x ${height}\nanchor: ${JSON.stringify(boardAnchorPosition)}\nalignment: top_left\nexpected center: ${JSON.stringify(expectedCenter)}\nobserved center: ${JSON.stringify(observedCenter)}`}
        />
      </board>,
    )
    snapshotCircuit.render()

    expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
    expect(observedCenter).toEqual(expectedCenter)
  },
)
