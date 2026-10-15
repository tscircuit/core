import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("getPcbComponent resolves a selector to its pcb_component", async () => {
  const { circuit } = getTestFixture()
  let component: any
  let missing: any = "unset"
  const hook: PcbPostRoutingFn = (ctx) => {
    component = ctx.getPcbComponent(".R2")
    missing = ctx.getPcbComponent(".R9")
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
  const r2 = circuit.selectOne(".R2") as any
  expect(component.pcb_component_id).toBe(r2.pcb_component_id)
  expect(missing).toBeUndefined()
})
