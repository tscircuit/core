import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel works with panel that has tabs", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="100mm"
      height="100mm"
      layoutMode="none"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
    >
      <subpanel pcbX="0mm" pcbY="0mm" layoutMode="grid" row={1} col={2}>
        <board width="20mm" height="20mm" routingDisabled />
        <board width="20mm" height="20mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Boards from subpanel should be positioned correctly
  for (const board of boards) {
    expect(board.position_mode).toBe("relative_to_panel_anchor")
  }
})

test("subpanel with components inside boards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="0mm" pcbY="0mm" layoutMode="grid" row={1} col={2}>
        <board width="20mm" height="20mm" routingDisabled>
          <resistor name="R1" resistance="1k" footprint="0805" />
        </board>
        <board width="20mm" height="20mm" routingDisabled>
          <capacitor name="C1" capacitance="100nF" footprint="0805" />
        </board>
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Components should exist
  const resistors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_component" && e.name === "R1")
  const capacitors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_component" && e.name === "C1")

  expect(resistors.length).toBe(1)
  expect(capacitors.length).toBe(1)
})

test("subpanel inside panel with grid layout", () => {
  const { circuit } = getTestFixture()

  // When panel has layoutMode=grid, it will lay out boards including those inside subpanels
  // The subpanel's position is determined by its contents
  circuit.add(
    <panel width="100mm" height="100mm" layoutMode="none">
      <subpanel pcbX="-15mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
      <subpanel pcbX="15mm" pcbY="0mm" layoutMode="grid">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Boards should be at opposite sides
  const leftBoard = boards.find((b) => b.center.x < 0)
  const rightBoard = boards.find((b) => b.center.x > 0)

  expect(leftBoard).toBeDefined()
  expect(rightBoard).toBeDefined()
  expect(leftBoard!.center.x).toBeCloseTo(-15)
  expect(rightBoard!.center.x).toBeCloseTo(15)
})
