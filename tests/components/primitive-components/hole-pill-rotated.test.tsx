import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbHoleRotatedPill } from "circuit-json"

test("Hole component with rotated pill shape", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole
        shape="pill"
        width="2mm"
        height="4mm"
        pcbX={-2}
        pcbY={0}
        pcbRotation={45}
      />
      <hole
        shape="pill"
        width="4mm"
        height="2mm"
        pcbX={2}
        pcbY={0}
        pcbRotation={-45}
      />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list() as PcbHoleRotatedPill[]

  expect(pcbHoles.length).toBe(2)

  // First hole: vertical pill (2mm × 4mm) rotated 45° CCW
  expect(pcbHoles[0].hole_shape).toBe("rotated_pill")
  expect(pcbHoles[0].hole_width).toBe(2)
  expect(pcbHoles[0].hole_height).toBe(4)
  expect(pcbHoles[0].x).toBe(-2)
  expect(pcbHoles[0].y).toBe(0)
  expect(pcbHoles[0].ccw_rotation).toBe(45)

  // Second hole: horizontal pill (4mm × 2mm) rotated -45° CCW to match visual direction
  expect(pcbHoles[1].hole_shape).toBe("rotated_pill")
  expect(pcbHoles[1].hole_width).toBe(4)
  expect(pcbHoles[1].hole_height).toBe(2)
  expect(pcbHoles[1].x).toBe(2)
  expect(pcbHoles[1].y).toBe(0)
  expect(pcbHoles[1].ccw_rotation).toBe(-45)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
