import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("update cannot change an element's type or id", async () => {
  const { circuit } = getTestFixture()
  const errors: string[] = []
  const hook: PcbPostRoutingHook = (ctx) => {
    const trace = ctx.getCircuitJson().find((e) => e.type === "pcb_trace")!
    for (const patch of [{ type: "pcb_via" }, { pcb_trace_id: "other" }]) {
      try {
        ctx.update(trace.pcb_trace_id, patch)
      } catch (e) {
        errors.push(String(e))
      }
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
  expect(errors).toHaveLength(2)
  for (const e of errors)
    expect(e).toMatch(/update cannot change type or pcb_trace_id/)
})
