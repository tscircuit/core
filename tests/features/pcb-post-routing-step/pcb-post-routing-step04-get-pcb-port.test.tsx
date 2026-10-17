import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("getPcbPort resolves a selector to its pcb_port", async () => {
  const { circuit } = getTestFixture()
  let port: any
  const hook: PcbPostRoutingFn = (ctx) => {
    port = ctx.getPcbPort(".R1 > .pin1")
  }
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep fn={hook} />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const r1Pin1 = circuit.selectOne(".R1 > .pin1") as any
  const r1 = circuit.selectOne(".R1") as any
  expect(port.pcb_port_id).toBe(r1Pin1.pcb_port_id)
  expect(port.pcb_component_id).toBe(r1.pcb_component_id)
})
