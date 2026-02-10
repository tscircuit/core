import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("constraint with centerX positions both components correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <constraint pcb xDist="20mm" left=".R1" right=".R2" centerX={0} />
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

  // Check that the distance between components is approximately 20mm
  const distance = Math.abs(r2Pcb.center.x - r1Pcb.center.x)
  expect(distance).toBeCloseTo(20, 1)

  // Check that the midpoint between the two components is at x=0
  const midpoint = (r1Pcb.center.x + r2Pcb.center.x) / 2
  expect(midpoint).toBeCloseTo(0, 1)

  // This means R1 should be at approximately x=-10mm and R2 at x=10mm
  expect(r1Pcb.center.x).toBeCloseTo(-10, 1)
  expect(r2Pcb.center.x).toBeCloseTo(10, 1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
