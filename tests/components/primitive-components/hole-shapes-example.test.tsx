import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Example: Creating pill-shaped holes", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      {/* Circular hole */}
      <hole diameter="2mm" pcbX={-10} pcbY={0} />

      {/* Pill-shaped hole (vertical) */}
      <hole shape="pill" width="2mm" height="5mm" pcbX={0} pcbY={0} />

      {/* Pill-shaped hole (horizontal) */}
      <hole shape="pill" width="5mm" height="2mm" pcbX={10} pcbY={0} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(3)

  // First hole - circle
  expect(pcbHoles[0].hole_shape).toBe("circle")
  expect((pcbHoles[0] as any).hole_diameter).toBe(2)

  // Second hole - pill (vertical)
  expect(pcbHoles[1].hole_shape).toBe("oval")
  expect((pcbHoles[1] as any).hole_width).toBe(2)
  expect((pcbHoles[1] as any).hole_height).toBe(5)

  // Third hole - pill (horizontal)
  expect(pcbHoles[2].hole_shape).toBe("oval")
  expect((pcbHoles[2] as any).hole_width).toBe(5)
  expect((pcbHoles[2] as any).hole_height).toBe(2)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
