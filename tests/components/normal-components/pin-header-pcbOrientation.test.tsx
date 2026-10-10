import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardSize = { width: "10mm", height: "10mm" }

test("pinheader pcbOrientation vertical places pins vertically", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board {...boardSize}>
      <pinheader name="J1" pinCount={2} pcbOrientation="vertical" />
    </board>,
  )

  circuit.render()

  const [pin1, pin2] = circuit.db.pcb_plated_hole.list()
  expect(pin1!.x).toBeCloseTo(pin2!.x)
  expect(Math.abs(pin1!.y - pin2!.y)).toBeCloseTo(2.54)

  // The footprint turns J1's label with the pins; label placement turns it
  // back to read from the bottom or the right edge
  const [label] = circuit.db.pcb_silkscreen_text.list()
  expect(label!.text).toBe("J1")
  expect([0, 90]).toContain(label!.ccw_rotation!)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
