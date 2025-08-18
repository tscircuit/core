import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbPack on one group should not affect sibling even if they share a net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <net name="SHARED" />

      <group name="G1" pcbPack>
        <resistor name="R1" resistance="1k" footprint="0402" connections={{ pin1: "net.SHARED" }} />
        <capacitor name="C1" capacitance="100nF" footprint="0402" connections={{ pin1: "net.SHARED" }} />
      </group>

      <group name="G2">
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={-6} pcbY={1} connections={{ pin1: "net.SHARED" }} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={6} pcbY={-1} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const r3 = circuit.selectOne("resistor.R3") as any
  const r4 = circuit.selectOne("resistor.R4") as any
  const r3Pcb = circuit.db.pcb_component.get(r3.pcb_component_id!)!
  const r4Pcb = circuit.db.pcb_component.get(r4.pcb_component_id!)!

  expect(r3Pcb.center.x).toBeCloseTo(-6, 2)
  expect(r3Pcb.center.y).toBeCloseTo(1, 2)
  expect(r4Pcb.center.x).toBeCloseTo(6, 2)
  expect(r4Pcb.center.y).toBeCloseTo(-1, 2)
})


