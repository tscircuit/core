import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack respects centerX constraint even if components exceed board boundaries", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      {/* @ts-expect-error: centerX/centerY are not yet in @tscircuit/props */}
      <constraint pcb xDist="5mm" left=".R1" right=".R2" centerX={50} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!

  const r1 = circuit.db.pcb_component.getWhere({ source_component_id: r1Source.source_component_id })!
  const r2 = circuit.db.pcb_component.getWhere({ source_component_id: r2Source.source_component_id })!

  const r1Center = {
    x: r1.center.x,
    y: r1.center.y,
  }
  const r2Center = {
    x: r2.center.x,
    y: r2.center.y,
  }

  // Check xDist
  expect(Math.abs(r2Center.x - r1Center.x)).toBeCloseTo(5, 1)

  // Check centerX
  // (r1.x + r2.x) / 2 should be close to 50
  expect((r1Center.x + r2Center.x) / 2).toBeCloseTo(50, 0.1)

  // Verify at least one component is outside the board (X > 5 or X < -5)
  // Board is 10mm wide, centered at (0,0) by default. So bounds are -5 to 5.
  // We placed center at 50, so both components should be > 5.
  expect(r1Center.x).toBeGreaterThan(5)
  expect(r2Center.x).toBeGreaterThan(5)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
