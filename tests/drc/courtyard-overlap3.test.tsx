import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Two 0805 inductors, L2 rotated 90°, placed so their courtyards overlap.
 *
 * 0805 courtyard: width=3.35mm, height=1.9mm.
 * L1 (0°) at (0,0): courtyard x=[-1.675, 1.675], y=[-0.95, 0.95].
 * L2 (90°) at (2.5, 0): with pcb_courtyard_outline the polygon rotates correctly,
 *   so effective x=[-0.95,0.95], y=[-1.675,1.675] shifted → x=[1.55, 3.45].
 * Courtyards overlap in x at [1.55, 1.675].
 * Pads of L2 are at x=2.5±0.5125, well clear of L1's pads ending at x=1.425.
 */
test("drc courtyard overlap detects overlapping 0805 inductors (one rotated 90°)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <inductor
        name="L1"
        footprint="0805"
        inductance="10uH"
        pcbX={0}
        pcbY={0}
      />
      <inductor
        name="L2"
        footprint="0805"
        inductance="10uH"
        pcbX={2.5}
        pcbY={0}
        pcbRotation={90}
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
