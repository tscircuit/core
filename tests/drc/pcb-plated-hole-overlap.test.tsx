import { test, expect } from "bun:test"
import type { PcbComponentOverlapError } from "@tscircuit/checks"
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

  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )
  expect(overlapErrors).toHaveLength(1)
  const overlap = overlapErrors[0] as PcbComponentOverlapError
  expect(overlap.message).toContain("U1 overlaps U2")
  expect(overlap.message).toContain("Move the components apart")
  expect(overlap.pcb_plated_hole_ids).toHaveLength(16)
  expect(overlap.related_errors).toHaveLength(45)
  expect(
    overlap.related_errors?.filter(
      (error) =>
        error.type === "pcb_footprint_overlap_error" &&
        error.pcb_plated_hole_ids?.length === 2,
    ),
  ).toHaveLength(14)
  expect(
    circuitJson.filter((el) => el.type === "pcb_pad_pad_clearance_error"),
  ).toHaveLength(0)
  expect(
    circuitJson.filter((el) => el.type === "pcb_courtyard_overlap_error"),
  ).toHaveLength(0)

  // Render all diagnostics: no filtering away the original regression.
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
