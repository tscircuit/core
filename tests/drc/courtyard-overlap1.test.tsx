import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Two 0402 resistors stacked vertically 0.9mm apart.
 *
 * 0402 courtyard height = 1.14mm → overlap when vertical dist < 1.14mm.
 * 0402 pad height = 0.64mm → no pad overlap when vertical dist > 0.64mm.
 * At 0.9mm vertical spacing: courtyards overlap, pads are clear.
 */
test("drc courtyard overlap detects overlapping 0402 resistors (vertical)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pcbX={0}
        pcbY={-0.45}
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="10k"
        pcbX={0}
        pcbY={0.45}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const padOverlapErrors = circuitJson.filter(
    (e: any) => e.type === "pcb_footprint_overlap_error",
  )
  expect(padOverlapErrors.length).toBe(0)

  const courtyardErrors = circuitJson.filter(
    (e: any) => e.type === "pcb_courtyard_overlap_error",
  )
  expect(courtyardErrors.length).toBeGreaterThan(0)
  expect((courtyardErrors[0] as any).message).toContain("overlaps")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
