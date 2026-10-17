import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a re-run starts from the original values of what the previous run updated", async () => {
  const { circuit } = getTestFixture()
  let runs = 0
  const hook: PcbPostRoutingFn = (ctx) => {
    runs++
    const r2 = ctx.getPcbComponent(".R2")!
    const pad = ctx
      .getCircuitJson()
      .find(
        (e) =>
          e.type === "pcb_smtpad" && e.pcb_component_id === r2.pcb_component_id,
      ) as any
    ctx.update(pad.pcb_smtpad_id, { y: pad.y + 1 })
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
  // getCircuitJson() is live; keep a copy of the board after the first run
  const afterFirstRun = structuredClone(circuit.getCircuitJson())

  // Re-routing (anything at or before the step's phase going dirty) undoes the
  // step's changes, then the step runs again on the restored board
  ;(circuit.children[0] as any)._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()
  expect(runs).toBe(2)
  const final = circuit.getCircuitJson()
  const r2PadY = (cj: any[]) => {
    const r2 = circuit.selectOne(".R2") as any
    return (
      cj.find(
        (e) =>
          e.type === "pcb_smtpad" && e.pcb_component_id === r2.pcb_component_id,
      ) as any
    ).y
  }
  // moved by 1 mm once, not twice
  expect(r2PadY(afterFirstRun)).toBeCloseTo(1, 6)
  expect(r2PadY(final)).toBeCloseTo(1, 6)
})
