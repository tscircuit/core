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
      >
        <resistor resistance={1} name="R1" pcbX={25} pcbY={15} footprint="0402" />
      </board>,
    )
    circuit.render()

    const board = circuit.db.pcb_board.list()[0]
    const observedCenter = board?.center ?? { x: 0, y: 0 }

    const { circuit: snapshotCircuit } = getTestFixture()
    snapshotCircuit.add(
      <board
        width={width}
        height={height}
        boardAnchorPosition={boardAnchorPosition}
        anchorAlignment="top_left"
      >
        <resistor resistance={1} name="R1" pcbX={25} pcbY={15} footprint="0402" />
        <pcbnotetext
          pcbX={10}
          pcbY={25}
          fontSize={0.7}
          text={`board size: ${width} x ${height}\nanchor: ${JSON.stringify(boardAnchorPosition)}\nalignment: top_left\nexpected center: ${JSON.stringify(expectedCenter)}\nobserved center: ${JSON.stringify(observedCenter)}`}
        />
        {/* Anchor point marker (blue) */}
        <pcbnoterect
          pcbX={boardAnchorPosition.x}
          pcbY={boardAnchorPosition.y}
          width={0.8}
          height={0.8}
          color="blue"
        />
        <pcbnotetext
          pcbX={boardAnchorPosition.x}
          pcbY={boardAnchorPosition.y - 1.2}
          fontSize={0.5}
          text="Anchor (10, 20)"
        />
        {/* Expected center marker (green) */}
        <pcbnoterect
          pcbX={expectedCenter.x}
          pcbY={expectedCenter.y}
          width={0.8}
          height={0.8}
          color="green"
        />
        <pcbnotetext
          pcbX={expectedCenter.x}
          pcbY={expectedCenter.y - 1.2}
          fontSize={0.5}
          text="Expected Center (20, 15)"
        />
        {/* Observed center marker (red) */}
        <pcbnoterect
          pcbX={observedCenter.x}
          pcbY={observedCenter.y}
          width={0.8}
          height={0.8}
          color="red"
        />
        <pcbnotetext
          pcbX={observedCenter.x}
          pcbY={observedCenter.y + 1.2}
          fontSize={0.5}
          text={`Observed Center (${observedCenter.x}, ${observedCenter.y})`}
        />
      </board>,
    )
    snapshotCircuit.render()

    expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
    expect(observedCenter).toEqual(expectedCenter)
  },
)
