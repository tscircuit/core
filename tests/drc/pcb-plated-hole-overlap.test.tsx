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

  expect(overlapErrors.length).toBe(8)
  expect(overlapErrors[0]).toHaveProperty("message")
  expect(overlapErrors[0].message).toContain("overlap")

  // Verify error contains plated hole IDs
  expect(overlapErrors[0]).toHaveProperty("pcb_plated_hole_ids")

  // Add error indicators to circuit JSON for visual regression detection
  for (let i = 0; i < overlapErrors.length; i++) {
    const error = overlapErrors[i] as any
    const holeIds = error.pcb_plated_hole_ids || []
    if (holeIds.length >= 2) {
      const hole1: any = platedHoles.find(
        (h: any) => h.pcb_plated_hole_id === holeIds[0],
      )
      const hole2: any = platedHoles.find(
        (h: any) => h.pcb_plated_hole_id === holeIds[1],
      )
      if (hole1 && hole2 && hole1.x !== undefined && hole2.x !== undefined) {
        const centerX = (hole1.x + hole2.x) / 2
        const centerY = (hole1.y + hole2.y) / 2
        circuit.db.pcb_silkscreen_text.insert({
          pcb_component_id: "",
          anchor_position: { x: centerX, y: centerY - 1.5 },
          anchor_alignment: "center",
          font: "tscircuit2024",
          font_size: 0.6,
          layer: "top",
          text: "⚠ HOLE OVERLAP",
        })
      }
    }
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
