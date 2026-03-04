import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb constraint xDist with centerX for individual components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <constraint
        pcb
        centerToCenter
        left="R1"
        right="R2"
        xDist="10mm"
        centerX={0}
      />
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

  // The center of the pair should be at x=0
  const midpointX = (r1Pcb.center.x + r2Pcb.center.x) / 2
  expect(Math.abs(midpointX)).toBeLessThan(0.5)

  // The distance between centers should be 10mm
  const xDistance = Math.abs(r2Pcb.center.x - r1Pcb.center.x)
  expect(xDistance).toBeCloseTo(10, 0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
