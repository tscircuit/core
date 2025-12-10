import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardOutline = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 15 },
  { x: 0, y: 15 },
]

const boardOutline2 = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 6, y: 12 },
]

const boardOutline3 = [
  { x: 15, y: 15 },
  { x: 25, y: 15 },
  { x: 20, y: 25 },
]

test("panel packing default", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel>
      <board width="10mm" height="10mm" routingDisabled />
      <board width="12mm" height="8mm" routingDisabled />
      <board width="8mm" height="12mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="5mm" height="5mm" routingDisabled />
      <board width="15mm" height="5mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(6)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-default")
})

test("panel packing with no board gap", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel boardGap={0}>
      <board width="10mm" height="10mm" routingDisabled />
      <board width="12mm" height="8mm" routingDisabled />
      <board width="8mm" height="12mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="5mm" height="5mm" routingDisabled />
      <board width="15mm" height="5mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(6)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-no-gap")
})

test("panel packing with outline boards", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel>
      <board name="B1" outline={boardOutline} routingDisabled />
      <board name="B2" outline={boardOutline2} routingDisabled />
      <board name="B3" outline={boardOutline3} routingDisabled />
      <board name="B4" width="8mm" height="8mm" routingDisabled />
    </panel>,
  )

  circuit.render()
  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-outline")
})

test("panel packing with outline boards and no board gap", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel boardGap={0}>
      <board name="B1" outline={boardOutline} routingDisabled />
      <board name="B2" outline={boardOutline2} routingDisabled />
      <board name="B3" outline={boardOutline3} routingDisabled />
      <board name="B4" width="8mm" height="8mm" routingDisabled />
    </panel>,
  )

  circuit.render()
  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-outline-no-gap")
})

test("panel packing with rows and cols", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel row={1} col={5}>
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(5)
  const positions = boards.map((b) => b.center)

  // All should have same y
  const firstY = positions[0].y
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i].y).toBe(firstY)
  }

  // X should be increasing
  for (let i = 0; i < positions.length - 1; i++) {
    expect(positions[i].x).toBeLessThan(positions[i + 1].x)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-rows-cols")
})

test("panel packing with cellWidth and cellHeight", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel cellWidth="20mm" cellHeight="20mm">
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  const pcb_panel = circuit.db.pcb_panel.list()[0]
  const boardGap = 2
  // cell width 20, 2 boards -> 2x1 grid
  // total width: 20 + boardGap + 20 = 42
  // total height: 20
  // panel width: 42 + 2*5 margin = 52
  // panel height: 20 + 2*5 margin = 30
  expect(pcb_panel.width).toBe(52)
  expect(pcb_panel.height).toBe(30)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-cell-dims")
})

test("panel packing with small cellWidth/cellHeight", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel cellWidth="5mm" cellHeight="5mm">
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  // cellWidth/Height should be ignored and 10x10 should be used
  const pcb_panel = circuit.db.pcb_panel.list()[0]
  const boardGap = 2
  // cell width 10, 2 boards -> 2x1 grid
  // total width: 10 + boardGap + 10 = 22
  // total height: 10
  // panel width: 22 + 2*5 margin = 32
  // panel height: 10 + 2*5 margin = 20
  expect(pcb_panel.width).toBe(32)
  expect(pcb_panel.height).toBe(20)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-small-cell-dims")
})
