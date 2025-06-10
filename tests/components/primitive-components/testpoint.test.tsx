import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Testpoint primitive pad", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="TP1" padDiameter="1mm" pcbX={2} pcbY={3} />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBe(1)
  expect(pads[0].shape).toBe("circle")
  expect(pads[0].radius).toBe(0.5)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("Testpoint primitive through hole", () => {
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
  expect(holes[0].hole_diameter).toBeCloseTo(0.8)
})
