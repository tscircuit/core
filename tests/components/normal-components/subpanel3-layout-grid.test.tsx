import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with grid layout arranges boards in grid", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Boards should have position_mode set
  for (const board of boards) {
    expect(board.position_mode).toBe("relative_to_panel_anchor")
  }

  // Boards should have different x or y positions
  expect(
    boards[0].center.x !== boards[1].center.x ||
      boards[0].center.y !== boards[1].center.y,
  ).toBe(true)
})

test("subpanel grid layout with row and col", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="grid" row={1} col={4}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  // All boards should have the same Y (single row)
  const firstY = boards[0].center.y
  for (const board of boards) {
    expect(board.center.y).toBeCloseTo(firstY, 2)
  }

  // X positions should be increasing
  for (let i = 0; i < boards.length - 1; i++) {
    expect(boards[i].center.x).toBeLessThan(boards[i + 1].center.x)
  }
})

test("subpanel grid layout with boardGap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="grid" row={1} boardGap="5mm">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Gap between boards should be 5mm (board width 10mm + gap 5mm = 15mm center to center)
  const gap = boards[1].center.x - boards[0].center.x
  expect(gap).toBeCloseTo(15)
})

test("subpanel grid layout warns on manual positioning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled pcbX="5mm" />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const warnings = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        "error_type" in element &&
        element.error_type === "source_property_ignored_warning",
    )

  expect(warnings.length).toBe(1)
})

test("subpanel grid layout at offset positions boards correctly", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="grid" pcbX="20mm" pcbY="20mm" row={1} col={2}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Both boards should be near the subpanel center (20, 20)
  const avgX = (boards[0].center.x + boards[1].center.x) / 2
  const avgY = (boards[0].center.y + boards[1].center.y) / 2
  expect(avgX).toBeCloseTo(20, 0)
  expect(avgY).toBeCloseTo(20, 0)
})
