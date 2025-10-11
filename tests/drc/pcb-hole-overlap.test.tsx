import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Test for checking that PCB holes don't overlap
 *
 * This test creates a circuit with mounting holes positioned
 * to overlap, which should trigger a DRC error.
 */
test("design rule check detects overlapping holes", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with two holes at overlapping positions
  circuit.add(
    <board width="30mm" height="30mm">
      {/* Two mounting holes with overlapping positions (3mm diameter holes at same position) */}
      <hole name="H1" diameter="3mm" pcbX={5} pcbY={5} />
      <hole name="H2" diameter="3mm" pcbX={5} pcbY={5} />
      {/* Add resistors and trace to trigger routing and DRC checks */}
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="10k"
        pcbX={-5}
        pcbY={2}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check that we have holes
  const holes = circuitJson.filter((el) => el.type === "pcb_hole")
  expect(holes.length).toBe(2)

  // Check for footprint overlap errors (1 pair of overlapping holes)
  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )

  expect(overlapErrors.length).toBe(1)
  expect(overlapErrors[0]).toHaveProperty("message")
  expect(overlapErrors[0].message).toContain("overlap")

  // Verify error contains hole IDs
  expect(overlapErrors[0]).toHaveProperty("pcb_hole_ids")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
