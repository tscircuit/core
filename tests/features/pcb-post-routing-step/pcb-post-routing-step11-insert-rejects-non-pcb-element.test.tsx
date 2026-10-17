import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("insert rejects elements that are not pcb_*", async () => {
  const { circuit } = getTestFixture()
  let error: unknown
  const hook: PcbPostRoutingFn = (ctx) => {
    try {
      ctx.insert({ type: "source_component" } as any)
    } catch (e) {
      error = e
    }
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
  expect(String(error)).toMatch(
    /insert takes pcb_\* elements, not "source_component"/,
  )
})
