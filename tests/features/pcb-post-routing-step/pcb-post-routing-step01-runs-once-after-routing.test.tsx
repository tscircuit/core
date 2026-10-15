import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("the step runs once, after routing, and sees the routed traces", async () => {
  const { circuit } = getTestFixture()
  const runs: number[] = []
  const hook: PcbPostRoutingFn = (ctx) => {
    runs.push(ctx.getCircuitJson().filter((e) => e.type === "pcb_trace").length)
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
  expect(runs).toHaveLength(1)
  expect(runs[0]).toBeGreaterThan(0)
})
