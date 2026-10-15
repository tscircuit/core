import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("insert generates ids and rejects one given by the hook", async () => {
  const { circuit } = getTestFixture()
  let error: unknown
  const hook: PcbPostRoutingHook = (ctx) => {
    const port = ctx.getPcbPort(".R1 > .pin1")!
    try {
      ctx.insert({
        ...{
          type: "pcb_smtpad",
          shape: "circle",
          x: -4,
          y: 2,
          radius: 0.4,
          layer: "top",
          port_hints: [],
          pcb_port_id: port.pcb_port_id,
          pcb_component_id: port.pcb_component_id,
        },
        pcb_smtpad_id: "mine",
      } as any)
    } catch (e) {
      error = e
    }
  }
  circuit.add(
    <board width="16mm" height="10mm" pcbPostRoutingHook={hook}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(String(error)).toMatch(/pcb_smtpad_id is generated/)
})
