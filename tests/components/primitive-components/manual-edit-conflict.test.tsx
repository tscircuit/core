import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import { layout } from "@tscircuit/layout"
import React from "react"
import { ManualEditConflictError } from "lib/errors/ManualEditConflictError"

test("component with manual placement and explicit coordinates emits error", () => {
  const { circuit } = getTestFixture()

  try {
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
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={10}
          pcbY={10}
        />
      </board>,
    )

    circuit.render()

    throw new Error(
      "Should not be able to render circuit where component has both manual placement and explicit coordinates",
    )
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(ManualEditConflictError)
    expect((e as ManualEditConflictError).message).toContain("R1")
    expect((e as ManualEditConflictError).message).toContain("manual placement")
    expect((e as ManualEditConflictError).message).toContain("pcbX")
    expect((e as ManualEditConflictError).message).toContain("pcbY")
  }
})
