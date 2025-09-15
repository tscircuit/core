import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual edit conflict warning for capacitor is triggered", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      {
        selector: "C1",
        center: {
          x: -1.451612903225806,
          y: 2.623655913978494,
        },
        relative_to: "group_center",
      },
    ],
  }

  circuit.add(
    <board width="10mm" height="10mm" manualEdits={manualEdits}>
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  )

  circuit.render()

  // Verify schematic warning is added to the database
  const warnings = circuit.db.pcb_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
})

test("manual edit conflict warning is triggered", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      {
        selector: "C1",
        center: { x: -1.4516, y: 2.6237 },
        relative_to: "group_center",
      },
    ],
  }

  circuit.add(
    <board width="10mm" height="10mm" manualEdits={manualEdits}>
      <resistor name="R1" footprint="0402" resistance="1k" schX={3} pcbX={3} />
      <capacitor
        name="C1"
        footprint="0402"
        capacitance="1000pF"
        schX={-3}
        pcbX={-3}
      />
    </board>,
  )

  circuit.render()
  const warnings = circuit.db.pcb_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
})

test("conflict with only pcbY mismatch", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      {
        selector: "R1",
        center: { x: 1, y: 5 },
        relative_to: "board_center",
      },
    ],
  }

  circuit.add(
    <board width="10mm" height="10mm" manualEdits={manualEdits}>
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        schX={0}
        pcbX={1}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.pcb_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
})

test("conflict with both pcbX and pcbY mismatch", () => {
  const { circuit } = getTestFixture()

  const manualEdits = {
    pcb_placements: [
      {
        selector: "C2",
        center: { x: 0, y: 0 },
        relative_to: "board_center",
      },
    ],
  }

  circuit.add(
    <board width="10mm" height="10mm" manualEdits={manualEdits}>
      <capacitor
        name="C2"
        footprint="0603"
        capacitance="220nF"
        pcbX={1}
        pcbY={1}
      />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.pcb_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
})

test("no warning if no manual edit provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R2"
        resistance="4.7k"
        footprint="0402"
        pcbX={2}
        pcbY={2}
      />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.pcb_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(0)
})
