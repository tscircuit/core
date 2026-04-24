import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbHolePillWithRectPad } from "circuit-json"

test("pcb circular hole rect plated", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={2}
        rectPadWidth={4}
        rectPadHeight={4}
        pcbX={-2}
        pcbY={-2}
      />
      <platedhole
        shape="pill_hole_with_rect_pad"
        holeShape="pill"
        padShape="rect"
        holeWidth={2}
        holeHeight={3}
        rectPadWidth={3}
        rectPadHeight={4}
        rectBorderRadius={0.5}
        pcbX={2}
        pcbY={2}
      />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  const pillHole = platedHoles.find(
    (hole) => hole.shape === "pill_hole_with_rect_pad",
  ) as PcbHolePillWithRectPad

  expect(pillHole).toBeDefined()
  expect(pillHole?.rect_border_radius).toBe(0.5)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
