import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board grid layout positions components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" grid gridGap="1mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="10k" footprint="0402" />
      <resistor name="R3" resistance="10k" footprint="0402" />
      <resistor name="R4" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const r1 = circuit.selectOne(".R1")!
  const r2 = circuit.selectOne(".R2")!
  const r3 = circuit.selectOne(".R3")!
  const r4 = circuit.selectOne(".R4")!

  const c1 = circuit.db.pcb_component.get(r1.pcb_component_id!)!
  const c2 = circuit.db.pcb_component.get(r2.pcb_component_id!)!
  const c3 = circuit.db.pcb_component.get(r3.pcb_component_id!)!
  const c4 = circuit.db.pcb_component.get(r4.pcb_component_id!)!

  const xs = new Set([c1.center.x, c2.center.x, c3.center.x, c4.center.x])
  const ys = new Set([c1.center.y, c2.center.y, c3.center.y, c4.center.y])

  expect(xs.size).toBe(2)
  expect(ys.size).toBe(2)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
