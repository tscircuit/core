import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Two 0603 capacitors placed diagonally 2.5mm apart (dx=2, dy=1.5).
 *
 * 0603 courtyard: width=2.95mm, height=1.45mm.
 * At dx=2: horizontal courtyard clearance = 2.95 - 2 = 0.95mm overlap.
 * At dy=1.5: vertical courtyard clearance = 1.45 - 1.5 = -0.05mm (overlap).
 * Pads (width=2.45mm, height=0.95mm): dx=2 > pad-width gap needed, dy=1.5 > 0.95 → no pad overlap.
 */
test("drc courtyard overlap detects overlapping 0603 capacitors (diagonal)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor
        name="C1"
        footprint="0603"
        capacitance="100nF"
        pcbX={-1}
        pcbY={-0.75}
      />
      <capacitor
        name="C2"
        footprint="0603"
        capacitance="100nF"
        pcbX={1}
        pcbY={0.75}
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
  expect(courtyardErrors.length).toBe(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
