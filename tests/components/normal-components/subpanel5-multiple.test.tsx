import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple subpanels at different positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="-20mm" pcbY="0mm" layoutMode="grid" row={1}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
      <subpanel pcbX="20mm" pcbY="0mm" layoutMode="grid" row={1}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  // Count boards on left (x < 0) and right (x > 0)
  const leftBoards = boards.filter((b) => b.center.x < 0)
  const rightBoards = boards.filter((b) => b.center.x > 0)

  expect(leftBoards.length).toBe(2)
  expect(rightBoards.length).toBe(2)
})

test("subpanels with different layout modes", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="-20mm" pcbY="0mm" layoutMode="grid" row={2} col={1}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
      <subpanel pcbX="20mm" pcbY="0mm" layoutMode="none">
        <board
          width="10mm"
          height="10mm"
          routingDisabled
          pcbX="0mm"
          pcbY="5mm"
        />
        <board
          width="10mm"
          height="10mm"
          routingDisabled
          pcbX="0mm"
          pcbY="-5mm"
        />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  // Left subpanel boards (grid layout)
  const leftBoards = boards.filter((b) => b.center.x < 0)
  expect(leftBoards.length).toBe(2)

  // Right subpanel boards (none layout - manual positioning)
  const rightBoards = boards.filter((b) => b.center.x > 0)
  expect(rightBoards.length).toBe(2)
})

test("multiple subpanels each have correct board counts", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="-30mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
      <subpanel pcbX="0mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
      <subpanel pcbX="30mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(6)

  // Check that boards are distributed across x positions
  const leftBoards = boards.filter((b) => b.center.x < -15)
  const middleBoards = boards.filter(
    (b) => b.center.x >= -15 && b.center.x <= 15,
  )
  const rightBoards = boards.filter((b) => b.center.x > 15)

  expect(leftBoards.length).toBe(1)
  expect(middleBoards.length).toBe(2)
  expect(rightBoards.length).toBe(3)
})
