import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB design rule checks report copper the hook inserted over another net's trace", async () => {
  const { circuit } = getTestFixture()
  const hook: PcbPostRoutingHook = (ctx) => {
    // R2.pin2 is on its own net; put its copper on the R1-R2 trace
    const port = ctx.getPcbPort(".R2 > .pin2")!
    const trace = ctx.getCircuitJson().find((e) => e.type === "pcb_trace")!
    const mid = trace.route[Math.floor(trace.route.length / 2)] as { x: number; y: number }
    ctx.insert({
      type: "pcb_smtpad",
      shape: "circle",
      x: mid.x,
      y: mid.y,
      radius: 0.3,
      layer: "top",
      port_hints: [],
      pcb_port_id: port.pcb_port_id,
      pcb_component_id: port.pcb_component_id,
    })
  }
  circuit.add(
    <board width="16mm" height="10mm" pcbPostRoutingHook={hook}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const messages = circuit
    .getCircuitJson()
    .filter((e) => e.type.endsWith("_error"))
    .map((e: any) => e.message as string)
  expect(
    messages.some((m) => /overlap|clearance/i.test(m) && /R2/.test(m)),
  ).toBe(true)
})
