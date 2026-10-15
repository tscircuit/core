import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("insert validates the element against its circuit-json schema", async () => {
  const { circuit } = getTestFixture()
  let error: unknown
  const hook: PcbPostRoutingHook = (ctx) => {
    const port = ctx.getPcbPort(".R1 > .pin1")!
    try {
      // a circle pad without a radius
      ctx.insert({
        type: "pcb_smtpad",
        shape: "circle",
        x: 0,
        y: 0,
        layer: "top",
        pcb_port_id: port.pcb_port_id,
      })
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
  expect(String(error)).toMatch(/invalid pcb_smtpad/)
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_smtpad" && e.shape === "circle"),
  ).toHaveLength(0)
})
