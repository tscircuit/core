import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("constraint with centerY positions both components correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <constraint pcb yDist="10mm" top=".R1" bottom=".R2" centerY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!

  const r1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!
  const r2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!

  // Check that the distance between components is approximately 10mm
  const distance = Math.abs(r1Pcb.center.y - r2Pcb.center.y)
  expect(distance).toBeCloseTo(10, 1)

  // Check that the midpoint between the two components is at y=0
  const midpoint = (r1Pcb.center.y + r2Pcb.center.y) / 2
  expect(midpoint).toBeCloseTo(0, 1)

  // This means R1 (top) should be at approximately y=5mm and R2 (bottom) at y=-5mm
  expect(r1Pcb.center.y).toBeCloseTo(5, 1)
  expect(r2Pcb.center.y).toBeCloseTo(-5, 1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
