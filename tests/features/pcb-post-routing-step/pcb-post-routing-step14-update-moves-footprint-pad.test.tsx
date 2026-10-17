import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("update changes an element the footprint created", async () => {
  const { circuit } = getTestFixture()
  let padId = ""
  const hook: PcbPostRoutingFn = (ctx) => {
    const r2 = ctx.getPcbComponent(".R2")!
    const pad = ctx
      .getCircuitJson()
      .find(
        (e) =>
          e.type === "pcb_smtpad" && e.pcb_component_id === r2.pcb_component_id,
      ) as any
    padId = pad.pcb_smtpad_id
    ctx.update(padId, { y: pad.y + 1 })
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
  const pad = circuit
    .getCircuitJson()
    .find((e) => e.type === "pcb_smtpad" && e.pcb_smtpad_id === padId) as any
  expect(pad.y).toBeCloseTo(1, 6)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
