import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("update validates the changed element against its circuit-json schema", async () => {
  const { circuit } = getTestFixture()
  let error: unknown
  let traceId = ""
  const hook: PcbPostRoutingHook = (ctx) => {
    const trace = ctx.getCircuitJson().find((e) => e.type === "pcb_trace")!
    traceId = trace.pcb_trace_id
    try {
      ctx.update(traceId, { route: "not a route" })
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
  expect(String(error)).toMatch(/invalid pcb_trace/)
  const trace = circuit
    .getCircuitJson()
    .find((e) => e.type === "pcb_trace" && e.pcb_trace_id === traceId) as any
  expect(Array.isArray(trace.route)).toBe(true)
})
