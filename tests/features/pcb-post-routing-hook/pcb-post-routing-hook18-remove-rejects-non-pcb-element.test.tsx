import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("remove and update refuse non-pcb elements", async () => {
  const { circuit } = getTestFixture()
  const errors: string[] = []
  const hook: PcbPostRoutingHook = (ctx) => {
    const source = ctx
      .getCircuitJson()
      .find((e) => e.type === "source_component")!
    try {
      ctx.remove(source.source_component_id)
    } catch (e) {
      errors.push(String(e))
    }
    try {
      ctx.update(source.source_component_id, { name: "X" })
    } catch (e) {
      errors.push(String(e))
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
    expect(e).toMatch(/only pcb_\* elements can be changed/)
  expect(
    circuit.getCircuitJson().filter((e) => e.type === "source_component"),
  ).toHaveLength(2)
})
