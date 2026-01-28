import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel positions boards relative to subpanel offset", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="10mm" pcbY="20mm">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  // Board should be positioned at the subpanel's offset
  expect(boards[0].center.x).toBeCloseTo(10)
  expect(boards[0].center.y).toBeCloseTo(20)
})

test("subpanel at origin positions boards at origin", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX={0} pcbY={0}>
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  expect(boards[0].center.x).toBeCloseTo(0)
  expect(boards[0].center.y).toBeCloseTo(0)
})

test("subpanel respects panel position when positioning boards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" pcbX="5mm" pcbY="5mm" layoutMode="none">
      <subpanel pcbX="10mm" pcbY="10mm">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  // Board should be at panel position + subpanel offset = (5+10, 5+10) = (15, 15)
  expect(boards[0].center.x).toBeCloseTo(15)
  expect(boards[0].center.y).toBeCloseTo(15)
})

test("board with pcbX/pcbY inside subpanel positions relative to subpanel", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="10mm" pcbY="10mm" layoutMode="none">
        <board
          width="10mm"
          height="10mm"
          routingDisabled
          pcbX="5mm"
          pcbY="5mm"
        />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  // Board should be at subpanel offset + board offset = (10+5, 10+5) = (15, 15)
  expect(boards[0].center.x).toBeCloseTo(15)
  expect(boards[0].center.y).toBeCloseTo(15)
})
