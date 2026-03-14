import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Two 0603 capacitors, C2 rotated 45°, placed so their courtyards overlap.
 *
 * 0603 courtyard: width=2.95mm, height=1.45mm.
 * At 45°, AABB = (2.95 + 1.45) * cos(45°) ≈ 3.111mm on each side, half = 1.556mm.
 * C1 (0°) at (0,0): courtyard x=[-1.475, 1.475].
 * C2 (45°) at (2.7,0): courtyard x=[1.144, 4.256].
 * Courtyards overlap by ~0.331mm.
 *
 * 0603 pads: width=2.45mm, height=0.95mm.
 * C1 pads right edge = 1.225mm; C2 pads left edge ≈ 1.498mm → no pad overlap.
 */
test("drc courtyard overlap detects overlapping 0603 capacitors (one rotated 45°)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor
        name="C1"
        footprint="0603"
        capacitance="100nF"
        pcbX={0}
        pcbY={0}
      />
      <capacitor
        name="C2"
        footprint="0603"
        capacitance="100nF"
        pcbX={2.7}
        pcbY={0}
        pcbRotation={45}
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
