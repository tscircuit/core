import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested subpanels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="0mm" pcbY="0mm" layoutMode="none">
        <subpanel pcbX="10mm" pcbY="10mm" layoutMode="grid">
          <board width="10mm" height="10mm" routingDisabled />
        </subpanel>
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  // Board should be at (0+10, 0+10) = (10, 10)
  expect(boards[0].center.x).toBeCloseTo(10)
  expect(boards[0].center.y).toBeCloseTo(10)
})

test("subpanel with different sized boards in grid", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="0mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="20mm" height="20mm" routingDisabled />
        <board width="15mm" height="15mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(3)

  // All boards should have position_mode set
  for (const board of boards) {
    expect(board.position_mode).toBe("relative_to_panel_anchor")
  }
})

test("subpanel with cellWidth and cellHeight", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel
        pcbX="0mm"
        pcbY="0mm"
        layoutMode="grid"
        cellWidth="30mm"
        cellHeight="30mm"
      >
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // With cellWidth=30mm, boards should be 30mm apart (center to center)
  const xDiff = Math.abs(boards[1].center.x - boards[0].center.x)
  // Grid gap is added on top of cell width, default tab width is around 2mm
  expect(xDiff).toBeGreaterThanOrEqual(30)
})

test("mixed boards and subpanels in panel - subpanel with board only", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <board
        width="10mm"
        height="10mm"
        routingDisabled
        pcbX="-20mm"
        pcbY="0mm"
      />
      <subpanel pcbX="20mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(3)

  // One board should be at (-20, 0)
  const leftBoard = boards.find(
    (b) => Math.abs(b.center.x - -20) < 0.1 && Math.abs(b.center.y - 0) < 0.1,
  )
  expect(leftBoard).toBeDefined()

  // Two boards should be near (20, 0)
  const rightBoards = boards.filter((b) => b.center.x > 10)
  expect(rightBoards.length).toBe(2)
})

test("subpanel snapshot test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="-20mm" pcbY="0mm" layoutMode="grid" row={2} col={1}>
        <board width="15mm" height="15mm" routingDisabled>
          <silkscreentext
            text="A1"
            pcbX={0}
            pcbY={0}
            anchorAlignment="center"
          />
        </board>
        <board width="15mm" height="15mm" routingDisabled>
          <silkscreentext
            text="A2"
            pcbX={0}
            pcbY={0}
            anchorAlignment="center"
          />
        </board>
      </subpanel>
      <subpanel pcbX="20mm" pcbY="0mm" layoutMode="grid" row={2} col={1}>
        <board width="15mm" height="15mm" routingDisabled>
          <silkscreentext
            text="B1"
            pcbX={0}
            pcbY={0}
            anchorAlignment="center"
          />
        </board>
        <board width="15mm" height="15mm" routingDisabled>
          <silkscreentext
            text="B2"
            pcbX={0}
            pcbY={0}
            anchorAlignment="center"
          />
        </board>
      </subpanel>
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
