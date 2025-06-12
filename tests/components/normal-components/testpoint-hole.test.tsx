import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbSmtPadCircle, PcbPlatedHoleCircle } from "circuit-json"

test("Testpoint through hole", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint
        name="TP2"
        footprintVariant="through_hole"
        holeDiameter="0.8mm"
        padDiameter="1.2mm"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes.length).toBe(1)
  expect(holes[0].shape).toBe("circle")
  expect((holes[0] as PcbPlatedHoleCircle).hole_diameter).toBeCloseTo(0.8)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
