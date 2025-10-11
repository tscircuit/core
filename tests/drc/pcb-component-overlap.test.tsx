import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Test for checking that PCB component pads don't overlap inappropriately
 *
 * This test creates a circuit with two resistors positioned so their pads overlap,
 * which should trigger a DRC error for component overlap.
 */
test("design rule check detects overlapping PCB component pads", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with two resistors positioned so their pads overlap
  // 0402 footprint is ~1mm x 0.5mm, with pads on each end
  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={0} pcbY={0} />
      {/* Position R2 close enough that pads overlap (~0.3mm offset) */}
      <resistor
        name="R2"
        footprint="0402"
        resistance="10k"
        pcbX={0.3}
        pcbY={0}
      />
      {/* Add a trace to trigger routing and DRC checks */}
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check that we have PCB components
  const pcbComponents = circuitJson.filter((el) => el.type === "pcb_component")
  expect(pcbComponents.length).toBe(2)

  // Check that we have SMT pads (2 resistors with 2 pads each = 4 pads)
  const smtPads = circuitJson.filter((el) => el.type === "pcb_smtpad")
  expect(smtPads.length).toBe(4)

  // Check for footprint overlap errors (2 pads overlap between the two resistors)
  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )

  expect(overlapErrors.length).toBe(2)
  expect(overlapErrors[0]).toHaveProperty("message")
  expect(overlapErrors[0].message).toContain("overlap")
  expect(overlapErrors[0]).toHaveProperty("pcb_smtpad_ids")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
