import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component with both manual placement and explicit coordinates emits error", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: "R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={2} pcbY={2} />
    </board>,
  )
  circuit.render()
  // Verify error is added to the database
  const errors = circuit.db.pcb_manual_edit_conflict_error.list()
  expect(errors).toHaveLength(1)
  // Check error details
  const error = errors[0]
  expect(error.pcb_component_id).toBeDefined()
  const expectedMessage =
    '<resistor#0 name=".R1" /> has both manual placement and explicit coordinates. pcbX and pcbY will be used. Remove pcbX/pcbY or clear the manual placement.'
  expect(error.message).toBe(expectedMessage)
})
