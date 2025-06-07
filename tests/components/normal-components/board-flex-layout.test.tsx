import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board flex layout positions schematic components in a row", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      schLayout={{ flex: true, flexDirection: "row", gap: 1 }}
      width="20mm"
      height="20mm"
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="10k" footprint="0402" />
      <resistor name="R3" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const r1 = circuit.selectOne(".R1")!
  const r2 = circuit.selectOne(".R2")!
  const r3 = circuit.selectOne(".R3")!

  const c1 = circuit.db.schematic_component.get(r1.schematic_component_id!)!
  const c2 = circuit.db.schematic_component.get(r2.schematic_component_id!)!
  const c3 = circuit.db.schematic_component.get(r3.schematic_component_id!)!

  const ys = new Set([c1.center.y, c2.center.y, c3.center.y])
  expect(ys.size).toBe(1)
  expect(c2.center.x).toBeGreaterThan(c1.center.x)
  expect(c3.center.x).toBeGreaterThan(c2.center.x)
})
