import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbPack on one group should not affect sibling group's placements", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1" pcbPack>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
      </group>

      <group name="G2">
        {/* Explicit PCB positions that must remain unchanged */}
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Fetch G2 components and ensure their positions were not modified by G1's pcbPack
  const r3 = circuit.selectOne("resistor.R3") as any
  const r4 = circuit.selectOne("resistor.R4") as any

  const r3Pcb = circuit.db.pcb_component.get(r3.pcb_component_id!)!
  const r4Pcb = circuit.db.pcb_component.get(r4.pcb_component_id!)!

  expect(r3Pcb.center.x).toBeCloseTo(-4, 2)
  expect(r3Pcb.center.y).toBeCloseTo(0, 2)
  expect(r4Pcb.center.x).toBeCloseTo(4, 2)
  expect(r4Pcb.center.y).toBeCloseTo(0, 2)
})


