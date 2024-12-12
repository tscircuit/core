import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { layout } from "@tscircuit/layout"
import { Circuit } from "lib/Circuit"
import "lib/register-catalogue"
import React from "react"

test("component with both manual placement and explicit coordinates emits error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      layout={layout().manualEdits({
        pcb_placements: [
          {
            selector: ".R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
        ],
      })}
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
  expect(error.pcb_component_id).toBe("R1")
  const expectedMessage =
    "Component has both manual placement and explicit pcbX/pcbY coordinates. Manual placement will be ignored."
  expect(error.message).toBe(expectedMessage)
})
