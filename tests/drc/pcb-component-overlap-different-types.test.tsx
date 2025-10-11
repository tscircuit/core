import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Test for checking pad overlap between different component types
 */
test("design rule check detects pad overlap between different component types", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with a resistor and capacitor with overlapping pads
  circuit.add(
    <board width="20mm" height="20mm">
      {/* Different component types positioned so pads overlap */}
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={0} pcbY={0} />
      <capacitor
        name="C1"
        footprint="0402"
        capacitance="10uF"
        pcbX={0.3}
        pcbY={0}
      />
      {/* Add a trace to trigger routing and DRC checks */}
      <trace from=".R1 > .pin1" to=".C1 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check for footprint overlap errors (2 pad pairs overlap)
  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )

  expect(overlapErrors.length).toBe(2)
  expect(overlapErrors[0].message).toContain("overlap")
  expect(overlapErrors[0]).toHaveProperty("pcb_smtpad_ids")

  // Add error indicators to circuit JSON for visual regression detection
  const smtPads = circuitJson.filter((el) => el.type === "pcb_smtpad")
  for (let i = 0; i < overlapErrors.length; i++) {
    const error = overlapErrors[i] as any
    const smtPadIds = error.pcb_smtpad_ids || []
    if (smtPadIds.length >= 2) {
      const pad1: any = smtPads.find(
        (p: any) => p.pcb_smtpad_id === smtPadIds[0],
      )
      const pad2: any = smtPads.find(
        (p: any) => p.pcb_smtpad_id === smtPadIds[1],
      )
      if (pad1 && pad2 && pad1.x !== undefined && pad2.x !== undefined) {
        const centerX = (pad1.x + pad2.x) / 2
        const centerY = (pad1.y + pad2.y) / 2
        // Offset text vertically to avoid overlap (one above, one below)
        const yOffset = i % 2 === 0 ? -1.2 : 1.2
        circuit.db.pcb_silkscreen_text.insert({
          pcb_component_id: "",
          anchor_position: { x: centerX + 1, y: centerY + yOffset },
          anchor_alignment: "center",
          font: "tscircuit2024",
          font_size: 0.3,
          layer: "top",
          text: "⚠ OVERLAP",
        })
      }
    }
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
