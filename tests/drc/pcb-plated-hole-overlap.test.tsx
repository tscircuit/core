import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Test for checking that PCB plated holes don't overlap
 *
 * This test creates a circuit with two chips positioned so some of their
 * plated holes overlap, which should trigger a DRC error.
 */
test("design rule check detects overlapping plated holes", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with two chips positioned so plated holes overlap
  // DIP8 has standard 2.54mm (100mil) pin spacing
  circuit.add(
    <board width="30mm" height="30mm">
      {/* Two chips positioned so some holes overlap */}
      <chip name="U1" footprint="dip8" pcbX={0} pcbY={0} />
      <chip name="U2" footprint="dip8" pcbX={0} pcbY={1} />
      {/* Add a trace to trigger routing and DRC checks */}
      <trace from=".U1 > .pin1" to=".U2 > .pin8" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check that we have plated holes (2 DIP8 chips with 8 pins each = 16 holes)
  const platedHoles = circuitJson.filter((el) => el.type === "pcb_plated_hole")
  expect(platedHoles.length).toBe(16)

  // Check for footprint overlap errors
  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )

  expect(overlapErrors.length).toBe(12)
  expect(overlapErrors[0]).toHaveProperty("message")
  expect(overlapErrors[0].message).toContain("overlap")

  // Verify error contains plated hole IDs
  expect(overlapErrors[0]).toHaveProperty("pcb_plated_hole_ids")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
