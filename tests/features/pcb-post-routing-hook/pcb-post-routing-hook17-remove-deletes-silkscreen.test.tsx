import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("remove deletes an element, here R2's silkscreen", async () => {
  const { circuit } = getTestFixture()
  const hook: PcbPostRoutingHook = (ctx) => {
    const r2 = ctx.getPcbComponent(".R2")!
    for (const e of ctx.getCircuitJson()) {
      if (
        e.type === "pcb_silkscreen_text" &&
        e.pcb_component_id === r2.pcb_component_id
      ) {
        ctx.remove(e.pcb_silkscreen_text_id)
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
  const r2 = circuit.selectOne(".R2") as any
  const r1 = circuit.selectOne(".R1") as any
  const silkOf = (id: string) =>
    circuit
      .getCircuitJson()
      .filter(
        (e) => e.type === "pcb_silkscreen_text" && e.pcb_component_id === id,
      )
  expect(silkOf(r2.pcb_component_id)).toHaveLength(0)
  expect(silkOf(r1.pcb_component_id).length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
