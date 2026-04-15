import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbHoleRotatedPillWithRectPad } from "circuit-json"

test("PlatedHole pill hole with rect pad shape preserves rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <platedhole
        pcbX={0}
        pcbY={0}
        shape="pill_hole_with_rect_pad"
        holeWidth="4mm"
        holeHeight="3mm"
        rectPadWidth="6mm"
        rectPadHeight="4mm"
        pcbRotation="45"
      />
    </board>,
  )

  circuit.render()

  const platedHoles =
    circuit.db.pcb_plated_hole.list() as PcbHoleRotatedPillWithRectPad[]

  expect(platedHoles.length).toBe(1)
  expect(platedHoles[0].shape).toBe("rotated_pill_hole_with_rect_pad")
  expect(platedHoles[0].hole_shape).toBe("rotated_pill")

  expect(platedHoles[0].hole_ccw_rotation).toBe(45)
  expect(platedHoles[0].rect_ccw_rotation).toBe(45)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
