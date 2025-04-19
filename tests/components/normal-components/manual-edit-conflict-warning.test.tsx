import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emits schematic warning when both manual placement and explicit coordinates are defined", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" schX={2} schY={2} />
    </board>,
  )

  circuit.render()

  // Verify schematic warning is added to the database
  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)

  // Check warning details
  const warning = warnings[0]
  expect(warning.schematic_component_id).toBeDefined()
  expect(warning.source_component_id).toBeDefined()
  expect(warning.subcircuit_id).toBeDefined()
  expect(warning.message).toMatch(
    /has both manual placement and explicit coordinates/,
  )
})

test("emits PCB warning when both manual placement and explicit coordinates are defined", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: "R1",
            center: { x: 10, y: 10 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={15}
        pcbY={15}
      />
    </board>,
  )

  circuit.render()

  // Verify PCB warning is added to the database
  const warnings = circuit.db.pcb_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)

  // Check warning details
  const warning = warnings[0]
  expect(warning.pcb_component_id).toBeDefined()
  expect(warning.source_component_id).toBeDefined()
  expect(warning.subcircuit_id).toBeDefined()
  expect(warning.message).toMatch(
    /has both manual placement and explicit coordinates/,
  )
})
