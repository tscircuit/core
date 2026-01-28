import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with layoutMode=none uses explicit board positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="none" pcbX="10mm" pcbY="10mm">
        <board
          width="10mm"
          height="10mm"
          routingDisabled
          pcbX="5mm"
          pcbY="5mm"
        />
        <board
          width="10mm"
          height="10mm"
          routingDisabled
          pcbX="-5mm"
          pcbY="-5mm"
        />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Find boards by their positions
  const board1 = boards.find(
    (b) => Math.abs(b.center.x - 15) < 0.1 && Math.abs(b.center.y - 15) < 0.1,
  )
  const board2 = boards.find(
    (b) => Math.abs(b.center.x - 5) < 0.1 && Math.abs(b.center.y - 5) < 0.1,
  )

  expect(board1).toBeDefined()
  expect(board2).toBeDefined()
})

test("subpanel with layoutMode=none errors on multiple unpositioned boards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="none">
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const errors = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        "error_type" in element && element.error_type === "pcb_placement_error",
    )

  expect(errors.length).toBe(1)
  expect((errors[0] as any).message).toContain(
    "Multiple boards in subpanel without pcbX/pcbY positions",
  )
})

test("subpanel with layoutMode=none allows single unpositioned board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel layoutMode="none" pcbX="15mm" pcbY="15mm">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  // Board should be at subpanel position
  expect(boards[0].center.x).toBeCloseTo(15)
  expect(boards[0].center.y).toBeCloseTo(15)

  // No placement errors
  const errors = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        "error_type" in element && element.error_type === "pcb_placement_error",
    )
  expect(errors.length).toBe(0)
})

test("subpanel layoutMode=none defaults when not specified", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="10mm" pcbY="10mm">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)

  // Default layoutMode should be "none"
  expect(boards[0].center.x).toBeCloseTo(10)
  expect(boards[0].center.y).toBeCloseTo(10)
})
