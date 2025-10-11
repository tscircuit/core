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
        pcbX={0.8}
        pcbY={0}
      />
      {/* Add extra components far from overlap area to trigger DRC checks */}
      <resistor
        name="R2"
        footprint="0402"
        resistance="10k"
        pcbX={-5}
        pcbY={5}
      />
      <resistor name="R3" footprint="0402" resistance="10k" pcbX={5} pcbY={5} />
      {/* Trace between components that don't overlap */}
      <trace from=".R2 > .pin1" to=".R3 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check for footprint overlap errors (2 pad pairs overlap)
  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )

  expect(overlapErrors.length).toBe(1)
  expect(overlapErrors[0].message).toContain("overlap")
  expect(overlapErrors[0]).toHaveProperty("pcb_smtpad_ids")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
