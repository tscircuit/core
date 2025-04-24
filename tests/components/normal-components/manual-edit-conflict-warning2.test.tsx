import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual edit conflict warning2 repro", () => {
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
