import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Repro for Issue #1226:
 * Ensure solderjumpers placed in a rotated group inherit the group's rotation
 */
test("matchpack: solderjumper should inherit group rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1" pcbRotation={90}>
        <chip name="U1" />
        <resistor name="R1" resistance="10k" />
        <solderjumper name="SJ1" />
      </group>
    </board>,
  )

  circuit.render()

  // Grab source elements
  const u1 = circuit.selectOne("chip.U1") as any
  const r1 = circuit.selectOne("resistor.R1") as any
  const sj1 = circuit.selectOne("solderjumper.SJ1") as any

  // Look up their PCB components to check actual rotations
  const pcbU1 = circuit.db.pcb_component.get(u1.pcb_component_id)!
  const pcbR1 = circuit.db.pcb_component.get(r1.pcb_component_id)!
  const pcbSJ1 = circuit.db.pcb_component.get(sj1.pcb_component_id)!

  // Assert solderjumper inherits the same rotation as other parts in the group
  expect(pcbSJ1.rotation).toBe(pcbU1.rotation)
  expect(pcbSJ1.rotation).toBe(pcbR1.rotation)
})
