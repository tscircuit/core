import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("drc: pcb-footprint-overlap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="USB1"
        footprint="dip4_w0.1in"
        pinLabels={{
          pin1: "GND",
          pin2: "VBUS",
          pin3: "DP",
          pin4: "DM",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )
  expect(overlapErrors.length).toBe(1)
  expect(overlapErrors[0]).toHaveProperty("message")
  expect(overlapErrors[0].message).toContain("overlap")
  expect(overlapErrors[0]).toHaveProperty("pcb_plated_hole_ids")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
